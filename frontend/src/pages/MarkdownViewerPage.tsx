import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import MDEditor from "@uiw/react-md-editor";

const getUrlParameter = (name: string): string | null => {
  const urlParams = new URLSearchParams(location.search);
  return urlParams.get(name) ?? "";
};

const MarkdownViewerPage: React.FC = () => {
  const params = useParams();
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    const fetchData = async (url: string) => {
      try {
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

    const url = getUrlParameter("url");
    if (url) fetchData(url);
  }, [params]);

  const previewParameter = getUrlParameter("preview");

  const previewMode = (() => {
    if (previewParameter === "edit") return "edit";
    if (previewParameter === "live") return "live";
    return "preview";
  })();

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
        preview={previewMode}
        style={{
          minHeight: "calc(100vh - 65px)", // Yeah, I know
        }}
      />
      {/* <MDEditor.Markdown source={value} style={{ whiteSpace: 'pre-wrap' }} /> */}
    </div>
  );
};

export default MarkdownViewerPage;
