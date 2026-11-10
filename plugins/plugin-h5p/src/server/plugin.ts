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
        { type: 'string', name: 'title' },
        { type: 'string', name: 'contentType' },
        { type: 'string', name: 'library' },
        { type: 'jsonb', name: 'parameters' },
        { type: 'jsonb', name: 'metadata' },
        { type: 'string', name: 'status', defaultValue: 'draft' },
        { type: 'bigInt', name: 'createdById' },
        { type: 'belongsTo', name: 'createdBy', target: 'users', foreignKey: 'createdById' },
      ],
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

    this.app.acl.allow('h5pContents', '*', 'loggedIn');
    this.app.acl.allow('h5p', ['info'], 'loggedIn');
    this.app.acl.allow('h5p', ['listLibraries'], 'loggedIn');
  }

  async install() {
    // Seed data can be added here on first enable
  }

  private async ensureStorageDirectories() {
    const dirs = ['content', 'libraries', 'temporary', 'exports'];
    for (const dir of dirs) {
      const dirPath = path.join(this.h5pStoragePath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
  }

  private async handleInfo(ctx: any, next: any) {
    const contentsRepo = this.db.getRepository('h5pContents');
    const total = await contentsRepo.count();

    ctx.body = {
      version: '0.1.0',
      storagePath: this.h5pStoragePath,
      totalContents: total,
      storageDirectories: {
        content: path.join(this.h5pStoragePath, 'content'),
        libraries: path.join(this.h5pStoragePath, 'libraries'),
        temporary: path.join(this.h5pStoragePath, 'temporary'),
      },
    };
    await next();
  }

  private async handleListLibraries(ctx: any, next: any) {
    const librariesPath = path.join(this.h5pStoragePath, 'libraries');
    let libraries: string[] = [];

    if (fs.existsSync(librariesPath)) {
      libraries = fs.readdirSync(librariesPath).filter((name) => {
        const libPath = path.join(librariesPath, name);
        return (
          fs.statSync(libPath).isDirectory() &&
          fs.existsSync(path.join(libPath, 'library.json'))
        );
      });
    }

    ctx.body = libraries.map((name) => {
      const libJson = JSON.parse(
        fs.readFileSync(
          path.join(librariesPath, name, 'library.json'),
          'utf-8',
        ),
      );
      return {
        machineName: libJson.machineName,
        majorVersion: libJson.majorVersion,
        minorVersion: libJson.minorVersion,
        title: libJson.title,
        runnable: libJson.runnable === 1,
      };
    });
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
