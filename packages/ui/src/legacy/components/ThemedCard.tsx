import styled from 'styled-components';
import { ThemeType } from '../config/theme';

export const ThemedCard = styled.div<{ $theme: ThemeType }>`
  background: ${(props) => (props.$theme === 'light' ? '#ffffff' : '#1A202C')};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  &.ant-card {
    background: ${(props) =>
      props.$theme === 'light' ? '#ffffff' : '#1A202C'};

    .ant-card-head {
      border-bottom: 1px solid
        ${(props) => (props.$theme === 'light' ? '#f0f0f0' : '#2d3748')};

      .ant-card-head-title {
        font-size: 16px;
        font-weight: 600;
        color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
      }
    }

    .ant-card-body {
      color: ${(props) => (props.$theme === 'light' ? '#1A202C' : '#ffffff')};
    }
  }
`;
