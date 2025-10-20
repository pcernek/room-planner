import { Circle } from 'react-konva';
import { IPoint } from '../../types';

const PIXELS_PER_CM = 2;
const ENDPOINT_RADIUS = 8;
const FREE_ENDPOINT_RADIUS = 12;

interface IProps {
  point: IPoint;
  isFree?: boolean;
}

export function Endpoint({ point, isFree = false }: IProps) {
  if (isFree) {
    return (
      <Circle
        x={point.x * PIXELS_PER_CM}
        y={point.y * PIXELS_PER_CM}
        radius={FREE_ENDPOINT_RADIUS}
        fill="#fff"
        stroke="#4A90E2"
        strokeWidth={3}
      />
    );
  }

  return (
    <Circle
      x={point.x * PIXELS_PER_CM}
      y={point.y * PIXELS_PER_CM}
      radius={ENDPOINT_RADIUS}
      fill="#666"
    />
  );
}

