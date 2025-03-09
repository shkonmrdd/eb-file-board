import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router";
import MDEditor from "@uiw/react-md-editor";
import { socket, emitFileUpdate } from "../socket";
import { debounce } from "lodash";

// Move debounce outside component
const debouncedEmitFileUpdate = debounce((path: string, content: string) => {
  emitFileUpdate(path, content);
}, 100);

const getUrlParameter = (name: string): string | null => {
  const urlParams = new URLSearchParams(location.search);
  return urlParams.get(name) ?? "";
};

const MarkdownViewerPage: React.FC = () => {
  const params = useParams();
  const [value, setValue] = useState<string>("");
  const [path, setPath] = useState<string>("");

  // Handle value changes and emit socket event
  const handleValueChange = useCallback(
    (newValue: string | undefined) => {
      const content = newValue || "";
      setValue(content);
      
      if (path) {
        debouncedEmitFileUpdate(path, content);
      }
    },
    [path] // path is the only dependency now
  );

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

  // Socket event listeners
  useEffect(() => {
    const handleFileUpdated = (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        console.error("Failed to update file:", response.error);
      }
    };

    const handleFileChanged = (update: { path: string; content: string }) => {
      if (update.path === path) {
        setValue(update.content);
      }
    };

    socket.on("file-updated", handleFileUpdated);
    socket.on("file-changed", handleFileChanged);

    return () => {
      socket.off("file-updated", handleFileUpdated);
      socket.off("file-changed", handleFileChanged);
    };
  }, [path]);

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
