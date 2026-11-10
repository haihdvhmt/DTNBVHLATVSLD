const fs = require('fs');
const path = require('path');

const cjsCode = fs.readFileSync(path.join(__dirname, 'dist/client-v2/index.js'), 'utf-8');

const requireRegex = /require\("([^"]+)"\)/g;
const deps = new Set();
let match;
while ((match = requireRegex.exec(cjsCode)) !== null) {
  deps.add(match[1]);
}

const depsArray = [...deps];
const paramNames = depsArray.map((_, i) => `__dep${i}__`);

const requireMap = depsArray.map((dep, i) => `    "${dep}": ${paramNames[i]}`).join(',\n');

const amdCode = `(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    define("@tkv/plugin-h5p/client-v2", ${JSON.stringify(depsArray)}, factory);
  } else if (typeof exports === "object" && typeof module === "object") {
    module.exports = factory(${depsArray.map(d => `require("${d}")`).join(', ')});
  }
})(self, function(${paramNames.join(', ')}) {
  var __module__ = { exports: {} };
  var exports = __module__.exports;
  var module = __module__;
  function require(name) {
    var map = {
${requireMap}
    };
    if (map[name] !== undefined) return map[name];
    throw new Error("Cannot find module: " + name);
  }
${cjsCode}
  return __module__.exports;
});
`;

fs.writeFileSync(path.join(__dirname, 'dist/client-v2/index.js'), amdCode);
console.log('Wrapped in AMD format. Dependencies:', depsArray);
