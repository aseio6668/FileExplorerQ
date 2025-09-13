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

const ModalMessage = styled.p`
  margin: 0 0 20px 0;
  color: #cccccc;
  font-size: 14px;
  line-height: 1.4;
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

const ModalButton = styled.button<{ variant?: 'primary' | 'danger' }>`
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
    if (props.variant === 'danger') {
      return `
        background: #d14c4c;
        color: #ffffff;
        &:hover {
          background: #b03a3a;
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

interface PromptModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  title,
  message,
  defaultValue = '',
  placeholder = '',
  onConfirm,
  onCancel,
}) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      // Use multiple timeouts to ensure proper focus and selection
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setTimeout(() => {
        inputRef.current?.select();
      }, 100);
      // Fallback selection after a bit more time
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(0, inputRef.current.value.length);
        }
      }, 150);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
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
          <ModalTitle>{title}</ModalTitle>
          {message && <ModalMessage>{message}</ModalMessage>}
          
          <ModalInput
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            required
          />
          
          <ModalButtons>
            <ModalButton type="button" onClick={onCancel}>
              Cancel
            </ModalButton>
            <ModalButton type="submit" variant="primary">
              OK
            </ModalButton>
          </ModalButtons>
        </form>
      </ModalContainer>
    </ModalOverlay>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        onConfirm();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onCancel}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalTitle>{title}</ModalTitle>
        <ModalMessage>{message}</ModalMessage>
        
        <ModalButtons>
          <ModalButton onClick={onCancel}>
            {cancelText}
          </ModalButton>
          <ModalButton variant={variant} onClick={onConfirm}>
            {confirmText}
          </ModalButton>
        </ModalButtons>
      </ModalContainer>
    </ModalOverlay>
  );
};