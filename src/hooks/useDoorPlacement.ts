import { Unit } from '../types';

export function calculateDefaultDoorWidth(wallLength: number, unit: Unit): number {
  const maxWidth = unit === 'cm' ? 75 : 30;
  return Math.min(maxWidth, wallLength);
}

interface IDoorPlacementResult {
  calculateDefaultDoorWidth: (wallLength: number, unit: Unit) => number;
}

export function useDoorPlacement(): IDoorPlacementResult {
  return {
    calculateDefaultDoorWidth,
  };
}
