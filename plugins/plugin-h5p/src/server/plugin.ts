import { Plugin } from '@nocobase/server';
import path from 'path';
import fs from 'fs';

export class PluginH5PServer extends Plugin {
  h5pStoragePath: string;

  async load() {
    this.h5pStoragePath = path.resolve(
      process.env.STORAGE_PATH || path.join(process.cwd(), 'storage'),
      'h5p',
    );

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
      if (title && typeof title === 'string') {
        model.set('title', title.trim());
      }
      const ctx = options?.context;
      if (ctx?.state?.currentUser?.id) {
        model.set('createdById', ctx.state.currentUser.id);
      }
    });

    this.db.on('h5pContents.beforeUpdate', async (model: any) => {
      const title = model.get('title');
      if (title !== undefined && title && typeof title === 'string') {
        model.set('title', title.trim());
      }
    });

    this.app.resourcer.use(async (ctx: any, next: any) => {
      const { resourceName, actionName } = ctx.action;
      if (resourceName === 'h5pContents' && (actionName === 'create' || actionName === 'update')) {
        const title = ctx.action.params.values?.title;
        if (actionName === 'create') {
          if (!title || typeof title !== 'string' || title.trim().length === 0) {
            ctx.throw(400, 'Title is required');
          }
          if (title.length > 255) {
            ctx.throw(400, 'Title must be 255 characters or less');
          }
        }
        if (actionName === 'update' && title !== undefined) {
          if (!title || typeof title !== 'string' || title.trim().length === 0) {
            ctx.throw(400, 'Title is required');
          }
          if (title.length > 255) {
            ctx.throw(400, 'Title must be 255 characters or less');
          }
        }
      }
      await next();
    });

    this.app.resourceManager.define({
      name: 'h5p',
      actions: {
        info: this.handleInfo.bind(this),
        listLibraries: this.handleListLibraries.bind(this),
      },
    });

    this.app.resourceManager.registerActionHandlers({
      'h5pContents:render': this.handleRender.bind(this),
    });

    this.app.acl.allow('h5pContents', ['list', 'get'], 'loggedIn');
    this.app.acl.allow('h5pContents', ['create', 'update', 'destroy'], '$rootRole');
    this.app.acl.allow('h5pContents', 'render', 'loggedIn');
    this.app.acl.allow('h5p', ['info', 'listLibraries'], 'loggedIn');
  }

  async install() {}

  private async ensureStorageDirectories() {
    const dirs = ['content', 'libraries', 'temporary', 'exports'];
    for (const dir of dirs) {
      const dirPath = path.join(this.h5pStoragePath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
  }

  private isRootRole(ctx: any): boolean {
    return ctx?.state?.currentUser?.dataValues?.roles?.some(
      (r: any) => r.name === 'root' || r.name === 'admin',
    ) || ctx?.state?.currentRole === 'root';
  }

  private async handleInfo(ctx: any, next: any) {
    const contentsRepo = this.db.getRepository('h5pContents');
    const total = await contentsRepo.count();

    const body: any = {
      version: '0.1.0',
      totalContents: total,
    };

    if (this.isRootRole(ctx)) {
      body.storagePath = this.h5pStoragePath;
      body.storageDirectories = {
        content: path.join(this.h5pStoragePath, 'content'),
        libraries: path.join(this.h5pStoragePath, 'libraries'),
        temporary: path.join(this.h5pStoragePath, 'temporary'),
      };
    }

    ctx.body = body;
    await next();
  }

  private async handleListLibraries(ctx: any, next: any) {
    const librariesPath = path.join(this.h5pStoragePath, 'libraries');
    const results: any[] = [];

    if (fs.existsSync(librariesPath)) {
      const dirs = fs.readdirSync(librariesPath).filter((name) => {
        const libPath = path.join(librariesPath, name);
        return (
          fs.statSync(libPath).isDirectory() &&
          fs.existsSync(path.join(libPath, 'library.json'))
        );
      });

      for (const name of dirs) {
        try {
          const libJson = JSON.parse(
            fs.readFileSync(path.join(librariesPath, name, 'library.json'), 'utf-8'),
          );
          results.push({
            machineName: libJson.machineName,
            majorVersion: libJson.majorVersion,
            minorVersion: libJson.minorVersion,
            title: libJson.title,
            runnable: libJson.runnable === 1,
          });
        } catch {
          // skip corrupted library.json
        }
      }
    }

    ctx.body = results;
    await next();
  }

  private async handleRender(ctx: any, next: any) {
    const { filterByTk } = ctx.action.params;
    const repo = this.db.getRepository('h5pContents');
    const content = await repo.findOne({ filterByTk });

    if (!content) {
      ctx.throw(404, 'H5P content not found');
    }

    ctx.body = {
      id: content.get('id'),
      title: content.get('title'),
      library: content.get('library'),
      parameters: content.get('parameters'),
      metadata: content.get('metadata'),
    };
    await next();
  }
}

export default PluginH5PServer;
