// modules/utils/stringUtils.mjs

export function createCircularObject() {
    const circularObject = {
        circularReference: null,
    };
    circularObject.circularReference = circularObject;
    return circularObject;
}

export function stringifyCircular1(obj, seen = new Set()) {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }
    if (seen.has(obj)) {
      return "[Circular]";
    }
    seen.add(obj);
    const result = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        result[key] = stringifyCircular1(obj[key], seen);
      }
    }
    return result;
  }
  
  // can be used to parse the result of stringifyCircular1
  // https://stackoverflow.com/questions/18471683/how-to-stringify-circular-objects-in-javascript
  export function parseCircular1(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    const refs = new Map();
  
    function revive(obj) {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }
      if (obj["__ref"]) {
        return refs.get(obj["__ref"]);
      }
      if (obj["__circular"]) {
        return "[Circular]";
      }
      const newObj = Array.isArray(obj) ? [] : {};
      if (obj["__id"]) {
        refs.set(obj["__id"], newObj)
      }
      for (const key in obj) {
        if (Object.hasOwn(obj, key)) {
           newObj[key] = revive(obj[key]);
        }
      }
     
      return newObj
    }
    return revive(obj)
  }
  
  export function testCircular1() {
    window.CONSOLE_LOG_IGNORE("testCircular1");
    const circularObject = createCircularObject();
    const stringified = stringifyCircular1(circularObject);
    window.CONSOLE_LOG_IGNORE(stringified); // Output: '{"self":"[Circular Reference]"}'
    const parsed = parseCircular1(stringified);
    window.CONSOLE_LOG_IGNORE(parsed); // Output: '{"self":"[Circular Reference]"}'
  }


  export function stringifyCircular2(obj) {
    const seen = new WeakSet(); // Keep track of seen objects to avoid infinite loops
  
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]'; // Replace circular reference with a placeholder
        }
        seen.add(value);
      }
      return value;
    });
  }
  
  
  export function parseCircular2(str) {
    const parsed = JSON.parse(str);
    const refs = new Map(); // Map placeholders to their actual objects
  
    // Function to find and resolve circular references
    function resolveRefs(obj, path = '') {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }
  
      if (refs.has(path)) {
        return refs.get(path); // Already resolved
      }
  
      for (let key in obj) {
          if (obj.hasOwnProperty(key)) {
              const value = obj[key];
              if (value === '[Circular Reference]') {
                  obj[key] = refs.get(path.length ? path + '.' + key : key);
              } else {
                  resolveRefs(value, path.length ? path + '.' + key : key);
              }
          }
      }
  
     refs.set(path, obj);
      return obj;
    }
  
  
    return resolveRefs(parsed);
  }
  

  export function testCircular2() {
    window.CONSOLE_LOG_IGNORE("testCircular2");
    const circularObject = createCircularObject();
    const stringified = stringifyCircular2(circularObject);
    window.CONSOLE_LOG_IGNORE(stringified); // Output: '{"self":"[Circular Reference]"}'
    const parsed = parseCircular2(stringified);
    window.CONSOLE_LOG_IGNORE(parsed); // Output: '{"self":"[Circular Reference]"}'
  }


export function testCircular3() {
    window.CONSOLE_LOG_IGNORE("testCircular3");

    const obj = {
        name: "example",
    };
        
    obj.circularReference = obj;

    function replacer(key, value) {
        if (key === 'circularReference') {
            return '[Circular]';
        }
        return value;
    }

    const jsonString = JSON.stringify(obj, replacer);
    window.CONSOLE_LOG_IGNORE(jsonString);
    // Expected output: {"name":"example","circularReference":"[Circular]"}

    const parsedObj = JSON.parse(jsonString);
    window.CONSOLE_LOG_IGNORE(parsedObj);
    // Expected output: { name: 'example', circularReference: '[Circular]' }
}

export function tryCircularTests() {
    try {
        testCircular1();
    } catch (error) {
        window.CONSOLE_LOG_IGNORE(error);
    }

    try {
        testCircular2();
    } catch (error) {
        window.CONSOLE_LOG_IGNORE(error);
    }

    try {
        testCircular3();
    } catch (error) {
        window.CONSOLE_LOG_IGNORE(error);
    }
}

// Immediately Invoked Function Expression (IIFE), 
// is a function that is executed immediately after it is defined.
// It is a design pattern that is used to create a new scope for variables.

// (function() {
//     tryCircularTests();
//   })();


/**
 * test all stringUtils functions
 */
export function test_stringutils() {

}