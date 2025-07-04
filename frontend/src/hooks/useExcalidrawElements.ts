import { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { FileType, Position } from '../types';
import { API_CONFIG } from '../constants/config';

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

  const toRelativeFileParam = (absoluteUrl: string): string => {
    try {
      const { pathname } = new URL(absoluteUrl);

      // Trim leading slash and uploads route prefix if present
      let relative = pathname.startsWith('/') ? pathname.slice(1) : pathname;

      const uploadsPrefix = API_CONFIG.UPLOADS_ROUTE.replace(/^\//, '') + '/'; // e.g., 'files/'
      if (relative.startsWith(uploadsPrefix)) {
        relative = relative.slice(uploadsPrefix.length);
      }

      return relative; // e.g., 'boardName/filename.ext'
    } catch {
      return absoluteUrl;
    }
  };

  const createFileElement = (
    type: FileType,
    link: string,
    position: Position,
  ): ExcalidrawElement[] => {
    const relativePath = toRelativeFileParam(link);

    const config: Record<FileType, (fileParam: string) => ElementConfig> = {
      txt: (fileParam) => ({
        ...position,
        link: `/md/?file=${fileParam}&preview=edit`,
      }),
      md: (fileParam) => ({
        ...position,
        width: 1600,
        link: `/md/?file=${fileParam}&preview=live`,
      }),
      pdf: (fileParam) => ({
        ...position,
        link: `/pdf/?file=${fileParam}`,
      }),
    };

    const elementConfig = config[type]?.(relativePath);
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
