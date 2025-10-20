import { Circle } from 'react-konva';
import { IPoint } from '../../types';

const PIXELS_PER_CM = 2;
const ENDPOINT_RADIUS = 8;

interface IProps {
  point: IPoint;
  isFree?: boolean;
}

export function Endpoint({ point }: IProps) {
  return (
    <Circle
      x={point.x * PIXELS_PER_CM}
      y={point.y * PIXELS_PER_CM}
      radius={ENDPOINT_RADIUS}
      fill="#666"
    />
  );
}

