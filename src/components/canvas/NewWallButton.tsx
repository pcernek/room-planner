import { Circle, Text, Group } from 'react-konva';
import Konva from 'konva';
import { useHover } from '../../store/HoverContext';

const BUTTON_COLOR = '#4A90E2';
const BUTTON_HOVER_COLOR = '#357ABD';

interface IProps {
  x: number;
  y: number;
  angle: number;
  size: number;
  onClick: () => void;
}

export function NewWallButton({ x, y, angle, size, onClick }: IProps) {
  const { setHover, clearHover } = useHover();

  const handleMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
    setHover('newWallButton', `${x},${y},${angle}`);
    const circle = e.target as Konva.Circle;
    circle.fill(BUTTON_HOVER_COLOR);
  };

  const handleMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>) => {
    clearHover();
    const circle = e.target as Konva.Circle;
    circle.fill(BUTTON_COLOR);
  };

  return (
    <Group x={x} y={y} rotation={angle}>
      <Circle
        radius={size / 2}
        fill={BUTTON_COLOR}
        stroke="#fff"
        strokeWidth={2}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={8}
        shadowOffsetX={0}
        shadowOffsetY={2}
        onClick={onClick}
        onTap={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      <Text
        text="→"
        fontSize={20}
        fill="#fff"
        offsetX={6}
        offsetY={10}
        listening={false}
      />
    </Group>
  );
}

