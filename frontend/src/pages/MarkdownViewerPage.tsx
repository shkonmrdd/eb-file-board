import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router";
import MDEditor from "@uiw/react-md-editor";
import { socket, emitFileUpdate } from "../socket";

const getUrlParameter = (name: string): string | null => {
  const urlParams = new URLSearchParams(location.search);
  return urlParams.get(name) ?? "";
};

const MarkdownViewerPage: React.FC = () => {
  const params = useParams();
  const [value, setValue] = useState<string>("");
  const [path, setPath] = useState<string>("");

  useEffect(() => {
    const fetchData = async (url: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("File not found");
        }

        const text = await response.text();
        setValue(text);
        // Extract path from URL and store it
        const urlObj = new URL(url);
        setPath(urlObj.pathname);
      } catch (error) {
        setValue("# File Not Found");
        console.error(error);
      }
    };

    const url = getUrlParameter("url");
    if (url) fetchData(url);
  }, [params]);

  // Handle value changes and emit socket event
  const handleValueChange = useCallback((newValue: string | undefined) => {
    const content = newValue || "";
    setValue(content);
    
    if (path) {
      emitFileUpdate(path, content);
    }
  }, [path]);

  // Socket event listener for file update confirmation
  useEffect(() => {
    const handleFileUpdated = (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        console.error("Failed to update file:", response.error);
      }
    };

    socket.on("file-updated", handleFileUpdated);

    return () => {
      socket.off("file-updated", handleFileUpdated);
    };
  }, []);

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
        onChange={handleValueChange}
        preview={previewMode}
        style={{
          minHeight: "calc(100vh - 65px)", // Yeah, I know
        }}
      />
    </div>
  );
};

export default MarkdownViewerPage;
