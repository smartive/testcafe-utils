window.__findInterceptor = (url: string, method: string) => {
  const interceptedUrl = window.__interceptUrls.find((rule) => {
    if (rule instanceof RegExp) {
      return rule.test(url);
    }

    if (typeof rule === 'string') {
      return rule === url;
    }

    const { pattern } = rule;
    return rule.method === method.toUpperCase() && (pattern instanceof RegExp ? pattern.test(url) : pattern === url);
  });
  const key = !interceptedUrl
    ? null
    : interceptedUrl instanceof RegExp || typeof interceptedUrl === 'string'
    ? interceptedUrl.toString()
    : `${interceptedUrl.method}__${interceptedUrl.pattern}`;
  const interceptor = key ? window.__intercepted[key] : null;

  return { key, interceptor };
};
