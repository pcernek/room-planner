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
        <div style={styles.hint}>Click and drag to move this group of walls as a unit.</div>
      </div>
    </div>
  );
}
