import styled from 'styled-components';
import { ThemeType } from '../config/theme';

export const ThemedModal = styled.div<{ $theme: ThemeType }>`
  &.ant-modal-content {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#1A202C'};
  }

  .ant-modal-header {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#1A202C'};
    border-bottom: 1px solid
      ${(props) => (props.$theme === 'light' ? '#f0f0f0' : '#2d3748')};

    .ant-modal-title {
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
    }
  }

  .ant-modal-close-x {
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
  }

  .ant-modal-body {
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};

    p {
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
    }

    strong {
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
    }
  }

  .ant-form-item-label > label {
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
  }

  .ant-input,
  .ant-input-password {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#2d3748'};
    border-color: ${(props) =>
      props.$theme === 'light' ? '#d9d9d9' : '#4a5568'};
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};

    &::placeholder {
      color: ${(props) => (props.$theme === 'light' ? '#bfbfbf' : '#718096')};
    }

    &:hover {
      border-color: ${(props) =>
        props.$theme === 'light' ? '#6366F1' : '#667eea'};
    }
  }

  .ant-input:focus,
  .ant-input-password:focus {
    border-color: ${(props) =>
      props.$theme === 'light' ? '#6366F1' : '#667eea'};
    box-shadow: ${(props) =>
      props.$theme === 'light'
        ? '0 0 0 2px rgba(99, 102, 241, 0.2)'
        : '0 0 0 2px rgba(102, 126, 234, 0.2)'};
  }

  .ant-select {
    .ant-select-selector {
      background: ${(props) =>
        props.$theme === 'light' ? '#ffffff' : '#2d3748'};
      border-color: ${(props) =>
        props.$theme === 'light' ? '#d9d9d9' : '#4a5568'};
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};

      .ant-select-selection-placeholder {
        color: ${(props) => (props.$theme === 'light' ? '#bfbfbf' : '#718096')};
      }

      .ant-select-selection-item {
        color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
      }
    }

    &:hover .ant-select-selector {
      border-color: ${(props) =>
        props.$theme === 'light' ? '#6366F1' : '#667eea'};
    }

    &.ant-select-focused .ant-select-selector {
      border-color: ${(props) =>
        props.$theme === 'light' ? '#6366F1' : '#667eea'};
      box-shadow: ${(props) =>
        props.$theme === 'light'
          ? '0 0 0 2px rgba(99, 102, 241, 0.2)'
          : '0 0 0 2px rgba(102, 126, 234, 0.2)'};
    }

    .ant-select-arrow {
      color: ${(props) => (props.$theme === 'light' ? '#bfbfbf' : '#718096')};
    }
  }

  .ant-picker {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#2d3748'};
    border-color: ${(props) =>
      props.$theme === 'light' ? '#d9d9d9' : '#4a5568'};
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};

    &::placeholder {
      color: ${(props) => (props.$theme === 'light' ? '#bfbfbf' : '#718096')};
    }

    &:hover {
      border-color: ${(props) =>
        props.$theme === 'light' ? '#6366F1' : '#667eea'};
    }
  }

  .ant-picker-focused {
    border-color: ${(props) =>
      props.$theme === 'light' ? '#6366F1' : '#667eea'};
    box-shadow: ${(props) =>
      props.$theme === 'light'
        ? '0 0 0 2px rgba(99, 102, 241, 0.2)'
        : '0 0 0 2px rgba(102, 126, 234, 0.2)'};
  }

  .ant-input-number {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#2d3748'};
    border-color: ${(props) =>
      props.$theme === 'light' ? '#d9d9d9' : '#4a5568'};
    color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};

    &:hover {
      border-color: ${(props) =>
        props.$theme === 'light' ? '#6366F1' : '#667eea'};
    }

    &:focus-within {
      border-color: ${(props) =>
        props.$theme === 'light' ? '#6366F1' : '#667eea'};
      box-shadow: ${(props) =>
        props.$theme === 'light'
          ? '0 0 0 2px rgba(99, 102, 241, 0.2)'
          : '0 0 0 2px rgba(102, 126, 234, 0.2)'};
    }

    .ant-input-number-input {
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
    }
  }

  .ant-table {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#1A202C'};

    .ant-table-container {
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
      background: ${(props) =>
        props.$theme === 'light' ? '#ffffff' : '#1A202C'};
      border-bottom: 1px solid
        ${(props) => (props.$theme === 'light' ? '#f0f0f0' : '#2d3748')};
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
    }

    .ant-table-tbody > tr:hover > td {
      background: ${(props) =>
        props.$theme === 'light' ? '#fafafa' : '#2d3748'};
    }

    .ant-table-empty {
      background: ${(props) =>
        props.$theme === 'light' ? '#ffffff' : '#1A202C'};
    }

    .ant-table-placeholder {
      background: ${(props) =>
        props.$theme === 'light' ? '#ffffff' : '#1A202C'};
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};

      .ant-empty-description {
        color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
      }
    }
  }
`;
