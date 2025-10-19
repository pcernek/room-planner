import { IWall, IWallGeometry, IPoint } from '../types';
import { toCm } from './units';

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function calculateWallGeometries(walls: IWall[], originWallId: string | null): Map<string, IWallGeometry> {
  const geometries = new Map<string, IWallGeometry>();

  if (!originWallId || walls.length === 0) {
    return geometries;
  }

  const wallMap = new Map<string, IWall>();
  walls.forEach(wall => wallMap.set(wall.id, wall));

  const originWall = wallMap.get(originWallId);
  if (!originWall) {
    return geometries;
  }

  const startPoint: IPoint = { x: 0, y: 0 };
  const lengthInCm = toCm(originWall.length, originWall.unit);
  const angleRad = degreesToRadians(originWall.angle);
  const endPoint: IPoint = {
    x: startPoint.x + lengthInCm * Math.cos(angleRad),
    y: startPoint.y + lengthInCm * Math.sin(angleRad),
  };

  geometries.set(originWall.id, {
    id: originWall.id,
    startPoint,
    endPoint,
    angle: originWall.angle,
    lengthInCm,
  });

  const processed = new Set<string>([originWallId]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const wall of walls) {
      if (processed.has(wall.id)) {
        continue;
      }

      if (!wall.previousWallId) {
        continue;
      }

      const previousGeometry = geometries.get(wall.previousWallId);
      if (!previousGeometry) {
        continue;
      }

      const newStartPoint = previousGeometry.endPoint;
      const newLengthInCm = toCm(wall.length, wall.unit);
      const newAngleRad = degreesToRadians(wall.angle);
      const newEndPoint: IPoint = {
        x: newStartPoint.x + newLengthInCm * Math.cos(newAngleRad),
        y: newStartPoint.y + newLengthInCm * Math.sin(newAngleRad),
      };

      geometries.set(wall.id, {
        id: wall.id,
        startPoint: newStartPoint,
        endPoint: newEndPoint,
        angle: wall.angle,
        lengthInCm: newLengthInCm,
      });

      processed.add(wall.id);
      changed = true;
    }
  }

  return geometries;
}

export function pointToLineDistance(point: IPoint, lineStart: IPoint, lineEnd: IPoint): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    const pdx = point.x - lineStart.x;
    const pdy = point.y - lineStart.y;
    return Math.sqrt(pdx * pdx + pdy * pdy);
  }

  const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared));

  const projectionX = lineStart.x + t * dx;
  const projectionY = lineStart.y + t * dy;

  const distX = point.x - projectionX;
  const distY = point.y - projectionY;

  return Math.sqrt(distX * distX + distY * distY);
}

export function isPointNearLine(point: IPoint, lineStart: IPoint, lineEnd: IPoint, threshold: number): boolean {
  return pointToLineDistance(point, lineStart, lineEnd) < threshold;
}

export function distance(point1: IPoint, point2: IPoint): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

