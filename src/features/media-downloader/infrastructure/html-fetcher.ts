import { isJsRenderingAvailable, renderPage } from "@/lib/rendering/js-renderer";
import { appConfig } from "@/server/config";
import { safeFetch } from "@/server/safe-fetch";
import { AppError, Errors } from "../domain/errors";

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  401: "Essa pagina exige login. O Grabix so acessa paginas publicas.",
  403: "Acesso negado pelo servidor. A pagina pode estar protegida ou bloqueando bots.",
  404: "Pagina nao encontrada. Verifica se a URL esta correta.",
  429: "O servidor limitou as requisicoes. Tenta de novo em alguns minutos.",
  500: "O servidor da pagina esta com erro interno. Tenta de novo mais tarde.",
  502: "O servidor da pagina esta fora do ar (Bad Gateway).",
  503: "O servidor da pagina esta indisponivel no momento. Tenta de novo depois.",
};

// Turn a low-level connection failure into an actionable reason (shown in the
// admin "URLs com falha" log). undici wraps the socket error in `err.cause`.
function networkErrorReason(err: unknown): string {
  let cause: unknown = err;
  if (err instanceof Error && err.cause) cause = err.cause;
  const code =
    cause && typeof cause === "object" && "code" in cause && typeof (cause as { code: unknown }).code === "string"
      ? (cause as { code: string }).code
      : undefined;

  switch (code) {
    case "ENOTFOUND":
    case "EAI_AGAIN":
      return "Dominio nao encontrado (DNS).";
    case "ECONNREFUSED":
      return "Conexao recusada pelo servidor.";
    case "ECONNRESET":
    case "UND_ERR_SOCKET":
      return "Conexao encerrada pelo servidor (pode estar bloqueando bots ou IPs de datacenter).";
    case "ETIMEDOUT":
    case "UND_ERR_CONNECT_TIMEOUT":
      return "Tempo de conexao esgotado.";
    case "EHOSTUNREACH":
    case "ENETUNREACH":
      return "Servidor inacessivel.";
    case "CERT_HAS_EXPIRED":
    case "DEPTH_ZERO_SELF_SIGNED_CERT":
    case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
    case "ERR_TLS_CERT_ALTNAME_INVALID":
      return "Certificado SSL invalido.";
    default:
      return code ? `Erro de rede (${code}).` : "Erro de rede.";
  }
}

export async function fetchPageHtml(
  rawUrl: string,
  signal?: AbortSignal,
  opts?: { allowJsRendering?: boolean },
): Promise<{
  html: string;
  resolvedUrl: string;
}> {
  if (!rawUrl?.trim()) {
    throw Errors.invalidUrl("URL não pode ser vazia.");
  }

  // Try JS rendering first when enabled AND the caller's plan allows it.
  if (opts?.allowJsRendering !== false && (await isJsRenderingAvailable())) {
    return fetchWithJsRendering(rawUrl, signal);
  }

  return fetchWithHttp(rawUrl, signal);
}

async function fetchWithJsRendering(
  rawUrl: string,
  signal?: AbortSignal,
): Promise<{ html: string; resolvedUrl: string }> {
  try {
    const result = await renderPage(rawUrl, signal);

    if (!result.html) {
      throw Errors.fetchFailed("HTML vazio recebido.");
    }

    if (result.html.length > appConfig.limits.maxHtmlSizeBytes) {
      throw Errors.htmlTooLarge();
    }

    return result;
  } catch (err) {
    if (err instanceof AppError) throw err;

    if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
      throw Errors.fetchFailed("Timeout ao renderizar página.");
    }

    // Fall back to HTTP fetch if JS rendering fails
    // biome-ignore lint/suspicious/noConsole: intentional fallback warning for operators
    console.warn(`[Grabix] JS rendering failed for ${rawUrl}, falling back to HTTP: ${err}`);
    return fetchWithHttp(rawUrl, signal);
  }
}

const GRABIX_HEADERS: Record<string, string> = {
  "User-Agent": appConfig.userAgent,
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "en-US,en;q=0.9",
};

// Browser-like identity used ONLY as a fallback when the default request looks
// blocked (connection dropped or HTTP 403) - some WAFs reject the Grabix UA.
const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Upgrade-Insecure-Requests": "1",
};

type FetchAttempt =
  | { ok: true; response: Response; resolvedUrl: string }
  | { ok: false; retryable: boolean; error: AppError };

async function tryFetch(
  rawUrl: string,
  signal: AbortSignal | undefined,
  headers: Record<string, string>,
): Promise<FetchAttempt> {
  try {
    const { response, resolvedUrl } = await safeFetch(rawUrl, {
      timeoutMs: appConfig.limits.fetchTimeoutMs,
      signal,
      headers,
    });
    if (!response.ok) {
      const reason = HTTP_ERROR_MESSAGES[response.status] ?? `A pagina retornou status ${response.status}.`;
      // 403 is the usual "bot blocked" signal - worth a browser-identity retry.
      return { ok: false, retryable: response.status === 403, error: Errors.fetchFailed(reason) };
    }
    return { ok: true, response, resolvedUrl };
  } catch (err) {
    // SSRF/redirect (AppError) and timeouts are genuine - never retry them.
    if (err instanceof AppError) return { ok: false, retryable: false, error: err };
    if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
      return { ok: false, retryable: false, error: Errors.fetchFailed("Timeout ao buscar página.") };
    }
    // Connection-level failure (reset/refused/…) - a browser identity may pass.
    return { ok: false, retryable: true, error: Errors.fetchFailed(networkErrorReason(err)) };
  }
}

async function fetchWithHttp(rawUrl: string, signal?: AbortSignal): Promise<{ html: string; resolvedUrl: string }> {
  // Primary attempt with the default Grabix identity. The happy path is unchanged.
  let attempt = await tryFetch(rawUrl, signal, GRABIX_HEADERS);

  // Alternative ONLY on a block-like failure: retry once pretending to be a
  // browser. If the alternative also fails, the primary error is kept.
  if (!attempt.ok && attempt.retryable) {
    const fallback = await tryFetch(rawUrl, signal, BROWSER_HEADERS);
    if (fallback.ok) attempt = fallback;
  }

  if (!attempt.ok) {
    throw attempt.error;
  }

  const { response, resolvedUrl } = attempt;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw Errors.notHtml();
  }

  const contentLengthRaw = response.headers.get("content-length");
  if (contentLengthRaw) {
    const size = parseInt(contentLengthRaw, 10);
    if (!Number.isNaN(size) && size > appConfig.limits.maxHtmlSizeBytes) {
      throw Errors.htmlTooLarge();
    }
  }

  const html = await response.text();
  if (!html) {
    throw Errors.fetchFailed("HTML vazio recebido.");
  }

  if (html.length > appConfig.limits.maxHtmlSizeBytes) {
    throw Errors.htmlTooLarge();
  }

  return { html, resolvedUrl };
}
