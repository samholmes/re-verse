function error(e){throw new Error("Runtime Error: "+e)}function and(e,i){return THING([e.identifier,i.identifier],e.items.concat(i.items),Object.assign(e.keys,i.keys))}function as(e,i){var n={};return n[i.identifier]=e,THING(e.identifier,[],n)}function inside(e,i){var n=i.keys[e.identifier];return n||(n=THING(null,[])),n}function define(e,i,n){return n(e.identifier,i)}function invoke(e,i){var n=e.items[0];return"function"==typeof n?n(i):void error(e.identifier+" is not a function.")}function destructure(e,i,n){e.identifiers.forEach(function(r,t){if(i.keys[r])var o=i.keys[r];else if(i.items[t])var o=i.items[t];else if(e.keys[r])var o=e.keys[r];else if(r===e.identifier)var o=e.items[0];var f=THING(r,[o]);n(r,f)})}function THING(e,i,n){Array.isArray(e)||(e=[e]);var r=e[e.length-1],t={items:i||[],keys:n||{},identifiers:e,identifier:r};return t}function createScope(e){var i={},n=function(n,r){if(r)return i[n]=THING(n,r.items,r.keys);var r;return r=i[n],r||(r="function"==typeof e?e(n):THING(n,[],{})),r};return n}var scope=createScope();scope("log",THING(null,[function(e){console.log(e)}])),scope("print",THING(null,[function(e){console.log(e.items)}]));
// END OF RUNTIME

invoke(scope("print"), THING(null, ["Hello world"],{}));
