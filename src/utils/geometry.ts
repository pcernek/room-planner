import { IWall, IWallGeometry, IPoint } from '../types';

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}

export function addAngles(angle1: number, angle2: number): number {
  return normalizeAngle(angle1 + angle2);
}

export function calculateWallGeometries(orderedWalls: IWall[], originWallId: string | null): Map<string, IWallGeometry> {
  const geometries = new Map<string, IWallGeometry>();

  if (!originWallId || orderedWalls.length === 0) {
    return geometries;
  }

  let currentPoint: IPoint = { x: 0, y: 0 };

  for (const wall of orderedWalls) {
    const length = wall.length;
    const angleRad = degreesToRadians(wall.angle);
    const endPoint: IPoint = {
      x: currentPoint.x + length * Math.cos(angleRad),
      y: currentPoint.y + length * Math.sin(angleRad),
    };

    geometries.set(wall.id, {
      id: wall.id,
      startPoint: currentPoint,
      endPoint,
      angle: wall.angle,
      length,
    });

    currentPoint = endPoint;
  }

  const originGeometry = geometries.get(originWallId);
  if (!originGeometry) {
    return geometries;
  }

  const offsetX = originGeometry.startPoint.x;
  const offsetY = originGeometry.startPoint.y;

  for (const [wallId, geometry] of geometries) {
    geometries.set(wallId, {
      ...geometry,
      startPoint: {
        x: geometry.startPoint.x - offsetX,
        y: geometry.startPoint.y - offsetY,
      },
      endPoint: {
        x: geometry.endPoint.x - offsetX,
        y: geometry.endPoint.y - offsetY,
      },
    });
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

