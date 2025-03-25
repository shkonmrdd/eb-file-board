import { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { FileType, Position } from '../types';

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
    type: 'embeddable',
    x: config.x,
    y: config.y,
    width: config.width ?? 1024,
    height: config.height ?? 1510,
    link: config.link,
    // @ts-expect-error - This is a valid property
    roundness: { type: 0, value: 0 },
    strokeColor: 'transparent',
    strokeStyle: 'solid',
    backgroundColor: 'white',
    fillStyle: 'solid',
    strokeWidth: 1,
    opacity: 100,
    angle: 0,
    groupIds: [],
  });

  const createFileElement = (
    type: FileType,
    link: string,
    position: Position,
  ): ExcalidrawElement[] => {
    const config: Record<FileType, (link: string) => ElementConfig> = {
      txt: (link) => ({
        ...position,
        link: `/md/?url=${link}&preview=edit`,
      }),
      md: (link) => ({
        ...position,
        width: 1600,
        link: `/md/?url=${link}&preview=live`,
      }),
      pdf: (link) => ({
        ...position,
        link: `/pdf/?url=${link}`,
      }),
    };

    const elementConfig = config[type]?.(link);
    if (!elementConfig) {
      throw new Error(`Unsupported file type: ${type}`);
    }

    return [createEmbeddableElement(elementConfig)];
  };

  const addElementToBoard = (
    excalidrawAPI: ExcalidrawImperativeAPI,
    type: FileType,
    link: string,
    pos: Position,
  ): void => {
    try {
      const elements = createFileElement(type, link, pos);
      const oldElements = excalidrawAPI?.getSceneElements() ?? [];

      excalidrawAPI?.updateScene({
        elements: [...elements, ...oldElements],
      });
    } catch (error) {
      console.error('Failed to create element:', error);
    }
  };

  return {
    createFileElement,
    addElementToBoard,
  };
};
