import React from 'react';
import styled from 'styled-components';

const StatusBarContainer = styled.div`
  height: 24px;
  background-color: #007acc;
  display: flex;
  align-items: center;
  padding: 0 16px;
  font-size: 12px;
  color: #ffffff;
  border-top: 1px solid #404040;
`;

const StatusText = styled.div`
  flex: 1;
`;

const StatusInfo = styled.div`
  display: flex;
  gap: 16px;
  color: #ffffff;
`;

interface StatusBarProps {
  itemCount: number;
  selectedCount: number;
  currentPath: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  itemCount,
  selectedCount,
  currentPath,
}) => {
  const getStatusText = () => {
    if (selectedCount > 0) {
      return `${selectedCount} item${selectedCount === 1 ? '' : 's'} selected`;
    }
    return `${itemCount} item${itemCount === 1 ? '' : 's'}`;
  };

  return (
    <StatusBarContainer>
      <StatusText>{getStatusText()}</StatusText>
      <StatusInfo>
        <div>{currentPath}</div>
      </StatusInfo>
    </StatusBarContainer>
  );
};