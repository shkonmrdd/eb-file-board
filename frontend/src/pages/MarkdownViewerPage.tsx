import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import MDEditor from "@uiw/react-md-editor";

const MarkdownViewerPage: React.FC = () => {
  const params = useParams();
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const url = urlParams.get("url") ?? "";

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("File not found");
        }

        const text = await response.text();
        setValue(text);
      } catch (error) {
        setValue("# File Not Found");
        console.error(error);
      }
    };

    fetchData();
  }, [params]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
      }}
    >
      <MDEditor
        value={value}
        onChange={(value) => setValue(value || "")}
        preview="edit"
        style={{
          minHeight: "calc(100vh - 1px)", // Yeah, I know
        }}
      />
      {/* <MDEditor.Markdown source={value} style={{ whiteSpace: 'pre-wrap' }} /> */}
    </div>
  );
};

export default MarkdownViewerPage;
