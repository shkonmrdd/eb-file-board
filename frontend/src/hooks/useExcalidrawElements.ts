import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";

interface ElementConfig {
  x: number;
  y: number;
  width?: number;
  height?: number;
  link: string;
}

export const useExcalidrawElements = () => {
  const createEmbeddableElement = (config: ElementConfig): ExcalidrawElement => ({
    id: crypto.randomUUID(),
    type: "embeddable",
    x: config.x,
    y: config.y,
    width: config.width ?? 1024,
    height: config.height ?? 1450,
    link: config.link,
    // @ts-expect-error - This is a valid property
    roundness: { type: 0, value: 0 },
    strokeColor: "black",
    strokeStyle: "solid",
    backgroundColor: "white",
    fillStyle: "solid",
    strokeWidth: 1,
    opacity: 100,
    angle: 0,
    groupIds: [],
  });

  const createFileElement = (
    type: string,
    link: string,
    position: { x: number; y: number }
  ): ExcalidrawElement[] => {
    const baseUrl = "http://localhost:3001";

    const config: Record<string, (link: string) => ElementConfig> = {
      txt: (link) => ({
        ...position,
        link: `/md/?url=${baseUrl}${link}&preview=edit`,
      }),
      md: (link) => ({
        ...position,
        width: 1600,
        link: `/md/?url=${baseUrl}${link}&preview=live`,
      }),
      pdf: (link) => ({
        ...position,
        link: `/pdf/?url=${baseUrl}${link}`,
      }),
    };

    const elementConfig = config[type]?.(link);
    if (!elementConfig) {
      throw new Error(`Unsupported file type: ${type}`);
    }

    return [createEmbeddableElement(elementConfig)];
  };

  return { createFileElement };
};