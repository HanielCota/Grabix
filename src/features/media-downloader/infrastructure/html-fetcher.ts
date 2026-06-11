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

async function fetchWithHttp(rawUrl: string, signal?: AbortSignal): Promise<{ html: string; resolvedUrl: string }> {
  let response: Response;
  let resolvedUrl = rawUrl;
  try {
    const result = await safeFetch(rawUrl, {
      timeoutMs: appConfig.limits.fetchTimeoutMs,
      signal,
      headers: {
        "User-Agent": appConfig.userAgent,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    response = result.response;
    resolvedUrl = result.resolvedUrl;
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
      throw Errors.fetchFailed("Timeout ao buscar página.");
    }
    throw Errors.fetchFailed(networkErrorReason(err));
  }

  if (!response.ok) {
    const reason = HTTP_ERROR_MESSAGES[response.status] ?? `A pagina retornou status ${response.status}.`;
    throw Errors.fetchFailed(reason);
  }

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
