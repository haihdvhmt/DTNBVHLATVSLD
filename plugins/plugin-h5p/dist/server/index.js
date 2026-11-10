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
        { type: "string", name: "title", allowNull: false },
        { type: "string", name: "contentType" },
        { type: "string", name: "library" },
        { type: "jsonb", name: "parameters" },
        { type: "jsonb", name: "metadata" },
        { type: "string", name: "status", defaultValue: "draft" },
        { type: "bigInt", name: "createdById" },
        { type: "belongsTo", name: "createdBy", target: "users", foreignKey: "createdById" }
      ]
    });
    this.db.on("h5pContents.beforeCreate", async (model, options) => {
      const title = model.get("title");
      if (title && typeof title === "string") {
        model.set("title", title.trim());
      }
      const ctx = options?.context;
      if (ctx?.state?.currentUser?.id) {
        model.set("createdById", ctx.state.currentUser.id);
      }
    });
    this.db.on("h5pContents.beforeUpdate", async (model) => {
      const title = model.get("title");
      if (title !== void 0 && title && typeof title === "string") {
        model.set("title", title.trim());
      }
    });
    this.app.resourcer.use(async (ctx, next) => {
      const { resourceName, actionName } = ctx.action;
      if (resourceName === "h5pContents" && (actionName === "create" || actionName === "update")) {
        const title = ctx.action.params.values?.title;
        if (actionName === "create") {
          if (!title || typeof title !== "string" || title.trim().length === 0) {
            ctx.throw(400, "Title is required");
          }
          if (title.length > 255) {
            ctx.throw(400, "Title must be 255 characters or less");
          }
        }
        if (actionName === "update" && title !== void 0) {
          if (!title || typeof title !== "string" || title.trim().length === 0) {
            ctx.throw(400, "Title is required");
          }
          if (title.length > 255) {
            ctx.throw(400, "Title must be 255 characters or less");
          }
        }
      }
      await next();
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
    this.app.acl.allow("h5pContents", ["list", "get"], "loggedIn");
    this.app.acl.allow("h5pContents", ["create", "update", "destroy"], "$rootRole");
    this.app.acl.allow("h5pContents", "render", "loggedIn");
    this.app.acl.allow("h5p", ["info", "listLibraries"], "loggedIn");
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
  isRootRole(ctx) {
    return ctx?.state?.currentUser?.dataValues?.roles?.some(
      (r) => r.name === "root" || r.name === "admin"
    ) || ctx?.state?.currentRole === "root";
  }
  async handleInfo(ctx, next) {
    const contentsRepo = this.db.getRepository("h5pContents");
    const total = await contentsRepo.count();
    const body = {
      version: "0.1.0",
      totalContents: total
    };
    if (this.isRootRole(ctx)) {
      body.storagePath = this.h5pStoragePath;
      body.storageDirectories = {
        content: import_path.default.join(this.h5pStoragePath, "content"),
        libraries: import_path.default.join(this.h5pStoragePath, "libraries"),
        temporary: import_path.default.join(this.h5pStoragePath, "temporary")
      };
    }
    ctx.body = body;
    await next();
  }
  async handleListLibraries(ctx, next) {
    const librariesPath = import_path.default.join(this.h5pStoragePath, "libraries");
    const results = [];
    if (import_fs.default.existsSync(librariesPath)) {
      const dirs = import_fs.default.readdirSync(librariesPath).filter((name) => {
        const libPath = import_path.default.join(librariesPath, name);
        return import_fs.default.statSync(libPath).isDirectory() && import_fs.default.existsSync(import_path.default.join(libPath, "library.json"));
      });
      for (const name of dirs) {
        try {
          const libJson = JSON.parse(
            import_fs.default.readFileSync(import_path.default.join(librariesPath, name, "library.json"), "utf-8")
          );
          results.push({
            machineName: libJson.machineName,
            majorVersion: libJson.majorVersion,
            minorVersion: libJson.minorVersion,
            title: libJson.title,
            runnable: libJson.runnable === 1
          });
        } catch {
        }
      }
    }
    ctx.body = results;
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
