(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    define("@tkv/plugin-h5p/client", ["@nocobase/client"], factory);
  } else if (typeof exports === "object" && typeof module === "object") {
    module.exports = factory(require("@nocobase/client"));
  }
})(self, function(client) {
  var Plugin = (client && client.Plugin) || (client && client.default && client.default.Plugin);
  if (!Plugin) {
    var NoopPlugin = function() {};
    NoopPlugin.prototype.load = function() { return Promise.resolve(); };
    return { default: NoopPlugin };
  }
  class PluginH5PClient extends Plugin {
    async load() {}
  }
  return { default: PluginH5PClient };
});
