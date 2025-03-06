// frontend/src/pages/MarkdownViewerPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import MDEditor from '@uiw/react-md-editor';


const MarkdownViewerPage: React.FC = () => {
  const params = useParams();
  const [value, setValue] = useState<string>('');

  // Fetch markdown content when path parameters change
  useEffect(() => {
    // const filename = params.url
    // const filePath = `/files/${encodeURIComponent(filename)}`;

    const urlParams = new URLSearchParams(location.search);
    const url = urlParams.get("url") ?? "";

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error('File not found');
        return response.text();
      })
      .then(text => setValue(text))
      .catch(() => setValue('# File Not Found'));
  }, [params]);

  useEffect(() => {
    console.log("URL params:", params);
    console.log("Markdown content:", value);
  }, [value]);

  return (
    <div 
    style={{
      width: "100vw",
      height: "100vh",
    }}>
      <MDEditor
        value={value}
        onChange={(value) => setValue(value || '')}
        preview="edit"
        style={{
          minHeight: 'calc(100vh - 1px)', // Yeah, I know
        }}
      />
      {/* <MDEditor.Markdown source={value} style={{ whiteSpace: 'pre-wrap' }} /> */}
    </div>
  );
};

export default MarkdownViewerPage;