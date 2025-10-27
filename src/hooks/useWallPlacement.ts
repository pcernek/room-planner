import { useState, useCallback } from 'react';
import Konva from 'konva';
import { IPoint, Unit } from '../types';
import { fromPixels } from '../utils/canvas';
import { distance } from '../utils/geometry';
import { Angle } from '../utils/Angle';

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
  isOverButton: boolean;
  setIsOverButton: (isOver: boolean) => void;
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
  const angle = Angle.radians(angleRadians);
  const snapped = angle.snapTo(45);
  return snapped.getRadians();
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
  const snappedAngleDegrees = Angle.radians(snappedAngle);

  if (sourceWallAngle !== undefined && sourceEndpoint !== undefined) {
    const sourceAngle = Angle.degrees(sourceWallAngle);

    // Check if the new wall would extend the existing wall (same direction)
    const isExtending = snappedAngleDegrees.equals(sourceAngle);

    if (sourceEndpoint === 'start') {
      // When extending from start, backtracking means going in the same direction as the wall
      // This is the same as extending, so we just need to check isExtending
      const isBacktracking = isExtending;

      if (isBacktracking) {
        return start;
      }
    } else {
      // When extending from end, backtracking means going opposite to the wall direction
      const isBacktracking = snappedAngleDegrees.equals(sourceAngle.opposite());

      if (isBacktracking || isExtending) {
        return start;
      }
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
  const [isOverButton, setIsOverButton] = useState<boolean>(false);

  const reset = useCallback(() => {
    setWallStartPoint(null);
    setWallPreviewPoint(null);
    setFromWallInfo(null);
    setIsOverButton(false);
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
    isOverButton,
    setIsOverButton,
    handleStageClick,
    handleStageMouseMove,
    startFromEndpoint,
    reset,
  };
}
