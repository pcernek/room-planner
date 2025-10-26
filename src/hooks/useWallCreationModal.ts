import { useState, useEffect } from 'react';
import { useRoom } from '../store/RoomContext';
import { INewWall, Unit } from '../types';

interface IWallCreationModalResult {
  isModalOpen: boolean;
  pendingWallAngle: number;
  pendingFromNode: { wallId: string; endpoint: 'start' | 'end' } | null;
  handleModalConfirm: (length: number, unit: Unit) => void;
  handleModalCancel: () => void;
  handleNewWallClick: (wallId: string, endpoint: 'start' | 'end', angle: number) => void;
}

export function useWallCreationModal(): IWallCreationModalResult {
  const { state, dispatch } = useRoom();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingWallAngle, setPendingWallAngle] = useState<number>(0);
  const [pendingFromNode, setPendingFromNode] = useState<{
    wallId: string;
    endpoint: 'start' | 'end';
  } | null>(null);

  useEffect(() => {
    if (state.room && state.room.walls.length === 0 && !isModalOpen) {
      setIsModalOpen(true);
      setPendingWallAngle(0);
      setPendingFromNode(null);
    }
  }, [state.room?.walls.length, isModalOpen]);

  function handleModalConfirm(length: number, unit: Unit) {
    const newWall: INewWall = {
      length,
      unit,
      angle: pendingWallAngle,
      fromNode: pendingFromNode,
    };

    dispatch({ type: 'ADD_WALL', payload: newWall });

    setIsModalOpen(false);
    setPendingWallAngle(0);
    setPendingFromNode(null);
  }

  function handleModalCancel() {
    if (state.room && state.room.walls.length > 0) {
      setIsModalOpen(false);
      setPendingWallAngle(0);
      setPendingFromNode(null);
    }
  }

  function handleNewWallClick(wallId: string, endpoint: 'start' | 'end', angle: number) {
    setPendingWallAngle(angle);
    setPendingFromNode({ wallId, endpoint });
    setIsModalOpen(true);
  }

  return {
    isModalOpen,
    pendingWallAngle,
    pendingFromNode,
    handleModalConfirm,
    handleModalCancel,
    handleNewWallClick,
  };
}
