import { Circle, Text, Group } from 'react-konva';
import Konva from 'konva';

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
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'pointer';
          }
          const circle = e.target as Konva.Circle;
          circle.fill(BUTTON_HOVER_COLOR);
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
          const circle = e.target as Konva.Circle;
          circle.fill(BUTTON_COLOR);
        }}
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

