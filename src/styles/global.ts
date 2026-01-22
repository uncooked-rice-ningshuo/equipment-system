import { createGlobalStyle } from 'styled-components';

export const GlobalThemeStyles = createGlobalStyle<{
  $theme: 'light' | 'dark';
}>`
  ${(props) => `
    html {
      color-scheme: ${props.$theme === 'dark' ? 'dark' : 'light'};
    }

    .ant-select-dropdown {
      background: ${
        props.$theme === 'light' ? '#ffffff' : '#2d3748'
      } !important;
      border: 1px solid ${
        props.$theme === 'light' ? '#d9d9d9' : '#4a5568'
      } !important;

      .ant-select-item {
        color: ${props.$theme === 'light' ? '#1A202C' : '#ffffff'} !important;

        &:hover {
          background: ${
            props.$theme === 'light' ? '#f5f5f5' : '#4a5568'
          } !important;
        }

        &.ant-select-item-option-selected {
          background: ${
            props.$theme === 'light' ? '#e6f7ff' : '#2d3748'
          } !important;
          color: ${props.$theme === 'light' ? '#1A202C' : '#667eea'} !important;
        }

        &.ant-select-item-option-active {
          background: ${
            props.$theme === 'light' ? '#f5f5f5' : '#4a5568'
          } !important;
        }
      }
    }

    .ant-picker-dropdown {
      background: ${
        props.$theme === 'light' ? '#ffffff' : '#2d3748'
      } !important;
      border: 1px solid ${
        props.$theme === 'light' ? '#d9d9d9' : '#4a5568'
      } !important;

      .ant-picker-panel {
        background: ${
          props.$theme === 'light' ? '#ffffff' : '#2d3748'
        } !important;
        color: ${props.$theme === 'light' ? '#1A202C' : '#ffffff'} !important;
      }

      .ant-picker-header {
        color: ${props.$theme === 'light' ? '#1A202C' : '#ffffff'} !important;
        border-bottom-color: ${
          props.$theme === 'light' ? '#f0f0f0' : '#4a5568'
        } !important;
      }

      .ant-picker-footer {
        border-top-color: ${
          props.$theme === 'light' ? '#f0f0f0' : '#4a5568'
        } !important;
      }

      .ant-picker-cell {
        color: ${props.$theme === 'light' ? '#1A202C' : '#ffffff'} !important;

        &:hover {
          background: ${
            props.$theme === 'light' ? '#f5f5f5' : '#4a5568'
          } !important;
        }

        &.ant-picker-cell-selected {
          background: ${
            props.$theme === 'light' ? '#1890ff' : '#667eea'
          } !important;
          color: ${props.$theme === 'light' ? '#1A202C' : '#ffffff'} !important;
        }

        &.ant-picker-cell-disabled {
          color: ${props.$theme === 'light' ? '#bfbfbf' : '#718096'} !important;
        }
      }

      .ant-picker-suffix {
        color: ${props.$theme === 'light' ? '#bfbfbf' : '#718096'} !important;
      }

      .ant-picker-clear {
        color: ${props.$theme === 'light' ? '#bfbfbf' : '#718096'} !important;

        &:hover {
          color: ${props.$theme === 'light' ? '#4096ff' : '#667eea'} !important;
        }
      }

      .ant-picker-separator {
        color: ${props.$theme === 'light' ? '#1A202C' : '#ffffff'} !important;
      }

      .ant-picker-today-btn {
        color: ${props.$theme === 'light' ? '#1890ff' : '#667eea'} !important;

        &:hover {
          color: ${props.$theme === 'light' ? '#4096ff' : '#667eea'} !important;
        }
      }
    }
  `}
`;
