import { IRoom, IWallGeometry, IViewport } from '../types';
import { toCm } from './units';

const PIXELS_PER_CM = 2;

interface IBoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function calculateBoundingBox(
  wallGeometries: Map<string, IWallGeometry>,
  room: IRoom
): IBoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  wallGeometries.forEach((geometry) => {
    minX = Math.min(minX, geometry.startPoint.x, geometry.endPoint.x);
    minY = Math.min(minY, geometry.startPoint.y, geometry.endPoint.y);
    maxX = Math.max(maxX, geometry.startPoint.x, geometry.endPoint.x);
    maxY = Math.max(maxY, geometry.startPoint.y, geometry.endPoint.y);
  });

  room.furniture.forEach((furniture) => {
    const widthCm = toCm(furniture.width, furniture.unit);
    const heightCm = toCm(furniture.height, furniture.unit);
    minX = Math.min(minX, furniture.position.x);
    minY = Math.min(minY, furniture.position.y);
    maxX = Math.max(maxX, furniture.position.x + widthCm);
    maxY = Math.max(maxY, furniture.position.y + heightCm);
  });

  return { minX, minY, maxX, maxY };
}

export function calculateCenteredViewport(
  boundingBox: IBoundingBox,
  stageWidth: number,
  stageHeight: number,
  buffer: number
): IViewport {
  const { minX, minY, maxX, maxY } = boundingBox;

  const contentWidthCm = maxX - minX;
  const contentHeightCm = maxY - minY;
  const contentWidthPx = contentWidthCm * PIXELS_PER_CM;
  const contentHeightPx = contentHeightCm * PIXELS_PER_CM;

  const availableWidth = stageWidth - 2 * buffer;
  const availableHeight = stageHeight - 2 * buffer;

  const scaleX = availableWidth / contentWidthPx;
  const scaleY = availableHeight / contentHeightPx;
  const scale = Math.min(scaleX, scaleY, 1);

  const contentCenterX = (minX + maxX) / 2;
  const contentCenterY = (minY + maxY) / 2;

  const offsetX = stageWidth / 2 - contentCenterX * PIXELS_PER_CM * scale;
  const offsetY = stageHeight / 2 - contentCenterY * PIXELS_PER_CM * scale;

  return { offsetX, offsetY, scale };
}

