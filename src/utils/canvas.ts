import { Unit } from '../types';

// Constants
export const PIXELS_PER_CM = 2;
export const CM_PER_INCH = 2.54;

/**
 * Get the scale factor for converting logical units to pixels.
 * For cm: 1 cm = 2 pixels
 * For inches: 1 inch = 2.54 * 2 = 5.08 pixels (to maintain visual consistency)
 */
export function getScaleFactor(unit: Unit): number {
  return PIXELS_PER_CM * (unit === 'cm' ? 1 : CM_PER_INCH);
}

/**
 * Convert a value from logical units (cm or inches) to pixels.
 */
export function toPixels(value: number, unit: Unit): number {
  return value * getScaleFactor(unit);
}

/**
 * Convert a value from pixels to logical units (cm or inches).
 */
export function fromPixels(pixels: number, unit: Unit): number {
  return pixels / getScaleFactor(unit);
}

/**
 * Convert a point from logical units to pixels.
 */
export function pointToPixels(
  point: { x: number; y: number },
  unit: Unit
): { x: number; y: number } {
  const scale = getScaleFactor(unit);
  return {
    x: point.x * scale,
    y: point.y * scale,
  };
}

/**
 * Convert a point from pixels to logical units.
 */
export function pointFromPixels(
  point: { x: number; y: number },
  unit: Unit
): { x: number; y: number } {
  const scale = getScaleFactor(unit);
  return {
    x: point.x / scale,
    y: point.y / scale,
  };
}
