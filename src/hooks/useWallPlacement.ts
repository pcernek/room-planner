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

interface IFromWallInfo {
  wallId: string;
  endpoint: 'start' | 'end';
  wallAngle: number;
}

interface IWallPlacementResult {
  wallStartPoint: IPoint | null;
  wallPreviewPoint: IPoint | null;
  fromWallInfo: IFromWallInfo | null;
  handleStageClick: (
    stage: Konva.Stage,
    viewport: IViewport,
    unit: Unit
  ) => { start: IPoint; end: IPoint } | null;
  handleStageMouseMove: (stage: Konva.Stage, viewport: IViewport, unit: Unit) => void;
  startFromEndpoint: (
    point: IPoint,
    wallId: string,
    endpoint: 'start' | 'end',
    wallAngle: number
  ) => void;
  reset: () => void;
}

function snapAngleTo45Degrees(angleRadians: number): number {
  const angleDegrees = (angleRadians * 180) / Math.PI;
  const snapped = Math.round(angleDegrees / 45) * 45;
  return (snapped * Math.PI) / 180;
}

function calculateSnappedEndpoint(
  start: IPoint,
  mousePoint: IPoint,
  sourceWallAngle?: number,
  sourceEndpoint?: 'start' | 'end'
): IPoint {
  const dx = mousePoint.x - start.x;
  const dy = mousePoint.y - start.y;
  const rawAngle = Math.atan2(dy, dx);
  const snappedAngle = snapAngleTo45Degrees(rawAngle);
  const snappedAngleDegrees = (snappedAngle * 180) / Math.PI;

  if (sourceWallAngle !== undefined) {
    const angleDifference = Math.abs(snappedAngleDegrees - sourceWallAngle);
    let normalizedDiff = Math.min(angleDifference, 360 - angleDifference);

    if (sourceEndpoint === 'start') {
      const oppositeAngleDiff = Math.abs(snappedAngleDegrees - (sourceWallAngle + 180));
      const normalizedOppositeDiff = Math.min(oppositeAngleDiff, 360 - oppositeAngleDiff);
      normalizedDiff = Math.min(normalizedDiff, normalizedOppositeDiff);
    }

    const isBacktracking = normalizedDiff > 178;
    if (isBacktracking) {
      return start;
    }
  }

  const dist = distance(start, mousePoint);

  return {
    x: start.x + dist * Math.cos(snappedAngle),
    y: start.y + dist * Math.sin(snappedAngle),
  };
}

export function useWallPlacement(): IWallPlacementResult {
  const [wallStartPoint, setWallStartPoint] = useState<IPoint | null>(null);
  const [wallPreviewPoint, setWallPreviewPoint] = useState<IPoint | null>(null);
  const [fromWallInfo, setFromWallInfo] = useState<IFromWallInfo | null>(null);

  const reset = useCallback(() => {
    setWallStartPoint(null);
    setWallPreviewPoint(null);
    setFromWallInfo(null);
  }, []);

  const startFromEndpoint = useCallback(
    (point: IPoint, wallId: string, endpoint: 'start' | 'end', wallAngle: number) => {
      setWallStartPoint(point);
      setFromWallInfo({ wallId, endpoint, wallAngle });
    },
    []
  );

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

      const snappedEnd = calculateSnappedEndpoint(
        wallStartPoint,
        mousePoint,
        fromWallInfo?.wallAngle,
        fromWallInfo?.endpoint
      );
      return { start: wallStartPoint, end: snappedEnd };
    },
    [wallStartPoint, fromWallInfo]
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
      const snappedEnd = calculateSnappedEndpoint(
        wallStartPoint,
        mousePoint,
        fromWallInfo?.wallAngle,
        fromWallInfo?.endpoint
      );
      setWallPreviewPoint(snappedEnd);
    },
    [wallStartPoint, fromWallInfo]
  );

  return {
    wallStartPoint,
    wallPreviewPoint,
    fromWallInfo,
    handleStageClick,
    handleStageMouseMove,
    startFromEndpoint,
    reset,
  };
}
