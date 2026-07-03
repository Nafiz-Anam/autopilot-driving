// Note: uses `in` instead of `hasOwnProperty` so getters/defined properties
// on prototypes are picked up. Express 5 defines req.query/req.params via
// property descriptors on the prototype, so hasOwnProperty misses them and
// downstream Zod validation reports "expected object, received undefined".
const pick = (obj: object, keys: string[]) => {
  return keys.reduce<{ [key: string]: unknown }>((finalObj, key) => {
    if (obj && key in obj) {
      const value = obj[key as keyof typeof obj];
      if (value !== undefined) {
        finalObj[key] = value;
      }
    }
    return finalObj;
  }, {});
};

export default pick;
