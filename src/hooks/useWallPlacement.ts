import { useState, useCallback } from 'react';
import Konva from 'konva';
import { IPoint, Unit } from '../types';
import { fromPixels } from '../utils/canvas';

interface IViewport {
  offsetX: number;
  offsetY: number;
  scale: number;
}

interface IWallPlacementResult {
  wallStartPoint: IPoint | null;
  handleStageClick: (stage: Konva.Stage, viewport: IViewport, unit: Unit) => IPoint | null;
  reset: () => void;
}

export function useWallPlacement(): IWallPlacementResult {
  const [wallStartPoint, setWallStartPoint] = useState<IPoint | null>(null);

  const reset = useCallback(() => {
    setWallStartPoint(null);
  }, []);

  const handleStageClick = useCallback(
    (stage: Konva.Stage, viewport: IViewport, unit: Unit): IPoint | null => {
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return null;

      const worldX = fromPixels((pointerPos.x - viewport.offsetX) / viewport.scale, unit);
      const worldY = fromPixels((pointerPos.y - viewport.offsetY) / viewport.scale, unit);

      const point = { x: worldX, y: worldY };
      setWallStartPoint(point);
      return point;
    },
    []
  );

  return {
    wallStartPoint,
    handleStageClick,
    reset,
  };
}
