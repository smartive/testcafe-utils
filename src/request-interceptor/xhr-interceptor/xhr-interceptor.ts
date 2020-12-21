/* eslint-disable @typescript-eslint/ban-ts-comment */

(() => {
  const interceptor = (url: string, method: string): Promise<void> => {
    const { key, interceptor } = window.__findInterceptor(url, method);

    if (interceptor) {
      console.log(`[${window.__interceptorName}] Intercepted '${url}' by '${key}'`);
      return interceptor.promise;
    }

    return Promise.resolve();
  };

  const attach = () => {
    window.XMLHttpRequest.prototype.open = (function (xhrOpen: typeof window.XMLHttpRequest.prototype.open) {
      return function (method: string, url: string, async = true, username?: string | null, password?: string | null) {
        // @ts-ignore
        this.__requestMethod = method;
        // @ts-ignore
        this.__requestUrl = url;
        // @ts-ignore
        return xhrOpen.call(this, method, url, async, username, password);
      };
    })(window.XMLHttpRequest.prototype.open);

    window.XMLHttpRequest.prototype.send = (function (xhrSend) {
      return function (body?: Document | BodyInit | null) {
        // @ts-ignore
        interceptor(this.__requestUrl, this.__requestMethod).then(() =>
          // @ts-ignore
          xhrSend.call(this, body),
        );
      };
    })(window.XMLHttpRequest.prototype.send);
  };

  attach();
})();
