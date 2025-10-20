import { IRoom, IWallGeometry, IViewport, Unit } from '../types';
import { toPixels } from './canvas';

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
    // All coordinates are already in the room's chosen unit
    minX = Math.min(minX, furniture.position.x);
    minY = Math.min(minY, furniture.position.y);
    maxX = Math.max(maxX, furniture.position.x + furniture.width);
    maxY = Math.max(maxY, furniture.position.y + furniture.height);
  });

  return { minX, minY, maxX, maxY };
}

export function calculateCenteredViewport(
  boundingBox: IBoundingBox,
  stageWidth: number,
  stageHeight: number,
  buffer: number,
  unit: Unit
): IViewport {
  const { minX, minY, maxX, maxY } = boundingBox;

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const contentWidthPx = toPixels(contentWidth, unit);
  const contentHeightPx = toPixels(contentHeight, unit);

  const availableWidth = stageWidth - 2 * buffer;
  const availableHeight = stageHeight - 2 * buffer;

  const scaleX = availableWidth / contentWidthPx;
  const scaleY = availableHeight / contentHeightPx;
  const scale = Math.min(scaleX, scaleY, 1);

  const contentCenterX = (minX + maxX) / 2;
  const contentCenterY = (minY + maxY) / 2;

  const offsetX = stageWidth / 2 - toPixels(contentCenterX, unit) * scale;
  const offsetY = stageHeight / 2 - toPixels(contentCenterY, unit) * scale;

  return { offsetX, offsetY, scale };
}

