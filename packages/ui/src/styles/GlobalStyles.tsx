/**
 * 全局样式组件
 * 用于覆盖 Ant Design 默认样式
 */

import { createGlobalStyle } from 'styled-components';

export const GlobalSelectStyles = createGlobalStyle<{
  $theme: 'light' | 'dark';
}>`
  .custom-datepicker {
    .ant-picker-cell {
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
    }
    .ant-picker-cell-disabled {
      color: ${(props) => (props.$theme === 'light' ? '#bfbfbf' : '#4a5568')};
    }
    .ant-picker-cell:hover:not(.ant-picker-cell-disabled) .ant-picker-cell-inner {
      background: ${(props) =>
        props.$theme === 'light'
          ? 'rgba(99, 102, 241, 0.1)'
          : 'rgba(102, 126, 234, 0.2)'};
    }
    .ant-picker-cell-selected .ant-picker-cell-inner {
      background: ${(props) =>
        props.$theme === 'light' ? '#6366F1' : '#667eea'};
    }
    .ant-picker-cell-today .ant-picker-cell-inner::before {
      border-color: ${(props) =>
        props.$theme === 'light' ? '#6366F1' : '#667eea'};
    }
    .ant-picker-header {
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
      border-bottom: 1px solid
        ${(props) => (props.$theme === 'light' ? '#f0f0f0' : '#2d3748')};
    }
    .ant-picker-header button {
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
    }
    .ant-picker-content th {
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
    }
    .ant-picker-panel {
      background: ${(props) =>
        props.$theme === 'light' ? '#ffffff' : '#2d3748'};
      border: 1px solid ${(props) =>
        props.$theme === 'light' ? '#d9d9d9' : '#4a5568'};
    }
    .ant-picker-footer {
      border-top: 1px solid
        ${(props) => (props.$theme === 'light' ? '#f0f0f0' : '#2d3748')};
    }
    .ant-picker-today-btn {
      color: ${(props) => (props.$theme === 'light' ? '#6366F1' : '#667eea')};
    }
    .ant-picker-time-panel-column > li.ant-picker-time-panel-cell-selected .ant-picker-time-panel-cell-inner {
      background: ${(props) =>
        props.$theme === 'light' ? '#6366F1' : '#667eea'};
    }
  }
`;

export const GlobalAntdStyles = createGlobalStyle<{ $theme: 'light' | 'dark' }>`
  /* 表格样式 */
  .ant-table {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#1A202C'};
  }
  .ant-table-thead > tr > th {
    background: ${(props) =>
      props.$theme === 'light' ? '#fafafa' : '#2d3748'};
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
    border-bottom: 1px solid
      ${(props) => (props.$theme === 'light' ? '#f0f0f0' : '#2d3748')};
  }
  .ant-table-tbody > tr > td {
    border-bottom: 1px solid
      ${(props) => (props.$theme === 'light' ? '#f0f0f0' : '#2d3748')};
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#e2e8f0')};
  }
  .ant-table-tbody > tr:hover > td {
    background: ${(props) =>
      props.$theme === 'light' ? '#f5f5f5' : '#2d3748'};
  }

  /* 分页样式 */
  .ant-pagination {
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#e2e8f0')};
  }
  .ant-pagination-item {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#2d3748'};
    border-color: ${(props) =>
      props.$theme === 'light' ? '#d9d9d9' : '#4a5568'};
    a {
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#e2e8f0')};
    }
  }
  .ant-pagination-item-active {
    background: ${(props) =>
      props.$theme === 'light' ? '#6366F1' : '#667eea'};
    border-color: ${(props) =>
      props.$theme === 'light' ? '#6366F1' : '#667eea'};
    a {
      color: #ffffff;
    }
  }

  /* 模态框样式 */
  .ant-modal-content {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#1A202C'};
  }
  .ant-modal-header {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#1A202C'};
    border-bottom: 1px solid
      ${(props) => (props.$theme === 'light' ? '#f0f0f0' : '#2d3748')};
  }
  .ant-modal-title {
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
  }
  .ant-modal-close-x {
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
  }
`;
