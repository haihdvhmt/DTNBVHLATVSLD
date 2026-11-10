import { Plugin, Application } from '@nocobase/client-v2';
import H5PSettingsPage from './pages/H5PSettingsPage';
import H5PContentsPage from './pages/H5PContentsPage';

export class PluginH5PClient extends Plugin<any, Application> {
  async load() {
    this.pluginSettingsManager.addMenuItem({
      key: 'h5p',
      title: this.t('H5P Interactive Content'),
      icon: 'PlayCircleOutlined',
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'h5p',
      key: 'index',
      title: this.t('H5P Settings'),
      Component: H5PSettingsPage,
    });

    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'h5p',
      key: 'contents',
      title: this.t('Content Manager'),
      Component: H5PContentsPage,
    });
  }
}

export default PluginH5PClient;
