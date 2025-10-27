import { IWall, IWallGeometry, IPoint, IWallSequence } from '../types';

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

export function calculateWallGeometries(
  wallSequences: IWallSequence[]
): Map<string, IWallGeometry> {
  const geometries = new Map<string, IWallGeometry>();

  for (const sequence of wallSequences) {
    const wallMap = new Map<string, IWall>();
    for (const wall of sequence.walls) {
      wallMap.set(wall.id, wall);
    }

    for (const wall of sequence.walls) {
      let startPoint: IPoint;

      if (wall.previousWallId === null) {
        startPoint = sequence.position;
      } else {
        const previousGeometry = geometries.get(wall.previousWallId);
        if (!previousGeometry) {
          continue;
        }
        startPoint = previousGeometry.endPoint;
      }

      const length = wall.length;
      const angleRad = degreesToRadians(wall.angle);
      const endPoint: IPoint = {
        x: startPoint.x + length * Math.cos(angleRad),
        y: startPoint.y + length * Math.sin(angleRad),
      };

      geometries.set(wall.id, {
        id: wall.id,
        startPoint,
        endPoint,
        angle: wall.angle,
        length,
      });
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

  const t = Math.max(
    0,
    Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared)
  );

  const projectionX = lineStart.x + t * dx;
  const projectionY = lineStart.y + t * dy;

  const distX = point.x - projectionX;
  const distY = point.y - projectionY;

  return Math.sqrt(distX * distX + distY * distY);
}

export function isPointNearLine(
  point: IPoint,
  lineStart: IPoint,
  lineEnd: IPoint,
  threshold: number
): boolean {
  return pointToLineDistance(point, lineStart, lineEnd) < threshold;
}

export function distance(point1: IPoint, point2: IPoint): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}
