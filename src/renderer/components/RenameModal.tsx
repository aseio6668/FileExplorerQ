import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const ModalContainer = styled.div`
  background: #2d2d30;
  border: 1px solid #454545;
  border-radius: 6px;
  padding: 24px;
  min-width: 320px;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
`;

const ModalTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
`;

const ModalInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 20px;
  background: #1e1e1e;
  border: 1px solid #454545;
  border-radius: 4px;
  color: #ffffff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #007acc;
  }
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const ModalButton = styled.button<{ variant?: 'primary' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  min-width: 70px;
  
  ${props => {
    if (props.variant === 'primary') {
      return `
        background: #007acc;
        color: #ffffff;
        &:hover {
          background: #005a9e;
        }
      `;
    }
    return `
      background: #454545;
      color: #ffffff;
      &:hover {
        background: #5a5a5a;
      }
    `;
  }}
`;

interface RenameModalProps {
  isOpen: boolean;
  fileName: string;
  isDirectory: boolean;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  fileName,
  isDirectory,
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState(fileName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(fileName);
      setTimeout(() => {
        inputRef.current?.focus();
        
        if (isDirectory) {
          // For directories, select all text
          inputRef.current?.select();
        } else {
          // For files, select only the name part (without extension)
          const lastDotIndex = fileName.lastIndexOf('.');
          if (lastDotIndex > 0) {
            inputRef.current?.setSelectionRange(0, lastDotIndex);
          } else {
            inputRef.current?.select();
          }
        }
      }, 100);
    }
  }, [isOpen, fileName, isDirectory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && value.trim() !== fileName) {
      onConfirm(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onCancel}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <ModalTitle>Rename {isDirectory ? 'Folder' : 'File'}</ModalTitle>
          
          <ModalInput
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            required
          />
          
          <ModalButtons>
            <ModalButton type="button" onClick={onCancel}>
              Cancel
            </ModalButton>
            <ModalButton type="submit" variant="primary">
              Rename
            </ModalButton>
          </ModalButtons>
        </form>
      </ModalContainer>
    </ModalOverlay>
  );
};