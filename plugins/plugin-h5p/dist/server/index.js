var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/server/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => PluginH5PServer
});
module.exports = __toCommonJS(index_exports);

// src/server/plugin.ts
var import_server = require("@nocobase/server");
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
var PluginH5PServer = class extends import_server.Plugin {
  async load() {
    this.h5pStoragePath = import_path.default.resolve(
      process.env.STORAGE_PATH || import_path.default.join(process.cwd(), "storage"),
      "h5p"
    );
    await this.ensureStorageDirectories();
    this.db.collection({
      name: "h5pContents",
      title: "H5P Contents",
      fields: [
        { type: "string", name: "title" },
        { type: "string", name: "contentType" },
        { type: "string", name: "library" },
        { type: "jsonb", name: "parameters" },
        { type: "jsonb", name: "metadata" },
        { type: "string", name: "status", defaultValue: "draft" },
        { type: "bigInt", name: "createdById" },
        { type: "belongsTo", name: "createdBy", target: "users", foreignKey: "createdById" }
      ]
    });
    this.app.resourceManager.define({
      name: "h5p",
      actions: {
        info: this.handleInfo.bind(this),
        listLibraries: this.handleListLibraries.bind(this)
      }
    });
    this.app.resourceManager.registerActionHandlers({
      "h5pContents:render": this.handleRender.bind(this)
    });
    this.app.acl.allow("h5pContents", "*", "loggedIn");
    this.app.acl.allow("h5p", ["info"], "loggedIn");
    this.app.acl.allow("h5p", ["listLibraries"], "loggedIn");
  }
  async install() {
  }
  async ensureStorageDirectories() {
    const dirs = ["content", "libraries", "temporary", "exports"];
    for (const dir of dirs) {
      const dirPath = import_path.default.join(this.h5pStoragePath, dir);
      if (!import_fs.default.existsSync(dirPath)) {
        import_fs.default.mkdirSync(dirPath, { recursive: true });
      }
    }
  }
  async handleInfo(ctx, next) {
    const contentsRepo = this.db.getRepository("h5pContents");
    const total = await contentsRepo.count();
    ctx.body = {
      version: "0.1.0",
      storagePath: this.h5pStoragePath,
      totalContents: total,
      storageDirectories: {
        content: import_path.default.join(this.h5pStoragePath, "content"),
        libraries: import_path.default.join(this.h5pStoragePath, "libraries"),
        temporary: import_path.default.join(this.h5pStoragePath, "temporary")
      }
    };
    await next();
  }
  async handleListLibraries(ctx, next) {
    const librariesPath = import_path.default.join(this.h5pStoragePath, "libraries");
    let libraries = [];
    if (import_fs.default.existsSync(librariesPath)) {
      libraries = import_fs.default.readdirSync(librariesPath).filter((name) => {
        const libPath = import_path.default.join(librariesPath, name);
        return import_fs.default.statSync(libPath).isDirectory() && import_fs.default.existsSync(import_path.default.join(libPath, "library.json"));
      });
    }
    ctx.body = libraries.map((name) => {
      const libJson = JSON.parse(
        import_fs.default.readFileSync(
          import_path.default.join(librariesPath, name, "library.json"),
          "utf-8"
        )
      );
      return {
        machineName: libJson.machineName,
        majorVersion: libJson.majorVersion,
        minorVersion: libJson.minorVersion,
        title: libJson.title,
        runnable: libJson.runnable === 1
      };
    });
    await next();
  }
  async handleRender(ctx, next) {
    const { filterByTk } = ctx.action.params;
    const repo = this.db.getRepository("h5pContents");
    const content = await repo.findOne({ filterByTk });
    if (!content) {
      ctx.throw(404, "H5P content not found");
    }
    ctx.body = {
      id: content.get("id"),
      title: content.get("title"),
      library: content.get("library"),
      parameters: content.get("parameters"),
      metadata: content.get("metadata")
    };
    await next();
  }
};
