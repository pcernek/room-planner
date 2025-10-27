import { useState, useEffect } from 'react';
import { useRoom } from '../store/RoomContext';
import { INewWall, IPoint, Unit } from '../types';

interface IWallCreationModalResult {
  isModalOpen: boolean;
  pendingWallAngle: number;
  pendingFromNode: { wallId: string; endpoint: 'start' | 'end' } | null;
  handleModalConfirm: (length: number, unit: Unit) => void;
  handleModalCancel: () => void;
  handleNewWallClick: (wallId: string, endpoint: 'start' | 'end', angle: number) => void;
  openModalForNewWall: (startPoint: IPoint) => void;
}

export function useWallCreationModal(): IWallCreationModalResult {
  const { state, dispatch } = useRoom();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingWallAngle, setPendingWallAngle] = useState<number>(0);
  const [pendingFromNode, setPendingFromNode] = useState<{
    wallId: string;
    endpoint: 'start' | 'end';
  } | null>(null);
  const [pendingWallStartPoint, setPendingWallStartPoint] = useState<IPoint | null>(null);

  useEffect(() => {
    const totalWalls =
      state.room?.wallSequences.reduce((count, seq) => count + seq.walls.length, 0) || 0;
    if (state.room && totalWalls === 0 && !isModalOpen) {
      setIsModalOpen(true);
      setPendingWallAngle(0);
      setPendingFromNode(null);
    }
  }, [state.room?.wallSequences, isModalOpen]);

  function handleModalConfirm(length: number, unit: Unit) {
    const newWall: INewWall = {
      length,
      unit,
      angle: pendingWallAngle,
      fromNode: pendingFromNode,
    };

    if (pendingWallStartPoint) {
      dispatch({
        type: 'ADD_WALL',
        payload: { wall: newWall, startPoint: pendingWallStartPoint },
      });
    } else {
      dispatch({ type: 'ADD_WALL', payload: newWall });
    }

    setIsModalOpen(false);
    setPendingWallAngle(0);
    setPendingFromNode(null);
    setPendingWallStartPoint(null);
  }

  function handleModalCancel() {
    const totalWalls =
      state.room?.wallSequences.reduce((count, seq) => count + seq.walls.length, 0) || 0;
    if (state.room && totalWalls > 0) {
      setIsModalOpen(false);
      setPendingWallAngle(0);
      setPendingFromNode(null);
      setPendingWallStartPoint(null);
    }
  }

  function handleNewWallClick(wallId: string, endpoint: 'start' | 'end', angle: number) {
    setPendingWallAngle(angle);
    setPendingFromNode({ wallId, endpoint });
    setPendingWallStartPoint(null);
    setIsModalOpen(true);
  }

  function openModalForNewWall(startPoint: IPoint) {
    setPendingWallAngle(0);
    setPendingFromNode(null);
    setPendingWallStartPoint(startPoint);
    setIsModalOpen(true);
  }

  return {
    isModalOpen,
    pendingWallAngle,
    pendingFromNode,
    handleModalConfirm,
    handleModalCancel,
    handleNewWallClick,
    openModalForNewWall,
  };
}
