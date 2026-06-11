import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { Agent, fetch as undiciFetch } from "undici";
import { Errors } from "@/features/media-downloader/domain/errors";
import { isPrivateHostname } from "@/lib/url/public-url";
import { validateDnsResolution, validateUrlFormat } from "./security";

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

// ─── SSRF-guarded dispatcher ───
//
// The pre-flight checks (validateUrlFormat + validateDnsResolution) reject bad
// hosts before we connect, but fetch() re-resolves DNS on its own — leaving a
// DNS-rebinding (TOCTOU) gap where a host validated as public could resolve to a
// private address at connection time. This dispatcher performs the private-IP
// check inside the connection's own DNS lookup, so the address that is validated
// is the exact address connected to. TLS still uses the original hostname for
// SNI/certificate verification.
const ssrfGuardedAgent = new Agent({
  connect: {
    lookup(hostname, options, callback) {
      const wantsAll = options?.all === true;
      dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
        if (err) {
          callback(err, "", 0);
          return;
        }
        const list = (Array.isArray(addresses) ? addresses : [addresses]) as LookupAddress[];
        if (list.length === 0) {
          callback(new Error("DNS_NO_ADDRESS"), "", 0);
          return;
        }
        // Reject if ANY resolved record is private (prevents mixed-record bypass).
        if (list.some((a) => isPrivateHostname(a.address))) {
          callback(new Error("SSRF_BLOCKED_AT_CONNECT"), "", 0);
          return;
        }
        if (wantsAll) {
          callback(null, list);
        } else {
          callback(null, list[0].address, list[0].family);
        }
      });
    },
  },
});

interface SafeFetchOptions extends Omit<RequestInit, "redirect" | "signal"> {
  timeoutMs: number;
  signal?: AbortSignal;
  maxRedirects?: number;
}

export interface SafeFetchResult {
  response: Response;
  resolvedUrl: string;
}

function createFetchSignal(timeoutMs: number, signal?: AbortSignal): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
}

export async function safeFetch(input: string | URL, options: SafeFetchOptions): Promise<SafeFetchResult> {
  const { timeoutMs, signal, maxRedirects = 5, headers, ...init } = options;
  let currentUrl = await validateUrlFormat(typeof input === "string" ? input : input.toString());

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
    await validateDnsResolution(currentUrl.hostname);

    // undici's fetch + the SSRF-guarded dispatcher: the connection's DNS lookup
    // enforces the private-IP block at connect time (closes the rebinding gap).
    // The init fields are global RequestInit-typed; cast over the DOM↔undici type
    // boundary (Blob/Headers differ structurally but are runtime-compatible).
    const response = (await undiciFetch(currentUrl.toString(), {
      ...init,
      headers,
      redirect: "manual",
      signal: createFetchSignal(timeoutMs, signal),
      dispatcher: ssrfGuardedAgent,
    } as unknown as Parameters<typeof undiciFetch>[1])) as unknown as Response;

    if (!REDIRECT_STATUS_CODES.has(response.status)) {
      return { response, resolvedUrl: currentUrl.toString() };
    }

    if (redirectCount === maxRedirects) {
      throw Errors.fetchFailed("Muitos redirecionamentos.");
    }

    const location = response.headers.get("location");
    if (!location) {
      throw Errors.fetchFailed("Redirecionamento sem destino.");
    }

    currentUrl = await validateUrlFormat(new URL(location, currentUrl).toString());
  }

  throw Errors.fetchFailed("Falha ao seguir redirecionamento.");
}
