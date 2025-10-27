import { Circle, Text, Group } from 'react-konva';
import Konva from 'konva';
import { toPixels } from '../../utils/canvas';
import { Unit } from '../../types';

const BUTTON_COLOR = '#FFFFFF';
const BUTTON_HOVER_COLOR = '#F0F0F0';
const BORDER_COLOR = '#4A90E2';

interface IProps {
  x: number;
  y: number;
  unit: Unit;
  isVisible: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function EndpointExtensionButton({
  x,
  y,
  unit,
  isVisible,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: IProps) {
  const pixelX = toPixels(x, unit);
  const pixelY = toPixels(y, unit);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onClick();
  };

  const handleMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const circle = e.target as Konva.Circle;
    circle.fill(BUTTON_HOVER_COLOR);
    const stage = e.target.getStage();
    if (stage) {
      stage.container().style.cursor = 'pointer';
    }
    onMouseEnter();
  };

  const handleMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const circle = e.target as Konva.Circle;
    circle.fill(BUTTON_COLOR);
    const stage = e.target.getStage();
    if (stage) {
      stage.container().style.cursor = 'default';
    }
    onMouseLeave();
  };

  return (
    <Group x={pixelX} y={pixelY} opacity={isVisible ? 1 : 0}>
      <Circle
        radius={16}
        fill={BUTTON_COLOR}
        stroke={BORDER_COLOR}
        strokeWidth={2}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={6}
        shadowOffsetX={0}
        shadowOffsetY={2}
        onClick={handleClick}
        onTap={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      <Text
        text="+"
        fontSize={24}
        fontStyle="bold"
        fill={BORDER_COLOR}
        offsetX={7}
        offsetY={12}
        listening={false}
      />
    </Group>
  );
}
