import { FrontendAdapter, FrontendEvent } from '../interfaces';
import { Element, ElementId, Structure, EmbeddableElement, FrameElement } from '../core-types';
import { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types/types';
import { debounce } from 'lodash';

export class ExcalidrawAdapter implements FrontendAdapter {
  private excalidrawInstance: ExcalidrawImperativeAPI | null = null;
  private callbacks: ((event: FrontendEvent) => void)[] = [];
  private _previousStructure: Structure | null = null;
  private isUpdating = false;
  
  constructor() {}
  
  setExcalidrawAPI(api: ExcalidrawImperativeAPI) {
    this.excalidrawInstance = api;
    
    // Set up change listener if not already set
    if (api && !this._changeListenerSet) {
      this._setupChangeListener();
      this._changeListenerSet = true;
      console.log('Excalidraw API connected and listener set up');
    }
  }
  
  async initialize(structure: Structure): Promise<void> {
    if (!this.excalidrawInstance) {
      console.warn('ExcalidrawAdapter: Cannot initialize without an excalidraw instance');
      return;
    }
    
    console.log('Initializing Excalidraw adapter with structure');
    
    try {
      // Convert our structure to Excalidraw format
      const excalidrawElements = structure.elements.map(element => 
        this.convertToExcalidrawElement(element)
      );
      
      // Update the Excalidraw scene safely
      this.isUpdating = true;
      this.excalidrawInstance.updateScene({ elements: excalidrawElements });
      this._previousStructure = structure;
      
      // Reset the flag after a delay
      setTimeout(() => {
        this.isUpdating = false;
      }, 200);
      
      console.log('Excalidraw initialized with elements:', excalidrawElements.length);
    } catch (error) {
      console.error('Error initializing Excalidraw:', error);
      this.isUpdating = false;
    }
  }
  
  subscribe(callback: (event: FrontendEvent) => void): void {
    this.callbacks.push(callback);
  }
  
  async updateElement(element: Element): Promise<void> {
    if (!this.excalidrawInstance || this.isUpdating) return;
    
    try {
      const currentElements = this.excalidrawInstance.getSceneElements();
      const excalidrawElement = this.convertToExcalidrawElement(element);
      
      // Replace the element
      const updatedElements = currentElements.map(el => 
        el.id === excalidrawElement.id ? excalidrawElement : el
      );
      
      this.isUpdating = true;
      this.excalidrawInstance.updateScene({ elements: updatedElements });
      
      // Reset the flag after a delay
      setTimeout(() => {
        this.isUpdating = false;
      }, 200);
    } catch (error) {
      console.error('Error updating element:', error);
      this.isUpdating = false;
    }
  }
  
  async addElement(element: Element): Promise<void> {
    if (!this.excalidrawInstance || this.isUpdating) return;
    
    try {
      const currentElements = this.excalidrawInstance.getSceneElements();
      const excalidrawElement = this.convertToExcalidrawElement(element);
      
      this.isUpdating = true;
      this.excalidrawInstance.updateScene({
        elements: [...currentElements, excalidrawElement]
      });
      
      // Reset the flag after a delay
      setTimeout(() => {
        this.isUpdating = false;
      }, 200);
    } catch (error) {
      console.error('Error adding element:', error);
      this.isUpdating = false;
    }
  }
  
  async removeElement(elementId: ElementId): Promise<void> {
    if (!this.excalidrawInstance || this.isUpdating) return;
    
    try {
      const currentElements = this.excalidrawInstance.getSceneElements();
      const filteredElements = currentElements.filter(el => el.id !== elementId);
      
      this.isUpdating = true;
      this.excalidrawInstance.updateScene({ elements: filteredElements });
      
      // Reset the flag after a delay
      setTimeout(() => {
        this.isUpdating = false;
      }, 200);
    } catch (error) {
      console.error('Error removing element:', error);
      this.isUpdating = false;
    }
  }
  
  async getCurrentStructure(): Promise<Structure> {
    if (!this.excalidrawInstance) {
      return { elements: [] };
    }
    
    try {
      const excalidrawElements = this.excalidrawInstance.getSceneElements();
      
      // Convert Excalidraw elements to our structure format
      const elements = excalidrawElements
        .filter(el => !el.isDeleted && (el.type === 'embeddable' || el.type === 'frame'))
        .map(el => this.convertFromExcalidrawElement(el));
      
      return { elements };
    } catch (error) {
      console.error('Error getting current structure:', error);
      return { elements: [] };
    }
  }
  
  // The rest of your methods remain similar, with added error handling
  
  private convertToExcalidrawElement(element: Element): any {
    // Implementation details for converting our elements to Excalidraw format
    const baseProps = {
      id: element.id,
      updated: element.updated,
      x: 0, y: 0, 
      width: 400, height: 300,
      strokeColor: 'transparent',
      backgroundColor: 'white',
      fillStyle: 'solid',
      strokeWidth: 1,
      strokeStyle: 'solid',
      roughness: 1,
      opacity: 100,
      version: 1,
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
    };
    
    if (element.type === 'embeddable') {
      const embeddable = element as EmbeddableElement;
      return {
        ...baseProps,
        type: 'embeddable',
        link: embeddable.link,
      };
    } else {
      return {
        ...baseProps,
        type: 'frame',
        strokeColor: '#1e1e1e',
        backgroundColor: 'transparent',
      };
    }
  }
  
  private convertFromExcalidrawElement(excalidrawElement: any): Element {
    if (excalidrawElement.type === 'embeddable') {
      return {
        id: excalidrawElement.id,
        type: 'embeddable',
        link: excalidrawElement.link,
        updated: excalidrawElement.updated || Date.now(),
      } as EmbeddableElement;
    } else if (excalidrawElement.type === 'frame') {
      return {
        id: excalidrawElement.id,
        type: 'frame',
        updated: excalidrawElement.updated || Date.now(),
      } as FrameElement;
    } else {
      // Skip unsupported element types
      throw new Error(`Unsupported element type: ${excalidrawElement.type}`);
    }
  }
  
  // Debounce the change handler to prevent excessive updates
  private handleExcalidrawChange = debounce((elements: any[], appState: any): void => {
    if (this.isUpdating) {
      console.log('Skipping change handling - currently updating');
      return;
    }
    
    try {
      // Skip if we don't have previous state yet
      if (!this._previousStructure) {
        this._previousStructure = { elements: [] };
        return;
      }
      
      const previousElements = this._previousStructure.elements;
      
      // Get current elements in our format
      const currentElements = elements
        .filter(el => !el.isDeleted && (el.type === 'embeddable' || el.type === 'frame'))
        .map(el => this.convertFromExcalidrawElement(el));
      
      // Update previous structure for next comparison
      this._previousStructure = { elements: currentElements };
      
      // Find added elements
      const addedElements = currentElements.filter(currentEl => 
        !previousElements.some(prevEl => prevEl.id === currentEl.id)
      );
      
      // Find updated elements
      const updatedElements = currentElements.filter(currentEl => 
        previousElements.some(prevEl => 
          prevEl.id === currentEl.id && 
          JSON.stringify(prevEl) !== JSON.stringify(currentEl)
        )
      );
      
      // Find deleted elements
      const deletedElementIds = previousElements
        .filter(prevEl => 
          !currentElements.some(currentEl => currentEl.id === prevEl.id)
        )
        .map(el => el.id);
      
      // Notify about added elements
      addedElements.forEach(element => {
        this.notifySubscribers({
          type: 'elementAdded',
          payload: element
        });
      });
      
      // Notify about updated elements
      updatedElements.forEach(element => {
        this.notifySubscribers({
          type: 'elementUpdated',
          payload: element
        });
      });
      
      // Notify about deleted elements
      deletedElementIds.forEach(elementId => {
        this.notifySubscribers({
          type: 'elementDeleted',
          payload: { id: elementId }
        });
      });
      
      // Notify about overall structure change
      if (addedElements.length > 0 || updatedElements.length > 0 || deletedElementIds.length > 0) {
        this.notifySubscribers({
          type: 'structureChanged',
          payload: { 
            addedCount: addedElements.length, 
            updatedCount: updatedElements.length, 
            deletedCount: deletedElementIds.length,
            elements: currentElements,
            appState
          }
        });
      }
    } catch (error) {
      console.error('Error handling Excalidraw change:', error);
    }
  }, 300);
  
  private _setupChangeListener() {
    if (!this.excalidrawInstance) return;
    
    const onChange = (elements: any[], appState: any) => {
      this.handleExcalidrawChange(elements, appState);
    };
    
    // Store original onChange if it exists
    const originalOnChange = this.excalidrawInstance.onChange;
    
    // Replace with our wrapper
    this.excalidrawInstance.onChange = (elements, appState) => {
      if (this.isUpdating) {
        console.log('Skipping onChange - currently updating');
        return;
      }
      
      // Call our handler
      onChange(elements, appState);
      
      // Call original if it exists
      if (originalOnChange && !this.isUpdating) {
        originalOnChange(elements, appState);
      }
    };
  }
  
  private notifySubscribers(event: FrontendEvent): void {
    this.callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in frontend event callback:', error);
      }
    });
  }
  
  private _changeListenerSet = false;
}