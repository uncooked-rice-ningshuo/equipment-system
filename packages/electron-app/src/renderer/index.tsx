/**
 * Electron 渲染进程入口
 */

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
    <App />
  </React.StrictMode>,
);
