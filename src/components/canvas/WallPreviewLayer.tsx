import { Fragment } from 'react';
import { Line, Circle, Text, Rect, Group } from 'react-konva';
import { IPoint, Unit, IWall } from '../../types';
import { toPixels } from '../../utils/canvas';
import { willExtendWall, radiansToDegrees } from '../../utils/geometry';

interface IFromWallInfo {
  wallId: string;
  endpoint: 'start' | 'end';
  wallAngle: number;
}

interface IWallPreviewLayerProps {
  wallStart: IPoint | null;
  wallPreview: IPoint | null;
  unit: Unit;
  fromWallInfo: IFromWallInfo | null;
  sourceWall: IWall | undefined;
}

function formatLength(length: number, unit: Unit): string {
  if (unit === 'cm') {
    return `${length.toFixed(1)} cm`;
  } else {
    return `${length.toFixed(1)}"`;
  }
}

function calculateDistance(p1: IPoint, p2: IPoint): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function WallPreviewLayer({
  wallStart,
  wallPreview,
  unit,
  fromWallInfo,
  sourceWall,
}: IWallPreviewLayerProps) {
  return (
    <Fragment>
      {wallStart && wallPreview && (
        <>
          <Line
            points={[
              toPixels(wallStart.x, unit),
              toPixels(wallStart.y, unit),
              toPixels(wallPreview.x, unit),
              toPixels(wallPreview.y, unit),
            ]}
            stroke="#4A90E2"
            strokeWidth={2}
            dash={[10, 5]}
            listening={false}
          />
          <Circle
            x={toPixels(wallPreview.x, unit)}
            y={toPixels(wallPreview.y, unit)}
            radius={8}
            stroke="#4A90E2"
            strokeWidth={2}
            fill="#FFFFFF"
            listening={false}
          />
          {(() => {
            const previewLength = calculateDistance(wallStart, wallPreview);

            if (previewLength < 0.1) return null;

            let displayLength = previewLength;

            if (fromWallInfo && sourceWall) {
              const dx = wallPreview.x - wallStart.x;
              const dy = wallPreview.y - wallStart.y;
              const angleRadians = Math.atan2(dy, dx);
              const previewAngleDegrees = radiansToDegrees(angleRadians);

              if (willExtendWall(previewAngleDegrees, sourceWall.angle, fromWallInfo.endpoint)) {
                displayLength = sourceWall.length + previewLength;
              }
            }

            const lengthText = formatLength(displayLength, unit);
            const midX = (wallStart.x + wallPreview.x) / 2;
            const midY = (wallStart.y + wallPreview.y) / 2;
            const pixelMidX = toPixels(midX, unit);
            const pixelMidY = toPixels(midY, unit);

            const padding = 8;
            const fontSize = 14;
            const textWidth = lengthText.length * fontSize * 0.6;
            const textHeight = fontSize + 4;

            return (
              <Group x={pixelMidX} y={pixelMidY - 30}>
                <Rect
                  x={-textWidth / 2 - padding}
                  y={-textHeight / 2 - padding / 2}
                  width={textWidth + padding * 2}
                  height={textHeight + padding}
                  fill="#FFFFFF"
                  stroke="#4A90E2"
                  strokeWidth={1}
                  cornerRadius={4}
                  shadowColor="rgba(0, 0, 0, 0.2)"
                  shadowBlur={4}
                  shadowOffsetY={2}
                  listening={false}
                />
                <Text
                  text={lengthText}
                  fontSize={fontSize}
                  fontFamily="Arial, sans-serif"
                  fill="#333333"
                  fontStyle="bold"
                  align="center"
                  verticalAlign="middle"
                  offsetX={textWidth / 2}
                  offsetY={textHeight / 2}
                  listening={false}
                />
              </Group>
            );
          })()}
        </>
      )}
      {wallStart && (
        <Circle
          x={toPixels(wallStart.x, unit)}
          y={toPixels(wallStart.y, unit)}
          radius={8}
          stroke="#4A90E2"
          strokeWidth={2}
          fill="#FFFFFF"
          listening={false}
        />
      )}
    </Fragment>
  );
}
