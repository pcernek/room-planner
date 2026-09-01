export type Point = { x: number; y: number };

export type LinearUnit = "cm" | "in";

export const centimetersToUnit = (value: number, unit: LinearUnit) =>
  unit === "in" ? value / 2.54 : value;

export const unitToCentimeters = (value: number, unit: LinearUnit) =>
  unit === "in" ? value * 2.54 : value;

export const roundToTenth = (value: number) =>
  Math.round((value + Number.EPSILON) * 10) / 10;

export const formatLinearMeasurement = (valueInCentimeters: number, unit: LinearUnit) =>
  roundToTenth(centimetersToUnit(valueInCentimeters, unit)).toFixed(1);

export type Wall = {
  id: string;
  start: Point;
  end: Point;
};

export type WallSequence = {
  id: string;
  walls: Wall[];
};

export type Door = {
  id: string;
  wallId: string;
  offset: number;
  width: number;
  hingeAtStart: boolean;
  swingSide: 1 | -1;
};

export type WindowOpening = {
  id: string;
  wallId: string;
  offset: number;
  width: number;
};

export type Room = {
  id: string;
  name: string;
  sequenceIds: string[];
  createdAt: number;
};

export type Furniture = {
  id: string;
  name: string;
  center: Point;
  width: number;
  height: number;
  rotation: number;
  roomId: string | null;
};

export type Plan = {
  version: 1;
  id: string;
  name: string;
  createdAt: number;
  sequences: WallSequence[];
  doors: Door[];
  windows: WindowOpening[];
  furniture: Furniture[];
  rooms: Room[];
};

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const distance = (a: Point, b: Point) =>
  Math.hypot(b.x - a.x, b.y - a.y);

export const wallLength = (wall: Wall) => distance(wall.start, wall.end);

export const wallAngle = (wall: Wall) =>
  (Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x) * 180) /
  Math.PI;

export const normalizeAngle = (angle: number) => {
  const wrapped = ((angle + 180) % 360 + 360) % 360 - 180;
  return Object.is(wrapped, -0) ? 0 : wrapped;
};

export const snapEndPoint = (start: Point, pointer: Point): Point => {
  const length = distance(start, pointer);
  const raw = Math.atan2(pointer.y - start.y, pointer.x - start.x);
  const snapped = Math.round(raw / (Math.PI / 4)) * (Math.PI / 4);
  return {
    x: start.x + Math.cos(snapped) * length,
    y: start.y + Math.sin(snapped) * length,
  };
};

export const findWall = (plan: Plan, wallId: string) => {
  for (const sequence of plan.sequences) {
    const wall = sequence.walls.find((candidate) => candidate.id === wallId);
    if (wall) return { wall, sequence };
  }
  return null;
};

export const sequenceRoomId = (plan: Plan, sequenceId: string) =>
  plan.rooms.find((room) => room.sequenceIds.includes(sequenceId))?.id ?? null;

export const roomBounds = (plan: Plan, room: Room): Bounds | null => {
  const walls = plan.sequences
    .filter((sequence) => room.sequenceIds.includes(sequence.id))
    .flatMap((sequence) => sequence.walls);
  if (!walls.length) return null;
  const points = walls.flatMap((wall) => [wall.start, wall.end]);
  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
};

export const boundsArea = (bounds: Bounds) =>
  (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);

export const pointInBounds = (point: Point, bounds: Bounds) =>
  point.x >= bounds.minX &&
  point.x <= bounds.maxX &&
  point.y >= bounds.minY &&
  point.y <= bounds.maxY;

export const chooseRoomForPoint = (
  plan: Plan,
  point: Point,
  existingRoomId: string | null,
) => {
  const candidates = plan.rooms
    .map((room) => ({ room, bounds: roomBounds(plan, room) }))
    .filter(
      (entry): entry is { room: Room; bounds: Bounds } =>
        Boolean(entry.bounds && pointInBounds(point, entry.bounds)),
    );
  if (!candidates.length) return null;
  if (existingRoomId && candidates.some(({ room }) => room.id === existingRoomId)) {
    return existingRoomId;
  }
  candidates.sort(
    (a, b) =>
      boundsArea(a.bounds) - boundsArea(b.bounds) ||
      b.room.createdAt - a.room.createdAt,
  );
  return candidates[0].room.id;
};

export const moveSequence = (
  sequence: WallSequence,
  delta: Point,
): WallSequence => ({
  ...sequence,
  walls: sequence.walls.map((wall) => ({
    ...wall,
    start: { x: wall.start.x + delta.x, y: wall.start.y + delta.y },
    end: { x: wall.end.x + delta.x, y: wall.end.y + delta.y },
  })),
});

export const changeWallLength = (
  sequence: WallSequence,
  wallId: string,
  nextLength: number,
): WallSequence => {
  const index = sequence.walls.findIndex((wall) => wall.id === wallId);
  if (index < 0 || !Number.isFinite(nextLength) || nextLength <= 0) return sequence;
  const target = sequence.walls[index];
  const angle = (wallAngle(target) * Math.PI) / 180;
  const nextEnd = {
    x: target.start.x + Math.cos(angle) * nextLength,
    y: target.start.y + Math.sin(angle) * nextLength,
  };
  const delta = { x: nextEnd.x - target.end.x, y: nextEnd.y - target.end.y };
  return {
    ...sequence,
    walls: sequence.walls.map((wall, wallIndex) => {
      if (wallIndex < index) return wall;
      if (wallIndex === index) return { ...wall, end: nextEnd };
      return {
        ...wall,
        start: { x: wall.start.x + delta.x, y: wall.start.y + delta.y },
        end: { x: wall.end.x + delta.x, y: wall.end.y + delta.y },
      };
    }),
  };
};

export const changeStandaloneAngle = (
  sequence: WallSequence,
  wallId: string,
  nextAngle: number,
): WallSequence => {
  if (sequence.walls.length !== 1 || !Number.isFinite(nextAngle)) return sequence;
  const wall = sequence.walls[0];
  if (wall.id !== wallId) return sequence;
  const length = wallLength(wall);
  const radians = (normalizeAngle(nextAngle) * Math.PI) / 180;
  return {
    ...sequence,
    walls: [
      {
        ...wall,
        end: {
          x: wall.start.x + Math.cos(radians) * length,
          y: wall.start.y + Math.sin(radians) * length,
        },
      },
    ],
  };
};

export const deleteWallFromPlan = (plan: Plan, wallId: string): Plan => {
  const found = findWall(plan, wallId);
  if (!found) return plan;
  const index = found.sequence.walls.findIndex((wall) => wall.id === wallId);
  const before = found.sequence.walls.slice(0, index);
  const after = found.sequence.walls.slice(index + 1);
  const replacement: WallSequence[] = [];
  if (before.length) replacement.push({ ...found.sequence, walls: before });
  if (after.length) {
    replacement.push({
      id: before.length ? uid("seq") : found.sequence.id,
      walls: after,
    });
  }

  const sequenceIds = replacement.map((sequence) => sequence.id);
  const rooms = plan.rooms
    .map((room) =>
      room.sequenceIds.includes(found.sequence.id)
        ? {
            ...room,
            sequenceIds: room.sequenceIds.flatMap((id) =>
              id === found.sequence.id ? sequenceIds : [id],
            ),
          }
        : room,
    )
    .filter((room) => room.sequenceIds.length > 0);
  const survivingRoomIds = new Set(rooms.map((room) => room.id));
  return {
    ...plan,
    sequences: plan.sequences.flatMap((sequence) =>
      sequence.id === found.sequence.id ? replacement : [sequence],
    ),
    doors: plan.doors.filter((door) => door.wallId !== wallId),
    windows: plan.windows.filter((window) => window.wallId !== wallId),
    rooms,
    furniture: plan.furniture.map((item) =>
      item.roomId && !survivingRoomIds.has(item.roomId)
        ? { ...item, roomId: null }
        : item,
    ),
  };
};

const finitePoint = (value: unknown): value is Point => {
  if (!value || typeof value !== "object") return false;
  const point = value as Point;
  return Number.isFinite(point.x) && Number.isFinite(point.y);
};

export const isValidPlan = (value: unknown): value is Plan => {
  if (!value || typeof value !== "object") return false;
  const plan = value as Plan;
  if (
    plan.version !== 1 ||
    typeof plan.id !== "string" ||
    typeof plan.name !== "string" ||
    !plan.name.trim() ||
    !Number.isFinite(plan.createdAt) ||
    !Array.isArray(plan.sequences) ||
    !Array.isArray(plan.doors) ||
    !Array.isArray(plan.windows) ||
    !Array.isArray(plan.furniture) ||
    !Array.isArray(plan.rooms)
  ) return false;

  const sequenceIds = new Set<string>();
  const wallIds = new Set<string>();
  for (const sequence of plan.sequences) {
    if (!sequence || typeof sequence.id !== "string" || sequenceIds.has(sequence.id)) return false;
    if (!Array.isArray(sequence.walls) || !sequence.walls.length) return false;
    sequenceIds.add(sequence.id);
    for (const wall of sequence.walls) {
      if (!wall || typeof wall.id !== "string" || wallIds.has(wall.id)) return false;
      if (!finitePoint(wall.start) || !finitePoint(wall.end) || wallLength(wall) <= 0) return false;
      wallIds.add(wall.id);
    }
  }

  const roomIds = new Set<string>();
  const claimedSequences = new Set<string>();
  for (const room of plan.rooms) {
    if (!room || typeof room.id !== "string" || roomIds.has(room.id)) return false;
    if (typeof room.name !== "string" || !Array.isArray(room.sequenceIds) || !room.sequenceIds.length) return false;
    if (!Number.isFinite(room.createdAt)) return false;
    roomIds.add(room.id);
    for (const id of room.sequenceIds) {
      if (!sequenceIds.has(id) || claimedSequences.has(id)) return false;
      claimedSequences.add(id);
    }
  }

  const entityIds = new Set<string>();
  for (const door of plan.doors) {
    const found = door && typeof door.wallId === "string" ? findWall(plan, door.wallId) : null;
    if (!door || typeof door.id !== "string" || entityIds.has(door.id) || !found) return false;
    if (!Number.isFinite(door.offset) || door.offset < 0 || !Number.isFinite(door.width) || door.width <= 0) return false;
    if (door.offset + door.width > wallLength(found.wall) + 0.001) return false;
    if (typeof door.hingeAtStart !== "boolean" || (door.swingSide !== 1 && door.swingSide !== -1)) return false;
    entityIds.add(door.id);
  }
  for (const window of plan.windows) {
    const found = window && typeof window.wallId === "string" ? findWall(plan, window.wallId) : null;
    if (!window || typeof window.id !== "string" || entityIds.has(window.id) || !found) return false;
    if (!Number.isFinite(window.offset) || window.offset < 0 || !Number.isFinite(window.width) || window.width <= 0) return false;
    if (window.offset + window.width > wallLength(found.wall) + 0.001) return false;
    entityIds.add(window.id);
  }
  for (const item of plan.furniture) {
    if (!item || typeof item.id !== "string" || entityIds.has(item.id)) return false;
    if (typeof item.name !== "string" || !finitePoint(item.center)) return false;
    if (!Number.isFinite(item.width) || item.width <= 0 || !Number.isFinite(item.height) || item.height <= 0) return false;
    if (!Number.isFinite(item.rotation) || (item.roomId !== null && !roomIds.has(item.roomId))) return false;
    entityIds.add(item.id);
  }
  return true;
};

export const planBounds = (plan: Plan): Bounds | null => {
  const points = plan.sequences.flatMap((sequence) =>
    sequence.walls.flatMap((wall) => [wall.start, wall.end]),
  );
  for (const item of plan.furniture) {
    const radians = (item.rotation * Math.PI) / 180;
    const halfWidth = item.width / 2;
    const halfHeight = item.height / 2;
    const extentX = Math.abs(Math.cos(radians) * halfWidth) + Math.abs(Math.sin(radians) * halfHeight);
    const extentY = Math.abs(Math.sin(radians) * halfWidth) + Math.abs(Math.cos(radians) * halfHeight);
    points.push(
      { x: item.center.x - extentX, y: item.center.y - extentY },
      { x: item.center.x + extentX, y: item.center.y + extentY },
    );
  }
  if (!points.length) return null;
  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
};
