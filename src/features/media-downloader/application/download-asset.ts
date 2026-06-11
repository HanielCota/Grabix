import { appConfig } from "@/server/config";
import { safeFetch } from "@/server/safe-fetch";
import { AppError, Errors } from "../domain/errors";
import {
  getExtensionFromUrl,
  getFileNameFromUrl,
  isAllowedMediaContentType,
  isMediaExtension,
} from "../domain/media-extensions";

export async function downloadAsset(
  rawUrl: string,
  signal?: AbortSignal,
  maxBytes: number = appConfig.limits.maxFileSizeBytes,
): Promise<{
  stream: ReadableStream<Uint8Array>;
  contentType: string;
  contentLength: number | null;
  fileName: string | null;
}> {
  if (!rawUrl?.trim()) {
    throw Errors.invalidUrl("URL não pode ser vazia.");
  }

  // Extension check is optional — some assets have extensionless URLs
  // (e.g. CDN streams, og:video). Content-Type is validated after fetch.
  const ext = getExtensionFromUrl(rawUrl);
  if (ext && !isMediaExtension(ext)) {
    throw Errors.invalidMediaType();
  }

  let response: Response;
  let resolvedUrl = rawUrl;
  try {
    const result = await safeFetch(rawUrl, {
      signal,
      timeoutMs: appConfig.limits.fetchTimeoutMs,
      headers: { "User-Agent": appConfig.userAgent },
    });
    response = result.response;
    resolvedUrl = result.resolvedUrl;
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
      throw Errors.downloadFailed("Timeout.");
    }
    throw Errors.downloadFailed("Erro de rede.");
  }

  if (!response.ok) {
    throw Errors.downloadFailed(`Status HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!isAllowedMediaContentType(contentType)) {
    throw Errors.invalidMediaType();
  }

  // Guard against a non-numeric Content-Length: parseInt("abc") is NaN, which
  // would otherwise leak into the response header as "Content-Length: NaN".
  const contentLengthRaw = response.headers.get("content-length");
  const parsedLength = contentLengthRaw ? Number.parseInt(contentLengthRaw, 10) : null;
  const contentLength = parsedLength != null && Number.isFinite(parsedLength) ? parsedLength : null;

  if (contentLength != null && contentLength > maxBytes) {
    throw Errors.fileTooLarge();
  }

  const body = response.body;
  if (!body) {
    throw Errors.downloadFailed("Resposta sem corpo.");
  }

  // Extract filename from Content-Disposition
  let fileName: string | null = null;
  const disposition = response.headers.get("content-disposition");
  if (disposition) {
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match?.[1]) {
      fileName = match[1].replace(/['"]/g, "").trim() || null;
    }
  }

  // Wrap stream with size limit
  let bytesRead = 0;
  const limitedStream = body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, ctrl) {
        bytesRead += chunk.byteLength;
        if (bytesRead > maxBytes) {
          ctrl.error(new Error("FILE_TOO_LARGE"));
          return;
        }
        ctrl.enqueue(chunk);
      },
    }),
  );

  return {
    stream: limitedStream,
    contentType: contentType || "application/octet-stream",
    contentLength,
    fileName: fileName ?? getFileNameFromUrl(resolvedUrl, 0),
  };
}
