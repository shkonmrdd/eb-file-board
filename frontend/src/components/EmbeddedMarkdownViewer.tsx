import React, { useEffect, useState, useRef, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import axios from 'axios';
import { debounce } from 'lodash';
import { API_CONFIG } from '../constants/config';
import { getAuthHeaders } from '../services/auth';
import { socket } from '../socket';
import { useFileStore } from '../store/fileStore';
import styles from './EmbeddedMarkdownViewer.module.css';

interface EmbeddedMarkdownViewerProps {
  /**
   * Original link value from the Excalidraw embeddable element.
   * Example: "/md/?file=board1/notes.md&preview=live" or "/md/?url=https://..."
   */
  link: string;
}

// Utility: build absolute URL from a relative `file` parameter (same logic as MarkdownViewerPage)
function buildAbsoluteUrl(fileParam: string | null): string | null {
  if (!fileParam) return null;
  const trimmed = fileParam.startsWith('/') ? fileParam.slice(1) : fileParam;
  const uploadsPrefix = API_CONFIG.UPLOADS_ROUTE.replace(/^\//, '');
  const pathWithUploads = trimmed.startsWith(uploadsPrefix) ? trimmed : `${uploadsPrefix}/${trimmed}`;

  const prefix = API_CONFIG.BASE_URL.endsWith('/') ? API_CONFIG.BASE_URL.slice(0, -1) : API_CONFIG.BASE_URL;
  return `${prefix}/${pathWithUploads}`;
}

const EmbeddedMarkdownViewer: React.FC<EmbeddedMarkdownViewerProps> = ({ link }) => {
  const [value, setValue] = useState<string>('');
  const [path, setPath] = useState<string>('');
  const lastSavedContentRef = useRef<string>('');

  // File store helpers
  const { updateFileContent, addFile, getFileContent } = useFileStore();

  /* ------------------------------------------------------------------
   * Parse the link into parameters the same way the standalone page does
   * ---------------------------------------------------------------- */
  const urlObj = new URL(link, window.location.origin);
  const urlParam = urlObj.searchParams.get('url');
  const fileParam = urlObj.searchParams.get('file');
  const previewParam = urlObj.searchParams.get('preview');

  const computedUrl = urlParam || buildAbsoluteUrl(fileParam);

  /* ------------------------------------------------------------------
   * Fetch markdown content (with auth) and keep fileStore in sync
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!computedUrl) return;

    const fetchData = async () => {
      try {
        const urlForStore = new URL(computedUrl);
        const filePath = urlForStore.pathname;
        setPath(filePath);

        // Try store first
        const stored = getFileContent(filePath);
        if (stored !== null) {
          setValue(stored);
          lastSavedContentRef.current = stored;
          return;
        }

        // Fetch from server
        const resp = await axios.get(computedUrl, { headers: getAuthHeaders() });
        const text = resp.data;
        setValue(text);
        lastSavedContentRef.current = text;
        addFile(filePath, text, 'md');
      } catch (err) {
        console.error(err);
        setValue('# File Not Found');
        lastSavedContentRef.current = '# File Not Found';
      }
    };

    fetchData();
  }, [computedUrl, addFile, getFileContent]);

  /* ------------------------------------------------------------------
   * Live updates via socket events emitted elsewhere (file-changed)
   * ---------------------------------------------------------------- */
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

  /* ------------------------------------------------------------------
   * Propagate local edits back to the store (only if preview=edit/live)
   * ---------------------------------------------------------------- */
  const handleValueChange = useCallback(
    debounce((newValue: string | undefined) => {
      const content = newValue || '';
      setValue(content);

      if (path && content !== lastSavedContentRef.current) {
        updateFileContent(path, content, 'md');
        lastSavedContentRef.current = content;
      }
    }, 300),
    [path, updateFileContent],
  );

  const onEditorChange = useCallback(
    (newValue: string | undefined) => {
      setValue(newValue || '');
      handleValueChange(newValue);
    },
    [handleValueChange],
  );

  /* ------------------------------------------------------------------
   * Determine MDEditor preview mode
   * ---------------------------------------------------------------- */
  const previewMode = (() => {
    if (previewParam === 'edit') return 'edit';
    if (previewParam === 'live') return 'live';
    return 'preview';
  })() as 'preview' | 'edit' | 'live';

  /* ------------------------------------------------------------------
   * Detect color mode (light/dark) based on system preference
   * ---------------------------------------------------------------- */
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setColorMode(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e: MediaQueryListEvent) => {
      setColorMode(e.matches ? 'dark' : 'light');
    };

    // Use both addEventListener and the deprecated addListener for better compatibility
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, []);

  return (
    <div 
      className={styles.editorContainer}
      data-color-mode={colorMode}
    >
      {previewMode === 'preview' ? (
        <div className={styles.previewOnly}>
          <MDEditor.Markdown source={value} />
        </div>
      ) : (
        <MDEditor
          value={value}
          onChange={onEditorChange}
          preview={previewMode}
          data-color-mode={colorMode}
          // style={{ height: '100%' }}
        />
      )}
    </div>
  );
};

export default EmbeddedMarkdownViewer; 