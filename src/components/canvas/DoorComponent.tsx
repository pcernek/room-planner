import { Line, Arc } from 'react-konva';
import { IDoor, IWallGeometry } from '../../types';
import { toCm } from '../../utils/units';

const PIXELS_PER_CM = 2;
const WALL_THICKNESS = 8;
const DOOR_COLOR = '#8B4513';
const SELECTION_COLOR = '#FF6B6B';

interface IProps {
  door: IDoor;
  wallGeometry: IWallGeometry;
  isSelected: boolean;
  onSelect: () => void;
}

export function DoorComponent({ door, wallGeometry, isSelected, onSelect }: IProps) {
  const offsetInCm = toCm(door.offsetFromStart, door.unit);
  const widthInCm = toCm(door.width, door.unit);

  const dx = wallGeometry.endPoint.x - wallGeometry.startPoint.x;
  const dy = wallGeometry.endPoint.y - wallGeometry.startPoint.y;
  const wallLength = Math.sqrt(dx * dx + dy * dy);

  if (wallLength === 0) return null;

  const t = offsetInCm / wallLength;
  const doorStart = {
    x: wallGeometry.startPoint.x + t * dx,
    y: wallGeometry.startPoint.y + t * dy,
  };

  const t2 = (offsetInCm + widthInCm) / wallLength;
  const doorEnd = {
    x: wallGeometry.startPoint.x + t2 * dx,
    y: wallGeometry.startPoint.y + t2 * dy,
  };

  const startAngle = Math.atan2(dy, dx);
  const endAngle = startAngle + Math.PI / 2;

  return (
    <>
      <Line
        points={[
          doorStart.x * PIXELS_PER_CM,
          doorStart.y * PIXELS_PER_CM,
          doorEnd.x * PIXELS_PER_CM,
          doorEnd.y * PIXELS_PER_CM,
        ]}
        stroke={isSelected ? SELECTION_COLOR : DOOR_COLOR}
        strokeWidth={WALL_THICKNESS}
        lineCap="butt"
        onClick={onSelect}
        onTap={onSelect}
      />
      <Arc
        x={doorEnd.x * PIXELS_PER_CM}
        y={doorEnd.y * PIXELS_PER_CM}
        innerRadius={0}
        outerRadius={widthInCm * PIXELS_PER_CM}
        angle={(endAngle - startAngle) * (180 / Math.PI)}
        rotation={startAngle * (180 / Math.PI)}
        stroke={isSelected ? SELECTION_COLOR : '#DDD'}
        strokeWidth={1}
      />
    </>
  );
}

