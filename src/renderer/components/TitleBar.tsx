import React from 'react';
import styled from 'styled-components';
import { FaFolder } from 'react-icons/fa';

const TitleBarContainer = styled.div`
  height: 40px;
  background-color: #2f3349;
  display: flex;
  align-items: center;
  padding: 0 16px;
  -webkit-app-region: drag;
  border-bottom: 1px solid #404040;
`;

const AppIcon = styled(FaFolder)`
  color: #ffffff;
  margin-right: 8px;
  font-size: 16px;
`;

const Title = styled.span`
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
`;

const PathInfo = styled.span`
  color: #a0a0a0;
  font-size: 12px;
  margin-left: auto;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

interface TitleBarProps {
  currentPath: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({ currentPath }) => {
  const getDisplayPath = (path: string) => {
    const parts = path.split(/[/\\]/);
    return parts.length > 3 ? `...\\${parts.slice(-2).join('\\')}` : path;
  };

  return (
    <TitleBarContainer>
      <AppIcon />
      <Title>FileExplorer Q</Title>
      {currentPath && (
        <PathInfo title={currentPath}>
          {getDisplayPath(currentPath)}
        </PathInfo>
      )}
    </TitleBarContainer>
  );
};