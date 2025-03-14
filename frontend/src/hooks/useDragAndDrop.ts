import { useCallback } from "react";
import { nanoid } from "nanoid";
import { useSyncContext } from "../sync/SyncContext";

export function useDragAndDrop() {
  const { excalidrawAdapter } = useSyncContext();
  
  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      
      // Extract drop coordinates
      const { clientX, clientY } = event;
      
      // Get API from adapter
      const excalidrawAPI = (excalidrawAdapter as any).excalidrawInstance;
      if (!excalidrawAPI) {
        console.error("Excalidraw API not available");
        return;
      }
      
      // Convert view coordinates to scene coordinates
      const { x, y } = excalidrawAPI.getViewportCoords(clientX, clientY);
      
      // Handle file drops
      if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
        const files = Array.from(event.dataTransfer.files);
        
        for (const file of files) {
          try {
            // Upload the file
            const formData = new FormData();
            formData.append("file", file);
            
            const response = await fetch("http://localhost:3001/upload", {
              method: "POST",
              body: formData,
            });
            
            if (!response.ok) {
              throw new Error(`Upload failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log("File uploaded:", data);
            
            // Determine the file type and create appropriate link
            const fileUrl = data.fileUrl;
            const isMarkdown = /\.(md|txt)$/i.test(file.name);
            const isPDF = /\.pdf$/i.test(file.name);
            
            // Create an appropriate embeddable element link
            let link;
            if (isMarkdown) {
              link = `/md/?url=${fileUrl}&preview=edit`;
            } else if (isPDF) {
              link = `/pdf/?url=${fileUrl}&preview=view`;
            } else {
              // Just a plain link for other file types
              link = fileUrl;
            }
            
            // Create an embeddable element for the file
            const element = {
              id: nanoid(),
              type: "embeddable",
              link,
              x,
              y,
              width: 600,
              height: 800,
              strokeColor: "transparent",
              backgroundColor: "transparent",
              fillStyle: "solid",
              strokeWidth: 1,
              strokeStyle: "solid",
              roughness: 1,
              opacity: 100,
              updated: Date.now(),
              version: 1,
              versionNonce: Math.floor(Math.random() * 1000000),
              isDeleted: false,
            };
            
            // Add element to the board
            excalidrawAPI.updateScene({
              elements: [...excalidrawAPI.getSceneElements(), element],
            });
            
            console.log("Added embeddable element:", element);
          } catch (error) {
            console.error("Error handling file drop:", error);
          }
        }
      }
    },
    [excalidrawAdapter]
  );
  
  return { handleDrop };
}