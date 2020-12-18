// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

let interceptors = [];

function attach() {
  window.XMLHttpRequest.prototype.open = (function (xhrOpen) {
    return function (method, url, async, username, password) {
      this.__requestMethod = method;
      this.__requestUrl = url;
      return xhrOpen.call(this, method, url, async, username, password);
    };
  })(window.XMLHttpRequest.prototype.open);

  window.XMLHttpRequest.prototype.send = (function (xhrSend) {
    return function (body) {
      const reversedInterceptors = interceptors.reduce((array, interceptor) => [interceptor].concat(array), []);
      const requestInterceptors = reversedInterceptors.map(({ request }) => request).filter(Boolean);
      if (requestInterceptors.length) {
        return Promise.all(requestInterceptors.map((interceptor) => interceptor(this.__requestUrl))).then(() =>
          xhrSend.call(this, body),
        );
      }

      xhrSend.call(this, body);
    };
  })(window.XMLHttpRequest.prototype.send);

  return {
    register: function (interceptor) {
      interceptors.push(interceptor);
      return () => {
        const index = interceptors.indexOf(interceptor);
        if (index >= 0) {
          interceptors.splice(index, 1);
        }
      };
    },
    clear: function () {
      interceptors = [];
    },
  };
}

window.__intercepted = window.__interceptUrls
  ? window.__interceptUrls.reduce(
      (urls, url) =>
        Object.assign(urls, {
          [url]: (() => {
            let resolvePromise;
            const promise = new Promise((resolve) => {
              resolvePromise = resolve;
            });

            return {
              promise,
              resolve: resolvePromise,
            };
          })(),
        }),
      {},
    )
  : {};

attach().register({
  request: function (sendUrl) {
    const interceptedUrl = window.__interceptUrls.find((url) =>
      url instanceof RegExp ? url.test(sendUrl) : url === sendUrl,
    );
    const interceptedOpen = interceptedUrl ? window.__intercepted[interceptedUrl.toString()] : null;

    if (interceptedOpen) {
      console.log(`[${window.__interceptorName}] Intercepted '${sendUrl}' by '${interceptedUrl}'`);
      return interceptedOpen.promise;
    }
  },
});
