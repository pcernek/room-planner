import { Unit } from '../types';

export function cmToInches(cm: number): number {
  return cm / 2.54;
}

export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

export function feetInchesToCm(feet: number, inches: number): number {
  return inchesToCm(feet * 12 + inches);
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cmToInches(cm);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { feet, inches };
}

export function toCm(value: number, unit: Unit): number {
  if (unit === 'cm') {
    return value;
  }
  return inchesToCm(value);
}

export function formatDimension(cm: number, displayUnit: Unit): string {
  if (displayUnit === 'cm') {
    return `${cm.toFixed(1)} cm`;
  }
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}' ${inches.toFixed(1)}"`;
}

export function parseFeetInches(input: string): number | null {
  const feetInchesPattern = /^(\d+(?:\.\d+)?)'?\s*(\d+(?:\.\d+)?)"?$/;
  const match = input.match(feetInchesPattern);
  if (match) {
    const feet = parseFloat(match[1]);
    const inches = parseFloat(match[2]);
    return feetInchesToCm(feet, inches);
  }

  const feetOnlyPattern = /^(\d+(?:\.\d+)?)'$/;
  const feetMatch = input.match(feetOnlyPattern);
  if (feetMatch) {
    const feet = parseFloat(feetMatch[1]);
    return feetInchesToCm(feet, 0);
  }

  return null;
}

export function parseCm(input: string): number | null {
  const cmPattern = /^(\d+(?:\.\d+)?)\s*cm$/;
  const match = input.match(cmPattern);
  if (match) {
    return parseFloat(match[1]);
  }

  const numberPattern = /^(\d+(?:\.\d+)?)$/;
  const numberMatch = input.match(numberPattern);
  if (numberMatch) {
    return parseFloat(numberMatch[1]);
  }

  return null;
}

export function parseDimension(input: string): { value: number; unit: Unit } | null {
  const trimmed = input.trim();

  const cmValue = parseCm(trimmed);
  if (cmValue !== null) {
    return { value: cmValue, unit: 'cm' };
  }

  const feetInchesValue = parseFeetInches(trimmed);
  if (feetInchesValue !== null) {
    return { value: feetInchesValue, unit: 'ft-in' };
  }

  return null;
}

