import React from 'react';
import { FileItem } from '@/types';
import {
  FaFolder,
  FaFile,
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFileArchive,
  FaFileCode,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaCog
} from 'react-icons/fa';

interface FileIconProps {
  file: FileItem;
  size?: number;
}

export const FileIcon: React.FC<FileIconProps> = ({ file, size = 24 }) => {
  const getIconComponent = (): React.ReactElement => {
    if (file.isDirectory) {
      return <FaFolder color="#ffd700" />;
    }

    const extension = file.extension?.toLowerCase();
    
    if (!extension) {
      return <FaFile color="#ffffff" />;
    }

    // Image files
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].includes(extension)) {
      return <FaFileImage color="#ff6b9d" />;
    }

    // Video files
    if (['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'].includes(extension)) {
      return <FaFileVideo color="#ff9f43" />;
    }

    // Audio files
    if (['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'].includes(extension)) {
      return <FaFileAudio color="#00d2d3" />;
    }

    // Archive files
    if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(extension)) {
      return <FaFileArchive color="#a55eea" />;
    }

    // Code files
    if (['.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.scss', '.json', '.xml', '.py', '.java', '.cpp', '.c', '.cs', '.php'].includes(extension)) {
      return <FaFileCode color="#26de81" />;
    }

    // Document files
    if (['.pdf'].includes(extension)) {
      return <FaFilePdf color="#ff3838" />;
    }

    if (['.doc', '.docx'].includes(extension)) {
      return <FaFileWord color="#2e86de" />;
    }

    if (['.xls', '.xlsx'].includes(extension)) {
      return <FaFileExcel color="#20bf6b" />;
    }

    if (['.ppt', '.pptx'].includes(extension)) {
      return <FaFilePowerpoint color="#fd9644" />;
    }

    // Executable files
    if (['.exe', '.msi', '.app', '.deb', '.rpm'].includes(extension)) {
      return <FaCog color="#ff6348" />;
    }

    // Default file icon
    return <FaFile color="#ffffff" />;
  };

  return (
    <div style={{ fontSize: `${size}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {getIconComponent()}
    </div>
  );
};