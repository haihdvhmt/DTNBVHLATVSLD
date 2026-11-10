import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/client-v2/index.tsx',
  },
  outDir: 'dist/client-v2',
  format: ['cjs'],
  splitting: false,
  dts: false,
  external: [
    /^@nocobase\//,
    /^react/,
    /^react-dom/,
    /^antd/,
    /^@ant-design/,
    /^@formily/,
    /^@dnd-kit/,
    /^@emotion/,
    'react-router',
    'react-router-dom',
    'i18next',
    'react-i18next',
    'ahooks',
    'lodash',
    'dayjs',
    'axios',
    'react-error-boundary',
    'antd-mobile',
    'antd-mobile-icons',
  ],
});
