export function parallel(handler: () => void) {
  if (!window.Worker) {
    return handler;
  }

  // Idea - <https://github.com/zevero/worker-create>
  const handlerStr = handler.toString();
  const handlerBlob = new Blob(
    [
      `
          'use strict';
          self.onmessage = async (e) => {
              const {args, callId} = e.data;
              try {
                  const handler = ${handlerStr}; 
                  const value = await handler.apply(null, args);
                  postMessage({value, callId, isError: false});
              } catch (e) {
                  postMessage({value: e, callId, isError: true});
              }
          };
      `,
    ],
    {
      type: 'text/javascript',
    }
  );

  const url = window.URL.createObjectURL(handlerBlob);
  const worker = new window.Worker(url);

  let callId = 0;
  const calls: any = {};

  worker.onmessage = ({ data: { callId, value, isError } }) => {
    if (calls[callId]) {
      if (isError) {
        calls[callId].reject(value);
      } else {
        calls[callId].resolve(value);
      }
      delete calls[callId];
    } else {
      throw new Error(`Missing resolver for callId: ${callId}`);
    }
  };

  worker.onerror = e => {
    throw new Error(`This should not happen, but it did with error: ${e}`);
  };

  return function () {
    callId++;
    let args = [...(arguments as any)];

    return new Promise((resolve, reject) => {
      calls[callId] = {
        resolve,
        reject,
      };
      worker.postMessage({
        args,
        callId,
      });
    });
  };
}
