import React, { useCallback } from 'react';
import { FilePlus } from 'lucide-react';
import { uploadFile } from '../services/api';
import { useFileStore } from '../store/fileStore';
import { useExcalidrawElements } from '../hooks/useExcalidrawElements';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';

interface FileCreationButtonsProps {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
  boardName: string;
  cursorPositionRef: React.MutableRefObject<{ x: number; y: number }>;
  theme: 'light' | 'dark';
}

const FILE_TYPES = [
  { ext: 'txt', mime: 'text/plain' },
  { ext: 'md', mime: 'text/markdown' },
];

const FileCreationButtons: React.FC<FileCreationButtonsProps> = ({
  excalidrawAPI,
  boardName,
  cursorPositionRef,
  theme,
}) => {
  const { addFile } = useFileStore();
  const { addElementToBoard } = useExcalidrawElements();

  const backgroundColor = theme === 'dark' ? '#23232a' : '#ececf4';

  const handleCreate = useCallback(
    async (ext: string, mime: string): Promise<void> => {
      const defaultName = `Untitled.${ext}`;
      const userInput = window.prompt(`Enter file name for the new .${ext} file`, defaultName);
      if (!userInput) return;

      let fileName = userInput.trim();
      if (!fileName) return;
      if (!fileName.toLowerCase().endsWith(`.${ext}`)) {
        fileName += `.${ext}`;
      }

      try {
        const file = new File([''], fileName, { type: mime });
        const result = await uploadFile(file, boardName);
        addFile(result.fileUrl, '', ext as 'txt' | 'md');

        if (excalidrawAPI) {
          const position = { ...cursorPositionRef.current };
          addElementToBoard(excalidrawAPI, ext as 'txt' | 'md', result.fileUrl, position);
        }
      } catch (error) {
        console.error(`Failed to create ${ext} file:`, error);
      }
    },
    [boardName, cursorPositionRef, excalidrawAPI, addElementToBoard, addFile],
  );

  return (
    <div style={{ display: 'flex', gap: '8px', marginLeft: '10px' }}>
      {FILE_TYPES.map(({ ext, mime }) => (
        <button
          key={ext}
          className="custom-footer"
          onClick={() => handleCreate(ext, mime)}
          style={{
            height: '34px',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor,
            color: theme === 'dark' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          <FilePlus
            color={theme === 'dark' ? '#fff' : '#000'}
            strokeWidth={1.5}
            size={18}
            style={{ marginRight: '4px' }}
          />
          .{ext}
        </button>
      ))}
    </div>
  );
};

export default FileCreationButtons; 