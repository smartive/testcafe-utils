window.__intercepted = window.__interceptUrls
  ? window.__interceptUrls.reduce((urls, url) => {
      const key = url instanceof RegExp || typeof url === 'string' ? url.toString() : `${url.method}__${url.pattern}`;

      return {
        ...urls,
        [key]: (() => {
          const result: {
            promise?: Promise<void>;
            resolve?: () => void;
          } = {
            promise: undefined,
            resolve: undefined,
          };

          let resolvePromise: () => void;
          result.promise = new Promise((resolve) => {
            resolvePromise = resolve;
          });
          result.resolve = () => {
            resolvePromise();

            // Revive promise for next request
            result.promise = new Promise((resolve) => {
              resolvePromise = resolve;
            });
          };

          return result;
        })(),
      };
    }, {})
  : {};
