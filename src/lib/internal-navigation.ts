const internalBase = new URL("https://talie.invalid");
const unsafeCallbackEncoding = /[\\\u0000-\u001f\u007f]|%(?:00|0a|0d|2f|5c)/i;

export function safeInternalPath(value: string | null | undefined, fallback = "/account") {
  if (!value || unsafeCallbackEncoding.test(value)) return fallback;

  try {
    const url = new URL(value, internalBase);
    if (url.origin !== internalBase.origin || url.username || url.password) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
