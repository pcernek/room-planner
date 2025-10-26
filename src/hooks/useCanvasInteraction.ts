import { useState } from 'react';
import Konva from 'konva';
import { IViewport } from '../types';

interface ICanvasInteractionResult {
  isDragging: boolean;
  handleStageDragStart: () => void;
  handleStageDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
}

interface ICanvasInteractionParams {
  viewport: IViewport;
  setViewport: (updates: Partial<IViewport>) => void;
}

export function useCanvasInteraction({
  viewport,
  setViewport,
}: ICanvasInteractionParams): ICanvasInteractionResult {
  const [isDragging, setIsDragging] = useState(false);

  function handleStageDragStart() {
    setIsDragging(true);
  }

  function handleStageDragEnd(e: Konva.KonvaEventObject<DragEvent>) {
    setIsDragging(false);
    const stage = e.target as Konva.Stage;
    setViewport({
      offsetX: stage.x(),
      offsetY: stage.y(),
    });
  }

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const delta = e.evt.deltaY > 0 ? 0.95 : 1.05;
    const newScale = Math.max(0.1, Math.min(5, viewport.scale * delta));
    setViewport({ scale: newScale });
  }

  return {
    isDragging,
    handleStageDragStart,
    handleStageDragEnd,
    handleWheel,
  };
}
