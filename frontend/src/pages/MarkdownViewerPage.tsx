import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router';
import MDEditor from '@uiw/react-md-editor';
import { socket } from '../socket';
import { debounce } from 'lodash';
import { useFileStore } from '../store/fileStore';

const getUrlParameter = (name: string): string | null => {
  const urlParams = new URLSearchParams(location.search);
  return urlParams.get(name) ?? '';
};

const MarkdownViewerPage: React.FC = () => {
  const params = useParams();
  const [value, setValue] = useState<string>('');
  const [path, setPath] = useState<string>('');

  // Keep track of the last saved content for comparison
  const lastSavedContentRef = useRef<string>('');

  // Use the file store
  const { updateFileContent, addFile, getFileContent, setCurrentFile } = useFileStore();

  // Handle value changes and emit socket event
  const handleValueChange = useCallback(
    debounce((newValue: string | undefined) => {
      const content = newValue || '';
      setValue(content);

      if (path && content !== lastSavedContentRef.current) {
        // Only update if content has changed
        updateFileContent(path, content, 'md');
        lastSavedContentRef.current = content;
      }
    }, 300), // Increased debounce delay to reduce updates while typing
    [path, updateFileContent],
  );

  useEffect(() => {
    const fetchData = async (url: string) => {
      try {
        // Try to get content from store first
        const urlObj = new URL(url);
        const filePath = urlObj.pathname;
        setPath(filePath);
        setCurrentFile(filePath);

        const storedContent = getFileContent(filePath);
        if (storedContent) {
          setValue(storedContent);
          lastSavedContentRef.current = storedContent;
          return;
        }

        // If not in store, fetch from server
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('File not found');
        }

        const text = await response.text();
        setValue(text);
        lastSavedContentRef.current = text;

        // Add to file store
        addFile(filePath, text, 'md');
      } catch (error) {
        setValue('# File Not Found');
        lastSavedContentRef.current = '# File Not Found';
        console.error(error);
      }
    };

    const url = getUrlParameter('url');
    if (url) fetchData(url);

    return () => {
      // Clear current file when component unmounts
      setCurrentFile(null);
    };
  }, [params, addFile, getFileContent, setCurrentFile]);

  // Socket event listeners
  useEffect(() => {
    const handleFileChanged = (update: { path: string; content: string }) => {
      if (update.path === path) {
        setValue(update.content);
        lastSavedContentRef.current = update.content;
      }
    };

    socket.on('file-changed', handleFileChanged);

    return () => {
      socket.off('file-changed', handleFileChanged);
    };
  }, [path]);

  const previewParameter = getUrlParameter('preview');

  const previewMode = (() => {
    if (previewParameter === 'edit') return 'edit';
    if (previewParameter === 'live') return 'live';
    return 'preview';
  })();

  const onEditorChange = useCallback(
    (newValue: string | undefined) => {
      setValue(newValue || '');
      handleValueChange(newValue);
    },
    [handleValueChange],
  );

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
      }}
    >
      <MDEditor
        value={value}
        onChange={onEditorChange}
        preview={previewMode}
        style={{
          minHeight: 'calc(100vh - 65px)', // Yeah, I know
        }}
      />
    </div>
  );
};

export default MarkdownViewerPage;
