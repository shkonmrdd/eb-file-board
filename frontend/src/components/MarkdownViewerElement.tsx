import React, { useEffect, useState, useCallback, useRef } from 'react';
import MarkdownEditor from '@uiw/react-markdown-editor';
import '@uiw/react-markdown-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { socket } from '../socket';
import { debounce } from 'lodash';
import { useFileStore } from '../store/fileStore';
import { getAuthHeaders } from '../services/auth';
import axios from 'axios';
import { API_CONFIG } from '../constants/config';

interface MarkdownViewerElementProps {
  url: string;
  width?: string | number;
  height?: string | number;
  preview?: 'edit' | 'live' | 'preview';
}

const buildAbsoluteUrl = (fileParam: string | null): string | null => {
  if (!fileParam) return null;
  const trimmed = fileParam.startsWith('/') ? fileParam.slice(1) : fileParam;
  const uploadsPrefix = API_CONFIG.UPLOADS_ROUTE.replace(/^\//, '');
  const pathWithUploads = trimmed.startsWith(uploadsPrefix) ? trimmed : `${uploadsPrefix}/${trimmed}`;

  const prefix = API_CONFIG.BASE_URL.endsWith('/') ? API_CONFIG.BASE_URL.slice(0, -1) : API_CONFIG.BASE_URL;
  return `${prefix}/${pathWithUploads}`;
};

const MDEditor = MarkdownEditor;

const MarkdownViewerElement: React.FC<MarkdownViewerElementProps> = ({ 
  url, 
  width = '100%', 
  height = '100%', 
  preview = 'preview' 
}) => {
  const [value, setValue] = useState<string>('');
  const [path, setPath] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep track of the last saved content for comparison
  const lastSavedContentRef = useRef<string>('');

  // Use the file store
  const { updateFileContent, addFile, getFileContent } = useFileStore();

  // Ref to the container for event checks
  const containerRef = useRef<HTMLDivElement | null>(null);

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
    }, 300),
    [path, updateFileContent],
  );

  useEffect(() => {
    const fetchData = async (fileUrl: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // Handle relative URLs by converting to absolute
        const absoluteUrl = fileUrl.startsWith('http') ? fileUrl : buildAbsoluteUrl(fileUrl);
        if (!absoluteUrl) {
          throw new Error('Invalid URL');
        }

        // Try to get content from store first
        const urlObj = new URL(absoluteUrl);
        const filePath = urlObj.pathname;
        setPath(filePath);

        const storedContent = getFileContent(filePath);
        if (storedContent) {
          setValue(storedContent);
          lastSavedContentRef.current = storedContent;
          setIsLoading(false);
          return;
        }

        // If not in store, fetch from server with authentication headers
        const fetchUrl = absoluteUrl.split('?')[0];
        const response = await axios.get(fetchUrl, {
          headers: getAuthHeaders(),
        });

        const text = response.data;
        setValue(text);
        lastSavedContentRef.current = text;

        // Add to file store
        addFile(filePath, text, 'md');
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading markdown:', err);
        setError('Failed to load markdown file');
        setValue('# File Not Found\n\nThe requested markdown file could not be loaded.');
        lastSavedContentRef.current = '# File Not Found\n\nThe requested markdown file could not be loaded.';
        setIsLoading(false);
      }
    };

    if (url) {
      fetchData(url);
    }
  }, [url, addFile, getFileContent]);

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

  const onEditorChange = useCallback(
    (newValue: string | undefined) => {
      setValue(newValue || '');
      handleValueChange(newValue);
    },
    [handleValueChange],
  );

  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
  }, []);

  // Prevent Excalidraw (which registers global key handlers) from capturing
  // keystrokes while the markdown editor is focused.
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

  if (isLoading) {
    return (
      <div 
        style={{ 
          width, 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#666'
        }}
      >
        Loading markdown...
      </div>
    );
  }

  if (error) {
    return (
      <div 
        style={{ 
          width, 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '14px',
          color: '#dc3545'
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onWheelCapture={stopPropagation}
      onPointerDownCapture={stopPropagation}
      style={{ 
        width, 
        height, 
        border: '1px solid #ddd',
        borderRadius: '4px',
        isolation: 'isolate', // Prevent Tailwind interference
        overflowY: 'auto',
        // Reset problematic CSS variables from Excalidraw
        '--input-bg-color': 'initial',
      } as React.CSSProperties}
    >
      <MDEditor
        value={value}
        onChange={(val: string) => onEditorChange(val)}
        {...(() => {
          switch (preview) {
            case 'edit':
              return { visible: false, visibleEditor: true };
            case 'live':
              return { visible: true, visibleEditor: true };
            case 'preview':
            default:
              return { visible: true, visibleEditor: false };
          }
        })()}
        height={typeof height === 'number' ? `${height}px` : typeof height === 'string' ? height : undefined}
        style={{
          minHeight: typeof height === 'number' ? `${height}px` : height,
          backgroundColor: 'white',
        }}
        data-color-mode="light"
      />
    </div>
  );
};

export default MarkdownViewerElement; 