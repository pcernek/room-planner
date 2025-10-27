import { useMemo } from 'react';
import { Line } from 'react-konva';
import { Unit, IViewport } from '../../types';
import { toPixels } from '../../utils/canvas';

interface IGridLayerProps {
  unit: Unit;
  viewport: IViewport;
  canvasDimensions: { width: number; height: number };
}

export function GridLayer({ unit, viewport, canvasDimensions }: IGridLayerProps) {
  const gridLines = useMemo(() => {
    const gridSpacing = unit === 'ft-in' ? 12 : 25;
    const gridSpacingPx = toPixels(gridSpacing, unit);

    const visibleLeft = -viewport.offsetX / viewport.scale;
    const visibleTop = -viewport.offsetY / viewport.scale;
    const visibleRight = (canvasDimensions.width - viewport.offsetX) / viewport.scale;
    const visibleBottom = (canvasDimensions.height - viewport.offsetY) / viewport.scale;

    const startX = Math.floor(visibleLeft / gridSpacingPx) * gridSpacingPx;
    const endX = Math.ceil(visibleRight / gridSpacingPx) * gridSpacingPx;
    const startY = Math.floor(visibleTop / gridSpacingPx) * gridSpacingPx;
    const endY = Math.ceil(visibleBottom / gridSpacingPx) * gridSpacingPx;

    const verticalLines = [];
    for (let x = startX; x <= endX; x += gridSpacingPx) {
      verticalLines.push({
        key: `v-${x}`,
        points: [x, startY, x, endY],
      });
    }

    const horizontalLines = [];
    for (let y = startY; y <= endY; y += gridSpacingPx) {
      horizontalLines.push({
        key: `h-${y}`,
        points: [startX, y, endX, y],
      });
    }

    return [...verticalLines, ...horizontalLines];
  }, [unit, viewport, canvasDimensions]);

  return (
    <>
      {gridLines.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          stroke="rgba(0, 100, 255, 0.2)"
          strokeWidth={1}
          listening={false}
        />
      ))}
    </>
  );
}
