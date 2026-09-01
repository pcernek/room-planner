import assert from "node:assert/strict";
import test from "node:test";

import {
  centimetersToUnit,
  changeWallLength,
  chooseRoomForPoint,
  deleteWallFromPlan,
  formatLinearMeasurement,
  isValidPlan,
  roomBounds,
  snapEndPoint,
  unitToCentimeters,
  wallLength,
} from "../lib/planner.ts";

const wall = (id, x1, y1, x2, y2) => ({
  id,
  start: { x: x1, y: y1 },
  end: { x: x2, y: y2 },
});

const basePlan = () => ({
  version: 1,
  id: "plan-1",
  name: "Main Floor",
  createdAt: 1,
  sequences: [],
  doors: [],
  windows: [],
  furniture: [],
  rooms: [],
});

test("wall preview snaps to the nearest 45 degree increment", () => {
  const end = snapEndPoint({ x: 0, y: 0 }, { x: 91, y: 83 });
  assert.ok(Math.abs(end.x - end.y) < 0.0001);
  assert.ok(Math.abs(Math.hypot(end.x, end.y) - Math.hypot(91, 83)) < 0.0001);
});

test("linear measurements convert without changing physical size and round to tenths", () => {
  assert.equal(centimetersToUnit(254, "in"), 100);
  assert.equal(unitToCentimeters(100, "in"), 254);
  assert.equal(formatLinearMeasurement(100, "cm"), "100.0");
  assert.equal(formatLinearMeasurement(100, "in"), "39.4");
  assert.equal(formatLinearMeasurement(25.4, "in"), "10.0");
});

test("editing a wall length moves every later segment without changing their shape", () => {
  const sequence = {
    id: "s1",
    walls: [wall("w1", 0, 0, 100, 0), wall("w2", 100, 0, 100, 80)],
  };
  const changed = changeWallLength(sequence, "w1", 150);
  assert.equal(wallLength(changed.walls[0]), 150);
  assert.deepEqual(changed.walls[1].start, { x: 150, y: 0 });
  assert.deepEqual(changed.walls[1].end, { x: 150, y: 80 });
});

test("deleting a middle wall splits a sequence and retains both pieces in its room", () => {
  const plan = basePlan();
  plan.sequences = [{
    id: "s1",
    walls: [wall("w1", 0, 0, 100, 0), wall("w2", 100, 0, 100, 100), wall("w3", 100, 100, 0, 100)],
  }];
  plan.rooms = [{ id: "r1", name: "Office", sequenceIds: ["s1"], createdAt: 1 }];
  plan.doors = [{ id: "d1", wallId: "w2", offset: 0, width: 60, hingeAtStart: true, swingSide: 1 }];
  const changed = deleteWallFromPlan(plan, "w2");
  assert.equal(changed.sequences.length, 2);
  assert.deepEqual(changed.sequences.flatMap((sequence) => sequence.walls.map((item) => item.id)), ["w1", "w3"]);
  assert.equal(changed.rooms[0].sequenceIds.length, 2);
  assert.equal(changed.doors.length, 0);
});

test("room assignment preserves a qualifying current room and otherwise selects the smallest room", () => {
  const plan = basePlan();
  plan.sequences = [
    { id: "outer", walls: [wall("a", 0, 0, 200, 0), wall("b", 200, 0, 200, 200)] },
    { id: "inner", walls: [wall("c", 20, 20, 80, 20), wall("d", 80, 20, 80, 80)] },
  ];
  plan.rooms = [
    { id: "r-outer", name: "Outer", sequenceIds: ["outer"], createdAt: 1 },
    { id: "r-inner", name: "Inner", sequenceIds: ["inner"], createdAt: 2 },
  ];
  assert.equal(chooseRoomForPoint(plan, { x: 50, y: 50 }, null), "r-inner");
  assert.equal(chooseRoomForPoint(plan, { x: 50, y: 50 }, "r-outer"), "r-outer");
  assert.equal(chooseRoomForPoint(plan, { x: 500, y: 500 }, null), null);
  assert.deepEqual(roomBounds(plan, plan.rooms[1]), { minX: 20, minY: 20, maxX: 80, maxY: 80 });
});

test("import validation rejects broken host relationships and accepts a coherent plan", () => {
  const plan = basePlan();
  plan.sequences = [{ id: "s1", walls: [wall("w1", 0, 0, 200, 0)] }];
  plan.windows = [{ id: "window-1", wallId: "w1", offset: 20, width: 100 }];
  assert.equal(isValidPlan(plan), true);
  assert.equal(isValidPlan({ ...plan, windows: [{ ...plan.windows[0], wallId: "missing" }] }), false);
  assert.equal(isValidPlan({ ...plan, windows: [{ ...plan.windows[0], offset: 150 }] }), false);
});
