/**
 * Electron 渲染进程入口
 */

import { ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 创建根节点
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(container);

// 渲染应用
root.render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
