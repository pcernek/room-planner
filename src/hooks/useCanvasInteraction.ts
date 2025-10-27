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
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = viewport.scale;
    const delta = e.evt.deltaY > 0 ? 0.95 : 1.05;
    const newScale = Math.max(0.1, Math.min(5, oldScale * delta));

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - viewport.offsetX) / oldScale,
      y: (pointer.y - viewport.offsetY) / oldScale,
    };

    const newOffsetX = pointer.x - mousePointTo.x * newScale;
    const newOffsetY = pointer.y - mousePointTo.y * newScale;

    setViewport({
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
    });
  }

  return {
    isDragging,
    handleStageDragStart,
    handleStageDragEnd,
    handleWheel,
  };
}
