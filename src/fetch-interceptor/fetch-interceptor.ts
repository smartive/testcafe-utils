// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

// adapted from https://github.com/werk85/fetch-intercept

let interceptors = [];
function interceptor(fetch, ...args) {
  const reversedInterceptors = interceptors.reduce((array, interceptor) => [interceptor].concat(array), []);

  let promise = Promise.resolve(args);

  reversedInterceptors.forEach(({ request, requestError }) => {
    if (request || requestError) {
      promise = promise.then((args) => request(...args), requestError);
    }
  });

  promise = promise.then((args) => fetch(...args));

  reversedInterceptors.forEach(({ response, responseError }) => {
    if (response || responseError) {
      promise = promise.then(response, responseError);
    }
  });

  return promise;
}

function attach() {
  window.fetch = (function (fetch) {
    return function (...args) {
      return interceptor(fetch, ...args);
    };
  })(window.fetch);

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
  response: function (response) {
    const interceptedUrl = window.__interceptUrls.find((url) =>
      url instanceof RegExp ? url.test(response.url) : url === response.url,
    );
    const interceptedFetch = interceptedUrl ? window.__intercepted[interceptedUrl.toString()] : null;

    if (interceptedFetch) {
      console.log(`[fetch-interceptor] Intercepted '${response.url}' by '${interceptedUrl}'`);
      return interceptedFetch.promise.then(() => response);
    }

    return response;
  },
});
