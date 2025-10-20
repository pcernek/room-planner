import { useState, useCallback, useMemo } from 'react';
import Konva from 'konva';
import { IPoint, INewFurniture, Unit } from '../types';
import { fromPixels } from '../utils/canvas';

interface IViewport {
  offsetX: number;
  offsetY: number;
  scale: number;
}

interface IFurniturePlacementResult {
  furnitureStart: IPoint | null;
  furniturePreview: IPoint | null;
  previewRect: { x: number; y: number; width: number; height: number } | null;
  handleStageClick: (stage: Konva.Stage, viewport: IViewport, unit: Unit) => INewFurniture | null;
  handleStageMouseMove: (stage: Konva.Stage, viewport: IViewport, unit: Unit) => void;
  reset: () => void;
}

export function useFurniturePlacement(): IFurniturePlacementResult {
  const [furnitureStart, setFurnitureStart] = useState<IPoint | null>(null);
  const [furniturePreview, setFurniturePreview] = useState<IPoint | null>(null);

  const reset = useCallback(() => {
    setFurnitureStart(null);
    setFurniturePreview(null);
  }, []);

  const handleStageClick = useCallback((stage: Konva.Stage, viewport: IViewport, unit: Unit): INewFurniture | null => {
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return null;

    // Convert screen coordinates to world coordinates
    const worldX = fromPixels((pointerPos.x - viewport.offsetX) / viewport.scale, unit);
    const worldY = fromPixels((pointerPos.y - viewport.offsetY) / viewport.scale, unit);

    if (!furnitureStart) {
      // First click - set start point
      setFurnitureStart({ x: worldX, y: worldY });
      setFurniturePreview({ x: worldX, y: worldY });
      return null;
    } else {
      // Second click - create furniture
      const width = Math.abs(worldX - furnitureStart.x);
      const height = Math.abs(worldY - furnitureStart.y);
      const centerX = (furnitureStart.x + worldX) / 2;
      const centerY = (furnitureStart.y + worldY) / 2;

      if (width > 0 && height > 0) {
        const newFurniture: INewFurniture = {
          name: 'New Furniture',
          position: { x: centerX, y: centerY },
          width,
          height,
          rotation: 0,
          unit,
        };

        reset();
        return newFurniture;
      }

      reset();
      return null;
    }
  }, [furnitureStart, reset]);

  const handleStageMouseMove = useCallback((stage: Konva.Stage, viewport: IViewport, unit: Unit) => {
    if (!furnitureStart) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const worldX = fromPixels((pointerPos.x - viewport.offsetX) / viewport.scale, unit);
    const worldY = fromPixels((pointerPos.y - viewport.offsetY) / viewport.scale, unit);

    setFurniturePreview({ x: worldX, y: worldY });
  }, [furnitureStart]);

  const previewRect = useMemo(() => {
    if (furnitureStart && furniturePreview) {
      const x = Math.min(furnitureStart.x, furniturePreview.x);
      const y = Math.min(furnitureStart.y, furniturePreview.y);
      const width = Math.abs(furniturePreview.x - furnitureStart.x);
      const height = Math.abs(furniturePreview.y - furnitureStart.y);
      return { x, y, width, height };
    }
    return null;
  }, [furnitureStart, furniturePreview]);

  return {
    furnitureStart,
    furniturePreview,
    previewRect,
    handleStageClick,
    handleStageMouseMove,
    reset,
  };
}

