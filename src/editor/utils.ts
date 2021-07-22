export function callUnwrap<I, O>(handler: (i: I) => O) {
  return async (inObj: any) => {
    const remapped: any = {};
    await Promise.all(
      Object.keys(inObj).map(async key => {
        const keyValue = inObj[key];
        remapped[key] = await (typeof keyValue === 'function'
          ? keyValue()
          : keyValue);
      })
    );

    return handler(remapped);
  };
}
