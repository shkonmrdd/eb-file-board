import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router';
import MarkdownEditor from '@uiw/react-markdown-editor';
import { socket } from '../socket';
import { debounce } from 'lodash';
import { useFileStore } from '../store/fileStore';
import { getAuthHeaders } from '../services/auth';
import axios from 'axios';
import { API_CONFIG } from '../constants/config';
import '@uiw/react-markdown-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

// Preserve original component name to avoid refactor of the rest of the file
const MDEditor = MarkdownEditor;

const buildAbsoluteUrl = (fileParam: string | null): string | null => {
  if (!fileParam) return null;
  const trimmed = fileParam.startsWith('/') ? fileParam.slice(1) : fileParam;
  const uploadsPrefix = API_CONFIG.UPLOADS_ROUTE.replace(/^\//, '');
  const pathWithUploads = trimmed.startsWith(uploadsPrefix) ? trimmed : `${uploadsPrefix}/${trimmed}`;

  const prefix = API_CONFIG.BASE_URL.endsWith('/') ? API_CONFIG.BASE_URL.slice(0, -1) : API_CONFIG.BASE_URL;
  return `${prefix}/${pathWithUploads}`;
};

const getUrlParameter = (name: string): string | null => {
  const urlParams = new URLSearchParams(location.search);
  return urlParams.get(name) ?? null;
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

        // If not in store, fetch from server with authentication headers
        const response = await axios.get(url, {
          headers: getAuthHeaders(),
        });

        const text = response.data;
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

    const urlParam = getUrlParameter('url');
    const fileParam = getUrlParameter('file');

    const url = urlParam || buildAbsoluteUrl(fileParam);

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

  // container ref for stopping global key handlers, though Excalidraw not present, but safe
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const keyHandler = (ev: KeyboardEvent): void => {
      if (containerRef.current && containerRef.current.contains(ev.target as Node)) {
        ev.stopPropagation();
      }
    };
    window.addEventListener('keydown', keyHandler, true);
    window.addEventListener('keyup', keyHandler, true);
    return () => {
      window.removeEventListener('keydown', keyHandler, true);
      window.removeEventListener('keyup', keyHandler, true);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        overflowY: 'auto',
      }}
    >
      <MDEditor
        value={value}
        onChange={(val: string) => onEditorChange(val)}
        {...(() => {
          switch (previewMode) {
            case 'edit':
              return { visible: false, visibleEditor: true };
            case 'live':
              return { visible: true, visibleEditor: true };
            case 'preview':
            default:
              return { visible: true, visibleEditor: false };
          }
        })()}
        style={{
          minHeight: 'calc(100vh - 65px)',
        }}
      />
    </div>
  );
};

export default MarkdownViewerPage;
