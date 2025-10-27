import { useState, useCallback } from 'react';
import Konva from 'konva';
import { IPoint, Unit } from '../types';
import { fromPixels } from '../utils/canvas';
import { distance } from '../utils/geometry';

interface IViewport {
  offsetX: number;
  offsetY: number;
  scale: number;
}

interface IWallPlacementResult {
  wallStartPoint: IPoint | null;
  wallPreviewPoint: IPoint | null;
  handleStageClick: (
    stage: Konva.Stage,
    viewport: IViewport,
    unit: Unit
  ) => { start: IPoint; end: IPoint } | null;
  handleStageMouseMove: (stage: Konva.Stage, viewport: IViewport, unit: Unit) => void;
  reset: () => void;
}

function snapAngleTo45Degrees(angleRadians: number): number {
  const angleDegrees = (angleRadians * 180) / Math.PI;
  const snapped = Math.round(angleDegrees / 45) * 45;
  return (snapped * Math.PI) / 180;
}

function calculateSnappedEndpoint(start: IPoint, mousePoint: IPoint): IPoint {
  const dx = mousePoint.x - start.x;
  const dy = mousePoint.y - start.y;
  const rawAngle = Math.atan2(dy, dx);
  const snappedAngle = snapAngleTo45Degrees(rawAngle);
  const dist = distance(start, mousePoint);

  return {
    x: start.x + dist * Math.cos(snappedAngle),
    y: start.y + dist * Math.sin(snappedAngle),
  };
}

export function useWallPlacement(): IWallPlacementResult {
  const [wallStartPoint, setWallStartPoint] = useState<IPoint | null>(null);
  const [wallPreviewPoint, setWallPreviewPoint] = useState<IPoint | null>(null);

  const reset = useCallback(() => {
    setWallStartPoint(null);
    setWallPreviewPoint(null);
  }, []);

  const handleStageClick = useCallback(
    (
      stage: Konva.Stage,
      viewport: IViewport,
      unit: Unit
    ): { start: IPoint; end: IPoint } | null => {
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return null;

      const worldX = fromPixels((pointerPos.x - viewport.offsetX) / viewport.scale, unit);
      const worldY = fromPixels((pointerPos.y - viewport.offsetY) / viewport.scale, unit);

      const mousePoint = { x: worldX, y: worldY };

      if (!wallStartPoint) {
        setWallStartPoint(mousePoint);
        return null;
      }

      const snappedEnd = calculateSnappedEndpoint(wallStartPoint, mousePoint);
      return { start: wallStartPoint, end: snappedEnd };
    },
    [wallStartPoint]
  );

  const handleStageMouseMove = useCallback(
    (stage: Konva.Stage, viewport: IViewport, unit: Unit) => {
      if (!wallStartPoint) {
        setWallPreviewPoint(null);
        return;
      }

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      const worldX = fromPixels((pointerPos.x - viewport.offsetX) / viewport.scale, unit);
      const worldY = fromPixels((pointerPos.y - viewport.offsetY) / viewport.scale, unit);

      const mousePoint = { x: worldX, y: worldY };
      const snappedEnd = calculateSnappedEndpoint(wallStartPoint, mousePoint);
      setWallPreviewPoint(snappedEnd);
    },
    [wallStartPoint]
  );

  return {
    wallStartPoint,
    wallPreviewPoint,
    handleStageClick,
    handleStageMouseMove,
    reset,
  };
}
