interface IProps {
  centerX: number;
  centerY: number;
  angle: number;
  size: number;
  onClick: () => void;
}

export function ArrowButton({ centerX, centerY, angle, size, onClick }: IProps) {
  const halfSize = size / 2;

  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        left: centerX - halfSize,
        top: centerY - halfSize,
        width: size,
        height: size,
        backgroundColor: '#4A90E2',
        border: '2px solid #fff',
        borderRadius: '50%',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        color: '#fff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        transform: `rotate(${angle}deg)`,
        transition: 'all 0.2s',
        zIndex: 100,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#357ABD';
        e.currentTarget.style.transform = `rotate(${angle}deg) scale(1.1)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#4A90E2';
        e.currentTarget.style.transform = `rotate(${angle}deg) scale(1)`;
      }}
    >
      →
    </button>
  );
}

