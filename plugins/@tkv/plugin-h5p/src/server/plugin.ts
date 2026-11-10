import { Plugin } from '@nocobase/server';
import path from 'path';
import fs from 'fs';

let H5PServer: any = null;
try {
  H5PServer = require('@lumieducation/h5p-server');
} catch {
  // h5p-server not available — basic mode only
}

export class PluginH5PServer extends Plugin {
  h5pStoragePath: string;
  h5pEditor: any = null;
  h5pPlayer: any = null;
  h5pAjax: any = null;
  h5pAssetsPath: string;

  async load() {
    this.h5pStoragePath = path.resolve(
      process.env.STORAGE_PATH || path.join(process.cwd(), 'storage'),
      'h5p',
    );
    const pluginDir = path.resolve(__dirname, '..', '..');
    this.h5pAssetsPath = path.join(pluginDir, 'h5p-assets');

    await this.ensureStorageDirectories();

    this.db.collection({
      name: 'h5pContents',
      title: 'H5P Contents',
      fields: [
        { type: 'string', name: 'title', allowNull: false },
        { type: 'string', name: 'contentType' },
        { type: 'string', name: 'library' },
        { type: 'jsonb', name: 'parameters' },
        { type: 'jsonb', name: 'metadata' },
        { type: 'string', name: 'status', defaultValue: 'draft' },
        { type: 'bigInt', name: 'createdById' },
        { type: 'belongsTo', name: 'createdBy', target: 'users', foreignKey: 'createdById' },
      ],
    });

    this.db.on('h5pContents.beforeCreate', async (model: any, options: any) => {
      const title = model.get('title');
      if (title && typeof title === 'string') model.set('title', title.trim());
      const ctx = options?.context;
      if (ctx?.state?.currentUser?.id) model.set('createdById', ctx.state.currentUser.id);
    });

    this.db.on('h5pContents.beforeUpdate', async (model: any) => {
      const title = model.get('title');
      if (title !== undefined && title && typeof title === 'string') model.set('title', title.trim());
    });

    this.app.resourcer.use(async (ctx: any, next: any) => {
      const { resourceName, actionName } = ctx.action;
      if (resourceName === 'h5pContents' && (actionName === 'create' || actionName === 'update')) {
        const title = ctx.action.params.values?.title;
        if (actionName === 'create') {
          if (!title || typeof title !== 'string' || title.trim().length === 0) ctx.throw(400, 'Title is required');
          if (title.length > 255) ctx.throw(400, 'Title must be 255 characters or less');
        }
        if (actionName === 'update' && title !== undefined) {
          if (!title || typeof title !== 'string' || title.trim().length === 0) ctx.throw(400, 'Title is required');
          if (title.length > 255) ctx.throw(400, 'Title must be 255 characters or less');
        }
      }
      await next();
    });

    if (H5PServer) {
      await this.initH5PServer();
    }

    // Koa middleware for static H5P assets (no auth — JS/CSS loaded by script/link tags)
    this.app.use(this.staticMiddleware.bind(this), { tag: 'h5p-static', before: 'dataWrapping' });

    this.app.resourceManager.define({
      name: 'h5p',
      actions: {
        info: this.handleInfo.bind(this),
        listLibraries: this.handleListLibraries.bind(this),
        editorModel: this.handleEditorModel.bind(this),
        playerModel: this.handlePlayerModel.bind(this),
        saveContent: this.handleSaveContent.bind(this),
      },
    });

    this.app.resourceManager.registerActionHandlers({
      'h5pContents:render': this.handleRender.bind(this),
    });

    this.app.acl.allow('h5pContents', ['list', 'get'], 'loggedIn');
    this.app.acl.allow('h5pContents', ['create', 'update', 'destroy'], '$rootRole');
    this.app.acl.allow('h5pContents', 'render', 'loggedIn');
    this.app.acl.allow('h5p', ['info', 'listLibraries', 'playerModel'], 'loggedIn');
    this.app.acl.allow('h5p', ['editorModel', 'saveContent'], '$rootRole');
  }

  async install() {}

  private async initH5PServer() {
    const { H5PEditor: Editor, H5PPlayer: Player, H5PAjaxEndpoint, H5PConfig, fsImplementations } = H5PServer;

    const config = new H5PConfig();
    config.baseUrl = '';
    config.coreUrl = '/api/h5p-static/core';
    config.editorLibraryUrl = '/api/h5p-static/editor';
    config.librariesUrl = '/api/h5p-static/libraries';
    config.contentFilesUrl = '/api/h5p-static/content';
    config.temporaryFilesUrl = '/api/h5p-static/temp';
    config.setFinishedUrl = '/api/h5p:setFinished';
    config.contentUserDataUrl = '/api/h5p:contentUserData';

    const libStorage = new fsImplementations.FileLibraryStorage(path.join(this.h5pStoragePath, 'libraries'));
    const contentStorage = new fsImplementations.FileContentStorage(path.join(this.h5pStoragePath, 'content'));
    const tempStorage = new fsImplementations.DirectoryTemporaryFileStorage(path.join(this.h5pStoragePath, 'temporary'));
    const cache = new fsImplementations.InMemoryStorage();

    this.h5pEditor = new Editor(cache, config, libStorage, contentStorage, tempStorage);
    this.h5pEditor.setRenderer((model: any) => model);

    this.h5pPlayer = new Player(libStorage, contentStorage, config);
    this.h5pPlayer.setRenderer((model: any) => model);

    this.h5pAjax = new H5PAjaxEndpoint(this.h5pEditor);
    this.app.logger.info('[h5p] H5P server initialized');
  }

  private getH5PUser(ctx: any) {
    const user = ctx?.state?.currentUser;
    return {
      id: String(user?.id || 'anonymous'),
      name: user?.nickname || user?.username || 'Anonymous',
      email: user?.email || '',
      type: this.isRootRole(ctx) ? 'admin' : 'user',
      canInstallRecommended: this.isRootRole(ctx),
      canUpdateAndInstallLibraries: this.isRootRole(ctx),
      canCreateRestricted: this.isRootRole(ctx),
    };
  }

  private async staticMiddleware(ctx: any, next: any) {
    if (ctx.method !== 'GET') return next();
    const urlPath = ctx.path;

    if (urlPath === '/api/h5p-embed') return this.serveEmbedPage(ctx);

    const routes: Array<{ prefix: string; baseDir: string }> = [
      { prefix: '/api/h5p-static/core/', baseDir: path.join(this.h5pAssetsPath, 'h5p-core') },
      { prefix: '/api/h5p-static/editor/', baseDir: path.join(this.h5pAssetsPath, 'h5p-editor') },
      { prefix: '/api/h5p-static/libraries/', baseDir: path.join(this.h5pStoragePath, 'libraries') },
      { prefix: '/api/h5p-static/content/', baseDir: path.join(this.h5pStoragePath, 'content') },
      { prefix: '/api/h5p-static/temp/', baseDir: path.join(this.h5pStoragePath, 'temporary') },
    ];

    for (const route of routes) {
      if (urlPath.startsWith(route.prefix)) {
        const relPath = decodeURIComponent(urlPath.substring(route.prefix.length));
        return this.serveStaticFile(ctx, route.baseDir, relPath);
      }
    }

    return next();
  }

  private serveStaticFile(ctx: any, baseDir: string, relPath: string) {
    const safePath = path.normalize(relPath).replace(/^(\.\.[/\\])+/, '');
    const fullPath = path.join(baseDir, safePath);
    if (!fullPath.startsWith(baseDir)) {
      ctx.status = 403;
      ctx.body = 'Forbidden';
      return;
    }
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      ctx.status = 404;
      ctx.body = 'Not found';
      return;
    }
    ctx.set('Content-Type', this.getMimeType(fullPath));
    ctx.set('Cache-Control', 'public, max-age=86400');
    ctx.body = fs.createReadStream(fullPath);
  }

  private serveEmbedPage(ctx: any) {
    ctx.set('Content-Type', 'text/html; charset=utf-8');
    ctx.set('Cache-Control', 'no-cache');
    ctx.body = EMBED_HTML;
  }

  private async handleInfo(ctx: any, next: any) {
    const repo = this.db.getRepository('h5pContents');
    const total = await repo.count();
    const body: any = { version: '0.2.0', totalContents: total, h5pServerAvailable: !!this.h5pEditor };
    if (this.isRootRole(ctx)) {
      body.storagePath = this.h5pStoragePath;
      const libDir = path.join(this.h5pStoragePath, 'libraries');
      body.installedLibraries = fs.existsSync(libDir)
        ? fs.readdirSync(libDir).filter(d => {
            try { return fs.statSync(path.join(libDir, d)).isDirectory(); } catch { return false; }
          }).length
        : 0;
    }
    ctx.body = body;
    await next();
  }

  private async handleListLibraries(ctx: any, next: any) {
    const librariesPath = path.join(this.h5pStoragePath, 'libraries');
    const results: any[] = [];
    if (fs.existsSync(librariesPath)) {
      for (const name of fs.readdirSync(librariesPath)) {
        const libJsonPath = path.join(librariesPath, name, 'library.json');
        if (fs.existsSync(libJsonPath)) {
          try {
            const lib = JSON.parse(fs.readFileSync(libJsonPath, 'utf-8'));
            results.push({
              machineName: lib.machineName,
              majorVersion: lib.majorVersion,
              minorVersion: lib.minorVersion,
              title: lib.title,
              runnable: lib.runnable === 1,
            });
          } catch {}
        }
      }
    }
    ctx.body = results;
    await next();
  }

  private async handleEditorModel(ctx: any, next: any) {
    if (!this.h5pEditor) ctx.throw(503, 'H5P server not initialized. Check that @lumieducation/h5p-server is installed.');
    const contentId = ctx.action.params.filterByTk;
    const user = this.getH5PUser(ctx);
    try {
      const model = await this.h5pEditor.render(contentId || undefined, 'en', user);
      ctx.body = { model, contentId: contentId || null };
    } catch (err: any) {
      ctx.throw(err.httpStatusCode || 500, err.message);
    }
    await next();
  }

  private async handlePlayerModel(ctx: any, next: any) {
    if (!this.h5pPlayer) ctx.throw(503, 'H5P server not initialized.');
    const contentId = ctx.action.params.filterByTk;
    if (!contentId) ctx.throw(400, 'Content ID is required');
    const user = this.getH5PUser(ctx);
    try {
      const model = await this.h5pPlayer.render(contentId, user);
      ctx.body = { model };
    } catch (err: any) {
      ctx.throw(err.httpStatusCode || 500, err.message);
    }
    await next();
  }

  private async handleSaveContent(ctx: any, next: any) {
    if (!this.h5pEditor) ctx.throw(503, 'H5P server not initialized.');
    const user = this.getH5PUser(ctx);
    const contentId = ctx.action.params.filterByTk;
    const { library, params, metadata } = ctx.action.params.values || {};
    if (!library || !params) ctx.throw(400, 'library and params are required');
    try {
      const saved = await this.h5pEditor.saveOrUpdateContentReturnMetaData(
        contentId || undefined, params, metadata || { title: '', license: 'U' }, library, user,
      );
      const repo = this.db.getRepository('h5pContents');
      const values = { library, parameters: params, metadata: metadata || {}, title: metadata?.title || 'Untitled' };
      if (contentId) {
        await repo.update({ filterByTk: contentId, values });
      } else {
        await repo.create({ values: { ...values, status: 'draft' }, context: ctx });
      }
      ctx.body = { contentId: saved.id, metadata: saved.metadata };
    } catch (err: any) {
      ctx.throw(err.httpStatusCode || 500, err.message);
    }
    await next();
  }

  private async handleRender(ctx: any, next: any) {
    const { filterByTk } = ctx.action.params;
    const repo = this.db.getRepository('h5pContents');
    const content = await repo.findOne({ filterByTk });
    if (!content) ctx.throw(404, 'H5P content not found');
    ctx.body = {
      id: content.get('id'),
      title: content.get('title'),
      library: content.get('library'),
      parameters: content.get('parameters'),
      metadata: content.get('metadata'),
    };
    await next();
  }

  private async ensureStorageDirectories() {
    for (const dir of ['content', 'libraries', 'temporary', 'exports']) {
      const p = path.join(this.h5pStoragePath, dir);
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    }
  }

  private isRootRole(ctx: any): boolean {
    return ctx?.state?.currentUser?.dataValues?.roles?.some(
      (r: any) => r.name === 'root' || r.name === 'admin',
    ) || ctx?.state?.currentRole === 'root';
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const types: Record<string, string> = {
      '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json',
      '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
      '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2',
      '.ttf': 'font/ttf', '.eot': 'application/vnd.ms-fontobject',
      '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
      '.html': 'text/html', '.xml': 'application/xml', '.ico': 'image/x-icon',
    };
    return types[ext] || 'application/octet-stream';
  }
}

const EMBED_HTML = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>H5P</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; }
  #loading { display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; gap: 16px; }
  #loading .spinner { width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #1890ff; border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  #error { display: none; padding: 24px; color: #ff4d4f; text-align: center; }
  .h5p-editor-wrapper, .h5p-player-wrapper { padding: 16px; }
  .h5p-content { width: 100%; }
</style>
</head>
<body>
<div id="loading"><div class="spinner"></div><span>Đang tải H5P...</span></div>
<div id="error"></div>
<div id="h5p-container"></div>
<script>
(function() {
  var params = new URLSearchParams(location.search);
  var mode = params.get('mode') || 'player';
  var contentId = params.get('contentId') || '';
  var token = params.get('token') || '';

  function showError(msg) {
    document.getElementById('loading').style.display = 'none';
    var el = document.getElementById('error');
    el.style.display = 'block';
    el.textContent = msg;
  }

  function loadCSS(url) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }

  function loadScript(url) {
    return new Promise(function(resolve, reject) {
      var s = document.createElement('script');
      s.src = url;
      s.onload = resolve;
      s.onerror = function() { reject(new Error('Failed to load: ' + url)); };
      document.head.appendChild(s);
    });
  }

  async function loadScriptsSequentially(urls) {
    for (var i = 0; i < urls.length; i++) {
      await loadScript(urls[i]);
    }
  }

  async function initPlayer() {
    if (!contentId) return showError('Content ID is required');
    var res = await fetch('/api/h5p:playerModel?filterByTk=' + encodeURIComponent(contentId), {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return showError('Failed to load content (HTTP ' + res.status + ')');
    var json = await res.json();
    var data = json.data || json;
    var model = data.model || data;
    if (!model || !model.scripts) return showError('Invalid player model');

    document.title = 'H5P Player';
    (model.styles || []).forEach(function(s) { loadCSS(s); });
    window.H5PIntegration = model.integration;
    await loadScriptsSequentially(model.scripts);

    document.getElementById('loading').style.display = 'none';
    var container = document.getElementById('h5p-container');
    container.className = 'h5p-player-wrapper';
    container.innerHTML = '<div class="h5p-content" data-content-id="' + contentId + '"></div>';
    if (window.H5P && window.H5P.init) window.H5P.init(container);
  }

  async function initEditor() {
    var url = '/api/h5p:editorModel';
    if (contentId) url += '?filterByTk=' + encodeURIComponent(contentId);
    var res = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return showError('Failed to load editor (HTTP ' + res.status + ')');
    var json = await res.json();
    var data = json.data || json;
    var model = data.model || data;
    if (!model || !model.scripts) return showError('Invalid editor model');

    document.title = 'H5P Editor';
    (model.styles || []).forEach(function(s) { loadCSS(s); });
    window.H5PIntegration = model.integration;
    await loadScriptsSequentially(model.scripts);

    document.getElementById('loading').style.display = 'none';
    var container = document.getElementById('h5p-container');
    container.className = 'h5p-editor-wrapper';
    container.innerHTML = '<div id="h5p-editor">Đang tải trình soạn thảo...</div>';
    if (window.H5PEditor && window.H5PEditor.init) window.H5PEditor.init(container);
  }

  (mode === 'editor' ? initEditor() : initPlayer()).catch(function(e) { showError(e.message); });
})();
<` + `/script>
</body>
</html>`;

export default PluginH5PServer;
