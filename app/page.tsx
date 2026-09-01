"use client";

import {
  Armchair,
  ChevronDown,
  DoorOpen,
  FileDown,
  FileUp,
  Focus,
  Minus,
  PanelTopOpen,
  Plus,
  Ruler,
  SquareDashed,
  Trash2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Door,
  Furniture,
  LinearUnit,
  Plan,
  Point,
  Room,
  Wall,
  WallSequence,
  WindowOpening,
  changeStandaloneAngle,
  changeWallLength,
  chooseRoomForPoint,
  formatLinearMeasurement,
  deleteWallFromPlan,
  distance,
  findWall,
  isValidPlan,
  moveSequence,
  normalizeAngle,
  planBounds,
  pointInBounds,
  roomBounds,
  sequenceRoomId,
  snapEndPoint,
  uid,
  wallAngle,
  wallLength,
  unitToCentimeters,
} from "@/lib/planner";

type Tool = "select" | "wall" | "door" | "window" | "furniture";

type Selection =
  | { kind: "wall"; wallId: string }
  | { kind: "sequences"; sequenceIds: string[] }
  | { kind: "door"; doorId: string }
  | { kind: "window"; windowId: string }
  | { kind: "furniture"; furnitureId: string }
  | { kind: "room"; roomId: string };

type ExtensionDraft = {
  sequenceId: string;
  side: "start" | "end";
  start: Point;
  sourceAngle: number;
};

type DragState =
  | { type: "pan"; pointerId: number; startScreen: Point; initialPan: Point; moved: boolean }
  | { type: "sequence"; pointerId: number; startWorld: Point; sequenceId: string; initialPlan: Plan; moved: boolean }
  | { type: "room"; pointerId: number; startWorld: Point; roomId: string; initialPlan: Plan; moved: boolean }
  | { type: "furniture"; pointerId: number; startWorld: Point; furnitureId: string; initialPlan: Plan; moved: boolean }
  | { type: "door" | "window"; pointerId: number; startWorld: Point; entityId: string; wall: Wall; initialOffset: number; width: number; moved: boolean };

const PLAN_KEY = "room-planner-plan-v1";
const VIEW_KEY = "room-planner-viewport-v1";
const UNIT_KEY = "room-planner-unit-v1";
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ROOM_LABEL_OFFSET_PX = 24;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const pointsClose = (a: Point, b: Point, epsilon = 0.05) =>
  distance(a, b) <= epsilon;

function DebouncedField({
  label,
  value,
  onCommit,
  validate = () => true,
  type = "number",
  suffix,
  disabled = false,
  autoFocus = false,
}: {
  label: string;
  value: string | number;
  onCommit: (value: string | number) => void;
  validate?: (value: string | number) => boolean;
  type?: "text" | "number";
  suffix?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const [draft, setDraft] = useState(String(value));
  const commitRef = useRef(onCommit);
  const validateRef = useRef(validate);

  useEffect(() => {
    commitRef.current = onCommit;
    validateRef.current = validate;
  }, [onCommit, validate]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDraft(String(value)), 0);
    return () => window.clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    if (disabled) return;
    const timer = window.setTimeout(() => {
      const candidate = type === "number" ? Number(draft) : draft;
      if (draft !== "" && validateRef.current(candidate)) {
        commitRef.current(candidate);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [draft, disabled, type]);

  return (
    <div className="field-group">
      <Label>{label}</Label>
      <div className="field-with-suffix">
        <Input
          autoFocus={autoFocus}
          disabled={disabled}
          inputMode={type === "number" ? "decimal" : undefined}
          onBlur={() => {
            const candidate = type === "number" ? Number(draft) : draft;
            if (draft === "" || !validateRef.current(candidate)) setDraft(String(value));
          }}
          onChange={(event) => setDraft(event.target.value)}
          step={type === "number" ? "0.1" : undefined}
          type={type}
          value={draft}
        />
        {suffix && <span>{suffix}</span>}
      </div>
    </div>
  );
}

function PointMarker({ point }: { point: Point }) {
  return <circle className="placement-marker" cx={point.x} cy={point.y} r={7} vectorEffect="non-scaling-stroke" />;
}

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [placementStart, setPlacementStart] = useState<Point | null>(null);
  const [extension, setExtension] = useState<ExtensionDraft | null>(null);
  const [hoverWorld, setHoverWorld] = useState<Point>({ x: 0, y: 0 });
  const [hoveredWallId, setHoveredWallId] = useState<string | null>(null);
  const [candidateRoomId, setCandidateRoomId] = useState<string | null>(null);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [planName, setPlanName] = useState("");
  const [firstWallLength, setFirstWallLength] = useState("400");
  const [unit, setUnit] = useState<LinearUnit>("cm");
  const [roomTargetId, setRoomTargetId] = useState("");

  const canvasRef = useRef<SVGSVGElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    let restoredPlan: Plan | null = null;
    let restoredPan: Point | null = null;
    let restoredZoom: number | null = null;
    let restoredUnit: LinearUnit = "cm";
    try {
      const savedPlan = window.localStorage.getItem(PLAN_KEY);
      if (savedPlan) {
        const parsed = JSON.parse(savedPlan);
        if (isValidPlan(parsed)) restoredPlan = parsed;
      }
      const savedView = window.localStorage.getItem(VIEW_KEY);
      if (savedView) {
        const parsed = JSON.parse(savedView);
        if (parsed && Number.isFinite(parsed.pan?.x) && Number.isFinite(parsed.pan?.y) && Number.isFinite(parsed.zoom)) {
          restoredPan = parsed.pan;
          restoredZoom = clamp(parsed.zoom, MIN_ZOOM, MAX_ZOOM);
        }
      }
      const savedUnit = window.localStorage.getItem(UNIT_KEY);
      if (savedUnit === "cm" || savedUnit === "in") restoredUnit = savedUnit;
    } catch {
      // A corrupt local cache should not prevent a fresh start.
    }
    queueMicrotask(() => {
      if (restoredPlan) setPlan(restoredPlan);
      if (restoredPan) setPan(restoredPan);
      if (restoredZoom !== null) setZoom(restoredZoom);
      setUnit(restoredUnit);
      setFirstWallLength(formatLinearMeasurement(400, restoredUnit));
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (plan) window.localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
    else window.localStorage.removeItem(PLAN_KEY);
  }, [hydrated, plan]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(VIEW_KEY, JSON.stringify({ pan, zoom }));
  }, [hydrated, pan, zoom]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(UNIT_KEY, unit);
  }, [hydrated, unit]);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setCanvasSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const resetTransient = useCallback(() => {
    setTool("select");
    setSelection(null);
    setPlacementStart(null);
    setExtension(null);
    setCandidateRoomId(null);
    dragRef.current = null;
  }, []);

  const setActiveTool = (next: Tool) => {
    const resolved = tool === next ? "select" : next;
    setTool(resolved);
    setPlacementStart(null);
    setExtension(null);
    setCandidateRoomId(null);
    if (resolved !== "select") setSelection(null);
  };

  const switchUnit = (nextUnit: LinearUnit) => {
    if (nextUnit === unit) return;
    setFirstWallLength((current) => {
      if (!current.trim()) return current;
      const numeric = Number(current);
      if (!Number.isFinite(numeric)) return current;
      const centimeters = unitToCentimeters(numeric, unit);
      return formatLinearMeasurement(centimeters, nextUnit);
    });
    setUnit(nextUnit);
  };

  const unitLabel = unit;
  const displayLinear = (centimeters: number) =>
    formatLinearMeasurement(centimeters, unit);
  const toCentimeters = (value: string | number) =>
    unitToCentimeters(Number(value), unit);
  const gridSpacing = unit === "cm" ? 25 : 25.4;

  const clientToWorld = useCallback((clientX: number, clientY: number): Point => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return {
      x: ((clientX - (rect?.left ?? 0)) - pan.x) / zoom,
      y: ((clientY - (rect?.top ?? 0)) - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const startPointerCapture = (pointerId: number) => canvasRef.current?.setPointerCapture(pointerId);

  const recenter = useCallback(() => {
    if (!canvasSize.width || !canvasSize.height) return;
    const bounds = plan ? planBounds(plan) : null;
    if (!bounds) {
      setZoom(1);
      setPan({ x: canvasSize.width / 2, y: canvasSize.height / 2 });
      return;
    }
    const padding = 90;
    const width = Math.max(1, bounds.maxX - bounds.minX);
    const height = Math.max(1, bounds.maxY - bounds.minY);
    const nextZoom = clamp(Math.min((canvasSize.width - padding * 2) / width, (canvasSize.height - padding * 2) / height, 1), MIN_ZOOM, 1);
    setZoom(nextZoom);
    setPan({
      x: canvasSize.width / 2 - ((bounds.minX + bounds.maxX) / 2) * nextZoom,
      y: canvasSize.height / 2 - ((bounds.minY + bounds.maxY) / 2) * nextZoom,
    });
  }, [canvasSize, plan]);

  useEffect(() => {
    if (hydrated && !plan && canvasSize.width) {
      const frame = window.requestAnimationFrame(() => {
        setZoom(1);
        setPan({ x: canvasSize.width / 2, y: canvasSize.height / 2 });
      });
      return () => window.cancelAnimationFrame(frame);
    }
  }, [hydrated, plan, canvasSize.width, canvasSize.height]);

  const updateZoom = (nextZoom: number, anchor?: Point) => {
    const clamped = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    if (clamped === zoom) return;
    const screenAnchor = anchor ?? { x: canvasSize.width / 2, y: canvasSize.height / 2 };
    const worldAnchor = { x: (screenAnchor.x - pan.x) / zoom, y: (screenAnchor.y - pan.y) / zoom };
    setPan({ x: screenAnchor.x - worldAnchor.x * clamped, y: screenAnchor.y - worldAnchor.y * clamped });
    setZoom(clamped);
  };

  const addDoorToWall = (wall: Wall) => {
    if (!plan) return;
    const door: Door = { id: uid("door"), wallId: wall.id, offset: 0, width: Math.min(wallLength(wall), 75), hingeAtStart: true, swingSide: 1 };
    setPlan({ ...plan, doors: [...plan.doors, door] });
    setSelection({ kind: "door", doorId: door.id });
    setTool("select");
  };

  const addWindowToWall = (wall: Wall) => {
    if (!plan) return;
    const opening: WindowOpening = { id: uid("window"), wallId: wall.id, offset: 0, width: Math.min(wallLength(wall), 100) };
    setPlan({ ...plan, windows: [...plan.windows, opening] });
    setSelection({ kind: "window", windowId: opening.id });
    setTool("select");
  };

  const handleWallPointerDown = (event: React.PointerEvent<SVGLineElement>, wall: Wall, sequence: WallSequence) => {
    event.stopPropagation();
    if (!plan) return;
    if (tool === "door") return addDoorToWall(wall);
    if (tool === "window") return addWindowToWall(wall);
    if (tool !== "select") return;
    if (event.metaKey || event.ctrlKey) {
      const current = selection?.kind === "sequences" ? selection.sequenceIds : [];
      const next = current.includes(sequence.id) ? current.filter((id) => id !== sequence.id) : [...current, sequence.id];
      setSelection(next.length ? { kind: "sequences", sequenceIds: next } : null);
      return;
    }
    const shouldGroup =
      (selection?.kind === "wall" && selection.wallId === wall.id) ||
      (selection?.kind === "sequences" && selection.sequenceIds.length === 1 && selection.sequenceIds[0] === sequence.id);
    if (shouldGroup) {
      setSelection({ kind: "sequences", sequenceIds: [sequence.id] });
      dragRef.current = { type: "sequence", pointerId: event.pointerId, startWorld: clientToWorld(event.clientX, event.clientY), sequenceId: sequence.id, initialPlan: plan, moved: false };
      startPointerCapture(event.pointerId);
    } else {
      setSelection({ kind: "wall", wallId: wall.id });
    }
  };

  const cancelPlacementForEntity = () => {
    if (tool === "door" || tool === "window") {
      setTool("select");
      setPlacementStart(null);
      setExtension(null);
    }
  };

  const handleFurniturePointerDown = (event: React.PointerEvent<SVGGElement>, item: Furniture) => {
    event.stopPropagation();
    if (!plan) return;
    const canSelect = tool === "select" || tool === "door" || tool === "window";
    cancelPlacementForEntity();
    if (!canSelect) return;
    setSelection({ kind: "furniture", furnitureId: item.id });
    setTool("select");
    dragRef.current = { type: "furniture", pointerId: event.pointerId, startWorld: clientToWorld(event.clientX, event.clientY), furnitureId: item.id, initialPlan: plan, moved: false };
    startPointerCapture(event.pointerId);
  };

  const handleDoorPointerDown = (event: React.PointerEvent<SVGGElement>, door: Door, wall: Wall) => {
    event.stopPropagation();
    if (!plan) return;
    cancelPlacementForEntity();
    setSelection({ kind: "door", doorId: door.id });
    setTool("select");
    dragRef.current = { type: "door", pointerId: event.pointerId, startWorld: clientToWorld(event.clientX, event.clientY), entityId: door.id, wall, initialOffset: door.offset, width: door.width, moved: false };
    startPointerCapture(event.pointerId);
  };

  const handleWindowPointerDown = (event: React.PointerEvent<SVGGElement>, opening: WindowOpening, wall: Wall) => {
    event.stopPropagation();
    if (!plan) return;
    cancelPlacementForEntity();
    setSelection({ kind: "window", windowId: opening.id });
    setTool("select");
    dragRef.current = { type: "window", pointerId: event.pointerId, startWorld: clientToWorld(event.clientX, event.clientY), entityId: opening.id, wall, initialOffset: opening.offset, width: opening.width, moved: false };
    startPointerCapture(event.pointerId);
  };

  const handleRoomPointerDown = (event: React.PointerEvent<SVGGElement>, room: Room) => {
    event.stopPropagation();
    if (!plan || tool !== "select") return;
    setSelection({ kind: "room", roomId: room.id });
    dragRef.current = { type: "room", pointerId: event.pointerId, startWorld: clientToWorld(event.clientX, event.clientY), roomId: room.id, initialPlan: plan, moved: false };
    startPointerCapture(event.pointerId);
  };

  const completeWallPlacement = (endPoint: Point) => {
    if (!plan || !placementStart) return;
    const snappedEnd = snapEndPoint(placementStart, endPoint);
    let acceptedEnd = snappedEnd;
    if (extension) {
      const candidateAngle = wallAngle({ id: "preview", start: placementStart, end: snappedEnd });
      const delta = Math.abs(normalizeAngle(candidateAngle - extension.sourceAngle));
      if (delta < 0.01 || Math.abs(delta - 180) < 0.01) acceptedEnd = placementStart;
    }
    if (distance(placementStart, acceptedEnd) < 1) {
      setPlacementStart(null); setExtension(null); setTool("select");
      return;
    }
    const wall: Wall = { id: uid("wall"), start: placementStart, end: acceptedEnd };
    const sequences = extension
      ? plan.sequences.map((sequence) => {
          if (sequence.id !== extension.sequenceId) return sequence;
          return { ...sequence, walls: extension.side === "end" ? [...sequence.walls, wall] : [{ ...wall, start: acceptedEnd, end: placementStart }, ...sequence.walls] };
        })
      : [...plan.sequences, { id: uid("seq"), walls: [wall] }];
    setPlan({ ...plan, sequences });
    setSelection({ kind: "wall", wallId: wall.id });
    setPlacementStart(null); setExtension(null); setTool("select");
  };

  const completeFurniturePlacement = (endPoint: Point) => {
    if (!plan || !placementStart) return;
    const width = Math.abs(endPoint.x - placementStart.x);
    const height = Math.abs(endPoint.y - placementStart.y);
    if (!width || !height) {
      setPlacementStart(null); setTool("select");
      return;
    }
    const center = { x: (placementStart.x + endPoint.x) / 2, y: (placementStart.y + endPoint.y) / 2 };
    const item: Furniture = { id: uid("furniture"), name: "New Furniture", center, width, height, rotation: 0, roomId: chooseRoomForPoint(plan, center, null) };
    setPlan({ ...plan, furniture: [...plan.furniture, item] });
    setSelection({ kind: "furniture", furnitureId: item.id });
    setPlacementStart(null); setTool("select");
  };

  const handleCanvasPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.target !== event.currentTarget) return;
    const world = clientToWorld(event.clientX, event.clientY);
    if (tool === "wall") {
      if (!placementStart) setPlacementStart(world); else completeWallPlacement(world);
      return;
    }
    if (tool === "furniture") {
      if (!placementStart) setPlacementStart(world); else completeFurniturePlacement(world);
      return;
    }
    if (tool === "door" || tool === "window") {
      setTool("select"); setSelection(null);
      return;
    }
    dragRef.current = { type: "pan", pointerId: event.pointerId, startScreen: { x: event.clientX, y: event.clientY }, initialPan: pan, moved: false };
    startPointerCapture(event.pointerId);
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const world = clientToWorld(event.clientX, event.clientY);
    setHoverWorld(world);
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.type === "pan") {
      const delta = { x: event.clientX - drag.startScreen.x, y: event.clientY - drag.startScreen.y };
      if (Math.hypot(delta.x, delta.y) > 2) drag.moved = true;
      setPan({ x: drag.initialPan.x + delta.x, y: drag.initialPan.y + delta.y });
      return;
    }
    const delta = { x: world.x - drag.startWorld.x, y: world.y - drag.startWorld.y };
    if (Math.hypot(delta.x * zoom, delta.y * zoom) > 2) drag.moved = true;
    if (drag.type === "sequence") {
      setPlan({
        ...drag.initialPlan,
        sequences: drag.initialPlan.sequences.map((sequence) =>
          sequence.id === drag.sequenceId ? moveSequence(sequence, delta) : sequence,
        ),
      });
      return;
    }
    if (drag.type === "room") {
      const room = drag.initialPlan.rooms.find((candidate) => candidate.id === drag.roomId);
      if (!room) return;
      setPlan({
        ...drag.initialPlan,
        sequences: drag.initialPlan.sequences.map((sequence) =>
          room.sequenceIds.includes(sequence.id) ? moveSequence(sequence, delta) : sequence,
        ),
        furniture: drag.initialPlan.furniture.map((item) =>
          item.roomId === room.id
            ? { ...item, center: { x: item.center.x + delta.x, y: item.center.y + delta.y } }
            : item,
        ),
      });
      return;
    }
    if (drag.type === "furniture") {
      const initialItem = drag.initialPlan.furniture.find((item) => item.id === drag.furnitureId);
      if (!initialItem) return;
      const center = { x: initialItem.center.x + delta.x, y: initialItem.center.y + delta.y };
      const nextPlan = {
        ...drag.initialPlan,
        furniture: drag.initialPlan.furniture.map((item) =>
          item.id === initialItem.id ? { ...item, center } : item,
        ),
      };
      setCandidateRoomId(chooseRoomForPoint(nextPlan, center, initialItem.roomId));
      setPlan(nextPlan);
      return;
    }
    const length = wallLength(drag.wall);
    const unit = { x: (drag.wall.end.x - drag.wall.start.x) / length, y: (drag.wall.end.y - drag.wall.start.y) / length };
    const projected = delta.x * unit.x + delta.y * unit.y;
    const offset = clamp(drag.initialOffset + projected, 0, Math.max(0, length - drag.width));
    setPlan((current) => {
      if (!current) return current;
      return drag.type === "door"
        ? { ...current, doors: current.doors.map((door) => door.id === drag.entityId ? { ...door, offset } : door) }
        : { ...current, windows: current.windows.map((opening) => opening.id === drag.entityId ? { ...opening, offset } : opening) };
    });
  };

  const handleCanvasPointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.type === "pan" && !drag.moved) setSelection(null);
    if (drag.type === "furniture") {
      setPlan((current) => current ? {
        ...current,
        furniture: current.furniture.map((item) => item.id === drag.furnitureId
          ? { ...item, roomId: chooseRoomForPoint(current, item.center, item.roomId) }
          : item),
      } : current);
      setCandidateRoomId(null);
    }
    dragRef.current = null;
    if (canvasRef.current?.hasPointerCapture(event.pointerId)) canvasRef.current.releasePointerCapture(event.pointerId);
  };

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    updateZoom(zoom * Math.exp(-event.deltaY * 0.0015), {
      x: event.clientX - (rect?.left ?? 0),
      y: event.clientY - (rect?.top ?? 0),
    });
  };

  const startExtension = (event: React.PointerEvent<SVGGElement>, sequence: WallSequence, side: "start" | "end") => {
    event.stopPropagation();
    const wall = side === "start" ? sequence.walls[0] : sequence.walls.at(-1)!;
    const point = side === "start" ? wall.start : wall.end;
    if (extension?.sequenceId === sequence.id && extension.side === side && pointsClose(extension.start, point)) {
      setTool("select"); setPlacementStart(null); setExtension(null);
      return;
    }
    setSelection({ kind: "wall", wallId: wall.id });
    setTool("wall");
    setPlacementStart(point);
    setExtension({ sequenceId: sequence.id, side, start: point, sourceAngle: wallAngle(wall) });
  };

  const allEndpoints = useMemo(() => plan?.sequences.flatMap((sequence) =>
    sequence.walls.flatMap((wall) => [
      { wallId: wall.id, point: wall.start },
      { wallId: wall.id, point: wall.end },
    ]),
  ) ?? [], [plan]);

  const endpointAvailable = (wallId: string, point: Point) =>
    !allEndpoints.some((endpoint) => endpoint.wallId !== wallId && pointsClose(endpoint.point, point));

  const selectedSequenceIds = selection?.kind === "sequences" ? selection.sequenceIds : [];
  const selectedRoom = selection?.kind === "room"
    ? plan?.rooms.find((room) => room.id === selection.roomId) ?? null
    : null;
  const previewEnd = placementStart
    ? tool === "wall" ? snapEndPoint(placementStart, hoverWorld) : hoverWorld
    : null;

  const createRoomFromSelection = () => {
    if (!plan || !selectedSequenceIds.length || selectedSequenceIds.some((id) => sequenceRoomId(plan, id))) return;
    const entered = window.prompt("Room name", "Living Room");
    if (entered === null) return;
    const name = entered.trim();
    if (!name) {
      window.alert("Please enter a room name");
      return;
    }
    const room: Room = { id: uid("room"), name, sequenceIds: selectedSequenceIds, createdAt: Date.now() };
    const withRoom = { ...plan, rooms: [...plan.rooms, room] };
    setPlan({
      ...withRoom,
      furniture: withRoom.furniture.map((item) => {
        const bounds = roomBounds(withRoom, room);
        return item.roomId === null && bounds && pointInBounds(item.center, bounds)
          ? { ...item, roomId: room.id }
          : item;
      }),
    });
    setSelection({ kind: "room", roomId: room.id });
  };

  const addSelectionToRoom = () => {
    if (!plan || !roomTargetId || !selectedSequenceIds.length || selectedSequenceIds.some((id) => sequenceRoomId(plan, id))) return;
    setPlan({
      ...plan,
      rooms: plan.rooms.map((room) => room.id === roomTargetId
        ? { ...room, sequenceIds: [...room.sequenceIds, ...selectedSequenceIds] }
        : room),
    });
    setSelection({ kind: "room", roomId: roomTargetId });
    setRoomTargetId("");
  };

  const removeSelectionFromRoom = () => {
    if (!plan || !selectedSequenceIds.length) return;
    const membership = selectedSequenceIds.map((id) => sequenceRoomId(plan, id));
    const roomId = membership[0];
    if (!roomId || membership.some((id) => id !== roomId)) return;
    const room = plan.rooms.find((candidate) => candidate.id === roomId);
    if (!room || room.sequenceIds.length <= selectedSequenceIds.length) return;
    setPlan({
      ...plan,
      rooms: plan.rooms.map((candidate) => candidate.id === roomId
        ? { ...candidate, sequenceIds: candidate.sequenceIds.filter((id) => !selectedSequenceIds.includes(id)) }
        : candidate),
    });
  };

  const exportPlan = () => {
    if (!plan) return;
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `room-plan-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(href);
  };

  const importPlan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      window.alert("Failed to import room plan: Invalid JSON");
      return;
    }
    if (!isValidPlan(parsed)) {
      window.alert("Invalid room plan file");
      return;
    }
    resetTransient();
    setPlan(parsed);
    window.alert("Room plan imported successfully");
  };

  const startFromScratch = () => {
    if (!window.confirm("Are you sure you want to delete the current project? This action cannot be undone.")) return;
    resetTransient();
    setPlan(null);
    setPlanName("");
    setFirstWallLength("400");
  };

  const createPlan = (event: React.FormEvent) => {
    event.preventDefault();
    const name = planName.trim();
    if (!name) {
      window.alert("Please enter a plan name");
      return;
    }
    setPlan({ version: 1, id: uid("plan"), name, createdAt: Date.now(), sequences: [], doors: [], windows: [], furniture: [], rooms: [] });
    setSelection(null);
    setTool("select");
    setZoom(1);
    setPan({ x: canvasSize.width / 2, y: canvasSize.height / 2 });
  };

  const createFirstWall = (event: React.FormEvent) => {
    event.preventDefault();
    if (!plan) return;
    const enteredLength = Number(firstWallLength);
    const length = toCentimeters(enteredLength);
    if (!Number.isFinite(enteredLength) || enteredLength <= 0) {
      window.alert("Please enter a valid length");
      return;
    }
    const wall: Wall = { id: uid("wall"), start: { x: 0, y: 0 }, end: { x: length, y: 0 } };
    setPlan({ ...plan, sequences: [{ id: uid("seq"), walls: [wall] }] });
    setSelection({ kind: "wall", wallId: wall.id });
    setTool("select");
  };

  const roomMemberships = selectedSequenceIds.map((id) => plan ? sequenceRoomId(plan, id) : null);
  const selectedAllUnassigned = selectedSequenceIds.length > 0 && roomMemberships.every((id) => id === null);
  const selectedSameRoomId = selectedSequenceIds.length > 0 && roomMemberships[0] && roomMemberships.every((id) => id === roomMemberships[0])
    ? roomMemberships[0]
    : null;

  const renderPropertyCard = () => {
    if (!plan || !selection) return null;

    if (selection.kind === "wall") {
      const found = findWall(plan, selection.wallId);
      if (!found) return null;
      const length = wallLength(found.wall);
      const angle = wallAngle(found.wall);
      return (
        <PropertyCard eyebrow="Geometry" title="Wall">
          <p className="property-hint">Click on this wall again to select all walls connected to it.</p>
          <DebouncedField
            label={`Length (${unitLabel})`}
            onCommit={(value) => {
              const nextLength = toCentimeters(value);
              setPlan((current) => {
                if (!current) return current;
                const sequences = current.sequences.map((sequence) =>
                  sequence.id === found.sequence.id ? changeWallLength(sequence, found.wall.id, nextLength) : sequence,
                );
                return {
                  ...current,
                  sequences,
                  doors: current.doors.map((door) => {
                    if (door.wallId !== found.wall.id) return door;
                    const width = Math.min(door.width, nextLength);
                    return { ...door, width, offset: Math.min(door.offset, Math.max(0, nextLength - width)) };
                  }),
                  windows: current.windows.map((opening) => {
                    if (opening.wallId !== found.wall.id) return opening;
                    const width = Math.min(opening.width, nextLength);
                    return { ...opening, width, offset: Math.min(opening.offset, Math.max(0, nextLength - width)) };
                  }),
                };
              });
            }}
            suffix={unitLabel}
            validate={(value) => Number(value) > 0}
            value={displayLinear(length)}
          />
          <DebouncedField
            disabled={found.sequence.walls.length > 1}
            label="Angle (°)"
            onCommit={(value) => setPlan((current) => current ? {
              ...current,
              sequences: current.sequences.map((sequence) =>
                sequence.id === found.sequence.id
                  ? changeStandaloneAngle(sequence, found.wall.id, Number(value))
                  : sequence),
            } : current)}
            suffix="°"
            validate={(value) => Number.isFinite(Number(value))}
            value={normalizeAngle(angle).toFixed(1)}
          />
          {found.sequence.walls.length > 1 && <p className="microcopy">Angles are fixed within connected sequences.</p>}
          <Button
            className="danger-action"
            onClick={() => {
              setPlan(deleteWallFromPlan(plan, found.wall.id));
              setSelection(null);
            }}
            variant="destructive"
          >
            <Trash2 /> Delete Wall
          </Button>
        </PropertyCard>
      );
    }

    if (selection.kind === "sequences") {
      const membershipLabels = selection.sequenceIds.map((id) => {
        const roomId = sequenceRoomId(plan, id);
        return roomId ? plan.rooms.find((room) => room.id === roomId)?.name ?? "Assigned" : "Unassigned";
      });
      const sameRoom = selectedSameRoomId ? plan.rooms.find((room) => room.id === selectedSameRoomId) : null;
      const canRemove = Boolean(sameRoom && sameRoom.sequenceIds.length > selection.sequenceIds.length);
      return (
        <PropertyCard eyebrow="Grouping" title="Wall Sequence">
          <p className="property-hint">
            {selection.sequenceIds.length === 1
              ? "Click and drag to move this group of walls as a unit."
              : `${selection.sequenceIds.length} wall sequences selected.`}
          </p>
          <div className="membership-list">
            {membershipLabels.map((label, index) => (
              <div key={`${selection.sequenceIds[index]}-${label}`}>
                <span>Sequence {index + 1}</span>
                <strong className={label === "Unassigned" ? "unassigned" : ""}>{label}</strong>
              </div>
            ))}
          </div>
          {selectedAllUnassigned && (
            <>
              <Button onClick={createRoomFromSelection}><SquareDashed /> Create Room from Selection</Button>
              {plan.rooms.length > 0 && (
                <div className="room-add-row">
                  <Select onValueChange={setRoomTargetId} value={roomTargetId}>
                    <SelectTrigger aria-label="Choose a room" className="room-select"><SelectValue placeholder="Choose a room" /></SelectTrigger>
                    <SelectContent>
                      {plan.rooms.map((room) => <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button disabled={!roomTargetId} onClick={addSelectionToRoom} variant="outline">Add to Room</Button>
                </div>
              )}
            </>
          )}
          {selectedSameRoomId && <Button disabled={!canRemove} onClick={removeSelectionFromRoom} variant="outline">Remove from Room</Button>}
          {!selectedAllUnassigned && !selectedSameRoomId && (
            <p className="microcopy">Sequences assigned to different rooms cannot be regrouped until removed.</p>
          )}
        </PropertyCard>
      );
    }

    if (selection.kind === "door") {
      const door = plan.doors.find((candidate) => candidate.id === selection.doorId);
      if (!door) return null;
      const found = findWall(plan, door.wallId);
      if (!found) return null;
      const length = wallLength(found.wall);
      return (
        <PropertyCard eyebrow="Opening" title="Door">
          <DebouncedField
            label={`Offset (${unitLabel})`}
            onCommit={(value) => setPlan({ ...plan, doors: plan.doors.map((candidate) =>
              candidate.id === door.id ? { ...candidate, offset: toCentimeters(value) } : candidate) })}
            suffix={unitLabel}
            validate={(value) => Number(value) >= 0 && toCentimeters(value) + door.width <= length}
            value={displayLinear(door.offset)}
          />
          <DebouncedField
            label={`Width (${unitLabel})`}
            onCommit={(value) => setPlan({ ...plan, doors: plan.doors.map((candidate) =>
              candidate.id === door.id ? { ...candidate, width: toCentimeters(value) } : candidate) })}
            suffix={unitLabel}
            validate={(value) => Number(value) > 0 && door.offset + toCentimeters(value) <= length}
            value={displayLinear(door.width)}
          />
          <div className="split-actions">
            <Button onClick={() => setPlan({ ...plan, doors: plan.doors.map((candidate) =>
              candidate.id === door.id ? { ...candidate, hingeAtStart: !candidate.hingeAtStart } : candidate) })} variant="outline">
              Swap Hinge
            </Button>
            <Button onClick={() => setPlan({ ...plan, doors: plan.doors.map((candidate) =>
              candidate.id === door.id ? { ...candidate, swingSide: candidate.swingSide === 1 ? -1 : 1 } : candidate) })} variant="outline">
              Reverse Swing
            </Button>
          </div>
          <Button
            className="danger-action"
            onClick={() => {
              setPlan({ ...plan, doors: plan.doors.filter((candidate) => candidate.id !== door.id) });
              setSelection(null);
            }}
            variant="destructive"
          ><Trash2 /> Delete Door</Button>
        </PropertyCard>
      );
    }

    if (selection.kind === "window") {
      const opening = plan.windows.find((candidate) => candidate.id === selection.windowId);
      if (!opening) return null;
      const found = findWall(plan, opening.wallId);
      if (!found) return null;
      const length = wallLength(found.wall);
      return (
        <PropertyCard eyebrow="Opening" title="Window">
          <DebouncedField
            label={`Offset (${unitLabel})`}
            onCommit={(value) => setPlan({ ...plan, windows: plan.windows.map((candidate) =>
              candidate.id === opening.id ? { ...candidate, offset: toCentimeters(value) } : candidate) })}
            suffix={unitLabel}
            validate={(value) => Number(value) >= 0 && toCentimeters(value) + opening.width <= length}
            value={displayLinear(opening.offset)}
          />
          <DebouncedField
            label={`Width (${unitLabel})`}
            onCommit={(value) => setPlan({ ...plan, windows: plan.windows.map((candidate) =>
              candidate.id === opening.id ? { ...candidate, width: toCentimeters(value) } : candidate) })}
            suffix={unitLabel}
            validate={(value) => Number(value) > 0 && opening.offset + toCentimeters(value) <= length}
            value={displayLinear(opening.width)}
          />
          <Button
            className="danger-action"
            onClick={() => {
              setPlan({ ...plan, windows: plan.windows.filter((candidate) => candidate.id !== opening.id) });
              setSelection(null);
            }}
            variant="destructive"
          ><Trash2 /> Delete Window</Button>
        </PropertyCard>
      );
    }

    if (selection.kind === "furniture") {
      const item = plan.furniture.find((candidate) => candidate.id === selection.furnitureId);
      if (!item) return null;
      const updateFurniture = (updates: Partial<Furniture>) => setPlan({
        ...plan,
        furniture: plan.furniture.map((candidate) => candidate.id === item.id ? { ...candidate, ...updates } : candidate),
      });
      return (
        <PropertyCard eyebrow="Object" title="Furniture">
          <DebouncedField autoFocus={item.name === "New Furniture"} label="Name" onCommit={(value) => updateFurniture({ name: String(value) })} type="text" value={item.name} />
          <div className="split-fields">
            <DebouncedField label={`Width (${unitLabel})`} onCommit={(value) => updateFurniture({ width: toCentimeters(value) })} suffix={unitLabel} validate={(value) => Number(value) > 0} value={displayLinear(item.width)} />
            <DebouncedField label={`Height (${unitLabel})`} onCommit={(value) => updateFurniture({ height: toCentimeters(value) })} suffix={unitLabel} validate={(value) => Number(value) > 0} value={displayLinear(item.height)} />
          </div>
          <DebouncedField label="Rotation (°)" onCommit={(value) => updateFurniture({ rotation: normalizeAngle(Number(value)) })} suffix="°" validate={(value) => Number.isFinite(Number(value))} value={normalizeAngle(item.rotation).toFixed(1)} />
          <div className="field-group">
            <Label>Room</Label>
            <Select onValueChange={(value) => updateFurniture({ roomId: value === "unassigned" ? null : value })} value={item.roomId ?? "unassigned"}>
              <SelectTrigger className="full-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {plan.rooms.map((room) => <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="danger-action"
            onClick={() => {
              setPlan({ ...plan, furniture: plan.furniture.filter((candidate) => candidate.id !== item.id) });
              setSelection(null);
            }}
            variant="destructive"
          ><Trash2 /> Delete Furniture</Button>
        </PropertyCard>
      );
    }

    if (selection.kind === "room" && selectedRoom) {
      const bounds = roomBounds(plan, selectedRoom);
      if (!bounds) return null;
      return (
        <PropertyCard eyebrow="Group" title="Room">
          <DebouncedField
            label="Name"
            onCommit={(value) => {
              const name = String(value).trim();
              if (!name) return;
              setPlan({ ...plan, rooms: plan.rooms.map((room) => room.id === selectedRoom.id ? { ...room, name } : room) });
            }}
            type="text"
            validate={(value) => Boolean(String(value).trim())}
            value={selectedRoom.name}
          />
          <div className="measurement-readout">
            <div><span>Width</span><strong>{displayLinear(bounds.maxX - bounds.minX)} {unitLabel}</strong></div>
            <div><span>Height</span><strong>{displayLinear(bounds.maxY - bounds.minY)} {unitLabel}</strong></div>
          </div>
          <Button
            className="danger-action"
            onClick={() => {
              setPlan({
                ...plan,
                rooms: plan.rooms.filter((room) => room.id !== selectedRoom.id),
                furniture: plan.furniture.map((item) => item.roomId === selectedRoom.id ? { ...item, roomId: null } : item),
              });
              setSelection(null);
            }}
            variant="destructive"
          ><Trash2 /> Dissolve Room</Button>
        </PropertyCard>
      );
    }
    return null;
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="toolbar-section toolbar-left">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="file-trigger" variant="ghost">File <ChevronDown /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="file-menu">
              <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}><FileUp /> Import JSON</DropdownMenuItem>
              <DropdownMenuItem disabled={!plan} onSelect={exportPlan}><FileDown /> Export JSON</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={!plan} onSelect={startFromScratch} variant="destructive"><Trash2 /> Start from Scratch</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input accept="application/json,.json" className="hidden-file-input" onChange={importPlan} ref={fileInputRef} type="file" />
        </div>
        <div className="plan-title" title={plan?.name}>{plan?.name ?? "Untitled plan"}</div>
        <div className="toolbar-section toolbar-right">
          <UnitToggle onChange={switchUnit} unit={unit} />
          <div className="zoom-cluster" aria-label="Zoom controls">
            <Button aria-label="Zoom out" disabled={zoom <= MIN_ZOOM} onClick={() => updateZoom(zoom / 1.2)} size="icon-sm" variant="ghost"><Minus /></Button>
            <span>{Math.round(zoom * 100)}%</span>
            <Button aria-label="Zoom in" disabled={zoom >= MAX_ZOOM} onClick={() => updateZoom(zoom * 1.2)} size="icon-sm" variant="ghost"><Plus /></Button>
          </div>
          <Button onClick={recenter} variant="outline"><Focus /> Recenter View</Button>
        </div>
      </header>

      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark"><Ruler /></div>
          <div><p>Room Planner</p><span>{unit === "cm" ? "Centimeter workspace" : "Inch workspace"}</span></div>
        </div>
        {!plan ? (
          <div className="sidebar-empty"><SquareDashed /><p>Create a plan to start planning</p></div>
        ) : (
          <div className="tool-panel">
            <p className="section-label">Drawing tools</p>
            <ToolButton active={tool === "wall"} icon={<PanelTopOpen />} label="Add Wall" onClick={() => setActiveTool("wall")} />
            <ToolButton active={tool === "door"} icon={<DoorOpen />} label="Add Door" onClick={() => setActiveTool("door")} />
            <ToolButton active={tool === "window"} icon={<SquareDashed />} label="Add Window" onClick={() => setActiveTool("window")} />
            <ToolButton active={tool === "furniture"} icon={<Armchair />} label="Add Furniture" onClick={() => setActiveTool("furniture")} />
            <div className={`tool-instruction ${tool === "select" ? "muted" : ""}`}>
              <span className="instruction-dot" />
              {tool === "wall" && (placementStart ? "Click to finish the snapped wall" : "Click on canvas to place a new wall")}
              {tool === "door" && "Click on a wall to add a door to it"}
              {tool === "window" && "Click on a wall to add a window to it"}
              {tool === "furniture" && (placementStart ? "Click the opposite corner to finish" : "Click on canvas to draw furniture bounding box")}
              {tool === "select" && (
                <span>
                  Click a wall twice to select its connected sequence. Cmd/Ctrl-click other sequences, then choose Create Room from Selection.
                </span>
              )}
            </div>
          </div>
        )}
      </aside>

      <section className="canvas-wrap">
        <svg
          aria-label="Room plan drawing canvas"
          className={`drawing-canvas tool-${tool}`}
          onPointerCancel={handleCanvasPointerUp}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onWheel={handleWheel}
          ref={canvasRef}
          style={{ backgroundPosition: `${pan.x}px ${pan.y}px`, backgroundSize: `${gridSpacing * zoom}px ${gridSpacing * zoom}px` }}
        >
          <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
            {plan?.rooms.map((room) => {
              const bounds = roomBounds(plan, room);
              if (!bounds) return null;
              const highlighted =
                (selection?.kind === "room" && selection.roomId === room.id) || candidateRoomId === room.id;
              return (
                <rect
                  className={`room-interior ${highlighted ? "highlighted" : ""}`}
                  height={Math.max(1, bounds.maxY - bounds.minY)}
                  key={room.id}
                  pointerEvents="none"
                  width={Math.max(1, bounds.maxX - bounds.minX)}
                  x={bounds.minX}
                  y={bounds.minY}
                />
              );
            })}

            {plan?.sequences.flatMap((sequence) => sequence.walls.map((wall) => {
              const selected =
                (selection?.kind === "wall" && selection.wallId === wall.id) ||
                (selection?.kind === "sequences" && selection.sequenceIds.includes(sequence.id)) ||
                (selection?.kind === "room" && plan.rooms.find((room) => room.id === selection.roomId)?.sequenceIds.includes(sequence.id));
              const hovered = hoveredWallId === wall.id;
              return (
                <g key={wall.id}>
                  <line
                    className="wall-hit-area"
                    onPointerDown={(event) => handleWallPointerDown(event, wall, sequence)}
                    onPointerEnter={() => setHoveredWallId(wall.id)}
                    onPointerLeave={() => setHoveredWallId(null)}
                    x1={wall.start.x} x2={wall.end.x} y1={wall.start.y} y2={wall.end.y}
                  />
                  <line
                    className={`wall-line ${selected || hovered ? "active" : ""}`}
                    pointerEvents="none"
                    vectorEffect="non-scaling-stroke"
                    x1={wall.start.x} x2={wall.end.x} y1={wall.start.y} y2={wall.end.y}
                  />
                </g>
              );
            }))}

            {plan?.windows.map((opening) => {
              const found = findWall(plan, opening.wallId);
              if (!found) return null;
              return (
                <WindowSymbol
                  key={opening.id}
                  onPointerDown={(event) => handleWindowPointerDown(event, opening, found.wall)}
                  selected={selection?.kind === "window" && selection.windowId === opening.id}
                  wall={found.wall}
                  windowOpening={opening}
                />
              );
            })}

            {plan?.doors.map((door) => {
              const found = findWall(plan, door.wallId);
              if (!found) return null;
              return (
                <DoorSymbol
                  door={door}
                  key={door.id}
                  onPointerDown={(event) => handleDoorPointerDown(event, door, found.wall)}
                  selected={selection?.kind === "door" && selection.doorId === door.id}
                  wall={found.wall}
                />
              );
            })}

            {plan?.furniture.map((item) => (
              <g className="furniture-item" key={item.id} onPointerDown={(event) => handleFurniturePointerDown(event, item)} transform={`translate(${item.center.x} ${item.center.y})`}>
                <rect
                  className={selection?.kind === "furniture" && selection.furnitureId === item.id ? "selected" : ""}
                  height={item.height}
                  rx={Math.min(8, item.height / 6, item.width / 6)}
                  transform={`rotate(${item.rotation})`}
                  vectorEffect="non-scaling-stroke"
                  width={item.width}
                  x={-item.width / 2}
                  y={-item.height / 2}
                />
                <text dominantBaseline="middle" fontSize={Math.min(15, Math.max(9, item.height / 5))} pointerEvents="none" textAnchor="middle">
                  {item.name}
                </text>
              </g>
            ))}

            {plan?.rooms.map((room) => {
              const bounds = roomBounds(plan, room);
              if (!bounds) return null;
              const labelPosition = {
                x: (bounds.minX + bounds.maxX) / 2,
                y: bounds.minY - ROOM_LABEL_OFFSET_PX / zoom,
              };
              const labelWidth = Math.max(92, room.name.length * 8 + 32);
              return (
                <g
                  className={`room-label ${selection?.kind === "room" && selection.roomId === room.id ? "selected" : ""}`}
                  key={room.id}
                  onPointerDown={(event) => handleRoomPointerDown(event, room)}
                  transform={`translate(${labelPosition.x} ${labelPosition.y}) scale(${1 / zoom})`}
                >
                  <rect height="32" rx="16" width={labelWidth} x={-labelWidth / 2} y="-16" />
                  <text dominantBaseline="middle" textAnchor="middle">{room.name}</text>
                </g>
              );
            })}

            {plan?.sequences.flatMap((sequence) => sequence.walls.flatMap((wall) => {
              const expose = hoveredWallId === wall.id || (selection?.kind === "wall" && selection.wallId === wall.id);
              if (!expose || selection?.kind === "sequences") return [];
              const endpoints: Array<{ side: "start" | "end"; point: Point }> = [];
              if (sequence.walls[0].id === wall.id && endpointAvailable(wall.id, wall.start)) endpoints.push({ side: "start", point: wall.start });
              if (sequence.walls.at(-1)?.id === wall.id && endpointAvailable(wall.id, wall.end)) endpoints.push({ side: "end", point: wall.end });
              return endpoints.map(({ side, point }) => (
                <g
                  className="endpoint-plus"
                  key={`${wall.id}-${side}`}
                  onPointerDown={(event) => startExtension(event, sequence, side)}
                  onPointerEnter={() => setHoveredWallId(wall.id)}
                  transform={`translate(${point.x} ${point.y}) scale(${1 / zoom})`}
                >
                  <circle r="11" />
                  <line x1="-4" x2="4" y1="0" y2="0" />
                  <line x1="0" x2="0" y1="-4" y2="4" />
                </g>
              ));
            }))}

            {placementStart && <PointMarker point={placementStart} />}
            {placementStart && previewEnd && tool === "wall" && (
              <g pointerEvents="none">
                <line className="wall-preview" vectorEffect="non-scaling-stroke" x1={placementStart.x} x2={previewEnd.x} y1={placementStart.y} y2={previewEnd.y} />
                <PointMarker point={previewEnd} />
                <g className="length-pill" transform={`translate(${(placementStart.x + previewEnd.x) / 2} ${(placementStart.y + previewEnd.y) / 2 - 18 / zoom}) scale(${1 / zoom})`}>
                  <rect height="24" rx="12" width="76" x="-38" y="-12" />
                  <text dominantBaseline="middle" textAnchor="middle">{displayLinear(distance(placementStart, previewEnd))} {unitLabel}</text>
                </g>
              </g>
            )}
            {placementStart && previewEnd && tool === "furniture" && (
              <rect
                className="furniture-preview"
                height={Math.abs(previewEnd.y - placementStart.y)}
                pointerEvents="none"
                vectorEffect="non-scaling-stroke"
                width={Math.abs(previewEnd.x - placementStart.x)}
                x={Math.min(placementStart.x, previewEnd.x)}
                y={Math.min(placementStart.y, previewEnd.y)}
              />
            )}
          </g>
        </svg>
        {renderPropertyCard()}
        <div className="canvas-scale"><span />{displayLinear(gridSpacing)} {unitLabel} grid</div>
      </section>

      <Dialog open={hydrated && !plan}>
        <DialogContent
          aria-describedby="create-plan-description"
          className="setup-dialog"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          showCloseButton={false}
        >
          <div className="dialog-icon"><SquareDashed /></div>
          <DialogHeader>
            <DialogTitle>Create New Plan</DialogTitle>
            <DialogDescription id="create-plan-description">Give this floor plan a name. You can export it later as a JSON file.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createPlan}>
            <div className="field-group">
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input autoFocus id="plan-name" onChange={(event) => setPlanName(event.target.value)} placeholder="e.g. Main Floor" value={planName} />
            </div>
            <div className="field-group">
              <Label>Measurement units</Label>
              <UnitToggle onChange={switchUnit} unit={unit} wide />
            </div>
            <DialogFooter>
              <Button onClick={() => fileInputRef.current?.click()} type="button" variant="outline"><FileUp /> Import JSON</Button>
              <Button type="submit">Start Planning</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(hydrated && plan && plan.sequences.length === 0)}>
        <DialogContent
          aria-describedby="first-wall-description"
          className="setup-dialog"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          showCloseButton={false}
        >
          <div className="dialog-icon"><PanelTopOpen /></div>
          <DialogHeader>
            <DialogTitle>Length of the first wall ({unitLabel})</DialogTitle>
            <DialogDescription id="first-wall-description">Start with one horizontal reference wall. You can extend or edit it afterward.</DialogDescription>
          </DialogHeader>
          <form onSubmit={createFirstWall}>
            <div className="field-group">
              <Label htmlFor="first-wall-length">Length ({unitLabel})</Label>
              <Input autoFocus id="first-wall-length" min="0" onChange={(event) => setFirstWallLength(event.target.value)} step="0.1" type="number" value={firstWallLength} />
            </div>
            <div className="field-group">
              <Label>Measurement units</Label>
              <UnitToggle onChange={switchUnit} unit={unit} wide />
            </div>
            <DialogFooter><Button type="submit">Create Wall</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function UnitToggle({
  onChange,
  unit,
  wide = false,
}: {
  onChange: (unit: LinearUnit) => void;
  unit: LinearUnit;
  wide?: boolean;
}) {
  const id = useId();
  return (
    <RadioGroup
      aria-label="Measurement units"
      className={`unit-toggle ${wide ? "wide" : ""}`}
      onValueChange={(value) => onChange(value as LinearUnit)}
      value={unit}
    >
      {(["cm", "in"] as const).map((value) => (
        <div className="unit-option" data-active={unit === value} key={value}>
          <RadioGroupItem id={`${id}-${value}`} value={value} />
          <Label htmlFor={`${id}-${value}`}>{value}</Label>
        </div>
      ))}
    </RadioGroup>
  );
}

function ToolButton({ active, icon, label, onClick }: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={`tool-button ${active ? "active" : ""}`} onClick={onClick} type="button">
      <span className="tool-icon">{icon}</span><span>{label}</span>
    </button>
  );
}

function PropertyCard({ children, eyebrow, title }: { children: React.ReactNode; eyebrow: string; title: string }) {
  return (
    <aside className="property-card">
      <div className="property-heading"><span>{eyebrow}</span><h2>{title}</h2></div>
      <div className="property-body">{children}</div>
    </aside>
  );
}

function DoorSymbol({ door, onPointerDown, selected, wall }: {
  door: Door;
  onPointerDown: (event: React.PointerEvent<SVGGElement>) => void;
  selected: boolean;
  wall: Wall;
}) {
  const length = wallLength(wall);
  const unit = { x: (wall.end.x - wall.start.x) / length, y: (wall.end.y - wall.start.y) / length };
  const normal = { x: -unit.y, y: unit.x };
  const start = { x: wall.start.x + unit.x * door.offset, y: wall.start.y + unit.y * door.offset };
  const end = { x: start.x + unit.x * door.width, y: start.y + unit.y * door.width };
  const hinge = door.hingeAtStart ? start : end;
  const closed = door.hingeAtStart ? end : start;
  const open = { x: hinge.x + normal.x * door.width * door.swingSide, y: hinge.y + normal.y * door.width * door.swingSide };
  const sweep = (door.hingeAtStart ? 1 : 0) === (door.swingSide === 1 ? 1 : 0) ? 1 : 0;
  return (
    <g className={`door-symbol ${selected ? "selected" : ""}`} onPointerDown={onPointerDown}>
      <title>Door — click to select or drag to reposition</title>
      <line className="opening-mask" vectorEffect="non-scaling-stroke" x1={start.x} x2={end.x} y1={start.y} y2={end.y} />
      <line className="door-closed-outline" vectorEffect="non-scaling-stroke" x1={start.x} x2={end.x} y1={start.y} y2={end.y} />
      <line className="door-closed-panel" vectorEffect="non-scaling-stroke" x1={start.x} x2={end.x} y1={start.y} y2={end.y} />
      <line className="door-closed-hit-area" vectorEffect="non-scaling-stroke" x1={start.x} x2={end.x} y1={start.y} y2={end.y} />
      <line className="door-hit-area" vectorEffect="non-scaling-stroke" x1={hinge.x} x2={open.x} y1={hinge.y} y2={open.y} />
      <line className="door-leaf" vectorEffect="non-scaling-stroke" x1={hinge.x} x2={open.x} y1={hinge.y} y2={open.y} />
      <path className="door-arc" d={`M ${closed.x} ${closed.y} A ${door.width} ${door.width} 0 0 ${sweep} ${open.x} ${open.y}`} fill="none" vectorEffect="non-scaling-stroke" />
    </g>
  );
}

function WindowSymbol({ onPointerDown, selected, wall, windowOpening }: {
  onPointerDown: (event: React.PointerEvent<SVGGElement>) => void;
  selected: boolean;
  wall: Wall;
  windowOpening: WindowOpening;
}) {
  const length = wallLength(wall);
  const unit = { x: (wall.end.x - wall.start.x) / length, y: (wall.end.y - wall.start.y) / length };
  const normal = { x: -unit.y, y: unit.x };
  const start = { x: wall.start.x + unit.x * windowOpening.offset, y: wall.start.y + unit.y * windowOpening.offset };
  const end = { x: start.x + unit.x * windowOpening.width, y: start.y + unit.y * windowOpening.width };
  return (
    <g className={`window-symbol ${selected ? "selected" : ""}`} onPointerDown={onPointerDown}>
      <line className="opening-mask" x1={start.x} x2={end.x} y1={start.y} y2={end.y} />
      <line className="window-hit-area" x1={start.x} x2={end.x} y1={start.y} y2={end.y} />
      {[3, -3].map((offset) => (
        <line
          className="window-line"
          key={offset}
          vectorEffect="non-scaling-stroke"
          x1={start.x + normal.x * offset}
          x2={end.x + normal.x * offset}
          y1={start.y + normal.y * offset}
          y2={end.y + normal.y * offset}
        />
      ))}
    </g>
  );
}
