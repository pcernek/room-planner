/**
 * Angle utility class for working with angles.
 *
 * Angles are normalized to [-180°, 180°] range:
 * - Positive angles = clockwise rotation
 * - Negative angles = counter-clockwise rotation
 * - This matches Math.atan2() output and is more intuitive than [0°, 360°]
 *
 * Examples:
 * - 0° = East (right)
 * - 90° = North (up)
 * - 180° or -180° = West (left)
 * - -90° = South (down)
 */
export class Angle {
  private readonly value: number;

  private constructor(degrees: number) {
    this.value = Angle.normalize(degrees);
  }

  /**
   * Create an Angle from degrees
   */
  static degrees(degrees: number): Angle {
    return new Angle(degrees);
  }

  /**
   * Create an Angle from radians
   */
  static radians(radians: number): Angle {
    return new Angle((radians * 180) / Math.PI);
  }

  /**
   * Normalize an angle to [-180°, 180°] range
   */
  private static normalize(degrees: number): number {
    // First reduce to [0, 360) range
    let normalized = degrees % 360;

    // Then shift to [-180, 180) range
    if (normalized > 180) {
      normalized -= 360;
    } else if (normalized <= -180) {
      normalized += 360;
    }

    return normalized;
  }

  /**
   * Get the angle in degrees [-180°, 180°]
   */
  getDegrees(): number {
    return this.value;
  }

  /**
   * Get the angle in radians [-π, π]
   */
  getRadians(): number {
    return (this.value * Math.PI) / 180;
  }

  /**
   * Get the angle in [0°, 360°) range (always positive)
   */
  toPositive(): number {
    return this.value < 0 ? this.value + 360 : this.value;
  }

  /**
   * Add degrees to this angle
   */
  add(degrees: number): Angle {
    return new Angle(this.value + degrees);
  }

  /**
   * Subtract degrees from this angle
   */
  subtract(degrees: number): Angle {
    return new Angle(this.value - degrees);
  }

  /**
   * Get the opposite direction (add 180 degrees)
   */
  opposite(): Angle {
    return this.add(180);
  }

  /**
   * Calculate the smallest angular difference between this angle and another.
   * Returns a value in [0, 180] representing the absolute difference.
   */
  absoluteDifferenceTo(other: Angle): number {
    const diff = Math.abs(this.value - other.value);
    return Math.min(diff, 360 - diff);
  }

  /**
   * Check if this angle is approximately equal to another angle within a tolerance.
   */
  equals(other: Angle, tolerance: number = 2): boolean {
    return this.absoluteDifferenceTo(other) < tolerance;
  }

  /**
   * Check if this angle is approximately opposite to another angle within a tolerance.
   */
  isOpposite(other: Angle, tolerance: number = 2): boolean {
    return this.absoluteDifferenceTo(other.opposite()) < tolerance;
  }

  /**
   * Snap an angle to the nearest multiple of snapDegrees
   */
  snapTo(snapDegrees: number): Angle {
    const snapped = Math.round(this.value / snapDegrees) * snapDegrees;
    return new Angle(snapped);
  }

  toString(): string {
    return `${this.value.toFixed(1)}°`;
  }
}
