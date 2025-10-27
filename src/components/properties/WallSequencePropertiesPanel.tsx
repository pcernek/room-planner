import { IWallSequence } from '../../types';
import { propertyPanelStyles as styles } from './propertyPanelStyles';

interface IProps {
  sequence: IWallSequence;
}

export function WallSequencePropertiesPanel({ sequence: _sequence }: IProps) {
  return (
    <div style={styles.propertyPanel}>
      <h3 style={styles.panelTitle}>Wall Sequence</h3>
      <div style={styles.propertyContent}>
        <div style={styles.hint}>
          Click on a wall to select it individually, or click elsewhere to deselect the sequence.
        </div>
      </div>
    </div>
  );
}
