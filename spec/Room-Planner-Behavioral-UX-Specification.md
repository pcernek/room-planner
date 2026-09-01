# Room Planner — Behavioral and UX Specification

**Status:** Product specification.

**Purpose:** This document defines the Room Planner's user-visible behavior, interaction rules, state transitions, and product boundaries. It is written to stand on its own as a handoff to a person or agent implementing the application from this specification. It deliberately omits code structure and implementation choices.

The document is normative: every described behavior is part of the product contract unless explicitly identified as outside the product's scope.

## Navigation

- **Product foundation:** [Product definition](#1-product-definition), [experience principles](#11-experience-principles), [architecture and persistence](#2-highest-level-architecture-and-persistence-boundary), [object model](#3-product-vocabulary-and-object-relationships), [app shell](#4-application-shell-and-navigation), and [plan lifecycle](#5-plan-lifecycle)
- **Editor behavior:** [Tool modes](#6-tool-modes-and-cancellation-rules), [canvas navigation](#7-canvas-navigation-and-visual-language), [walls](#8-wall-workflows), [rooms](#9-room-workflows), [doors and windows](#10-door-and-window-workflows), [furniture](#11-furniture-workflows), [selection precedence](#12-selection-and-interaction-precedence), and [property updates](#13-automatic-property-updates-and-validation)
- **Data and platform behavior:** [File operations](#14-file-operations), [measurement conventions](#15-measurement-conventions), [input and responsiveness](#16-responsive-and-input-expectations), and [product boundaries](#17-intentional-product-boundaries-and-absent-capabilities)
- **Validation:** [Acceptance scenarios](#18-acceptance-scenarios)

## 1. Product definition

Room Planner is a desktop-first, full-window web app for drawing a simple two-dimensional floor plan containing multiple rooms and arranging furniture across them.

The user can:

- Create one named plan on a shared canvas, with all linear measurements expressed in centimeters.
- Draw straight wall segments, including disconnected walls and connected wall groups.
- Define named rooms from one or more wall sequences and display a label for each room.
- Attach doors to walls and control each door's position, width, hinge side, and swing direction.
- Attach windows to walls and control each window's position and width.
- Draw generic rectangular furniture, name it, size it, rotate it, move it, and automatically associate it with the room in which it is placed.
- Move a complete room—including its wall sequences, doors, and assigned furniture—as one unit by dragging its label.
- Pan and zoom an effectively unbounded grid canvas.
- Select individual objects, inspect them, edit their properties, and delete them.
- Select and move an entire connected group of walls, or Cmd/Ctrl-select several wall sequences to define or edit a room.
- Undo and redo accepted plan edits made during the current editing session.
- Rely on automatic local persistence between browser sessions.
- Export the plan as JSON and import a previously exported plan.
- Discard the current plan and start again.

This is a schematic layout tool, not a 3D room designer, furniture catalog, architectural drafting system, or collaborative cloud product.

### 1.1 Experience principles

- **Direct manipulation first.** The canvas is the primary place to create, select, and move objects. The property card provides precise correction rather than replacing direct spatial interaction.
- **Progressive disclosure.** Keep the persistent interface spare. Reveal controls, instructions, and properties when the user selects an object or enters a placement mode.
- **Spatial relationships stay coherent.** Moving a wall sequence carries its openings; moving a room carries its member sequences and assigned furniture; directly moving furniture updates its room assignment predictably.
- **Fast, reversible-feeling iteration.** Give immediate visual feedback while drawing and dragging, preserve accepted changes automatically, and reserve blocking confirmation for consequential whole-plan replacement or deletion.
- **Schematic clarity over architectural precision.** Use familiar, legible two-dimensional symbols and measurements without implying that the plan is a construction drawing. Room interiors are intentionally approximate interaction regions.
- **Calm functional visual language.** Use a restrained neutral canvas and subtle grid, readable labels, clear hover and selection accents, and unambiguous destructive styling. Avoid decoration that competes with the plan.
- **Predictable corrections.** Constrain wall-bound objects to their host walls, clamp values that must remain in bounds, and retain manual correction controls for approximate cases.
- **Desktop-first, accessible controls.** Optimize spatial editing for a pointer-capable desktop device while keeping conventional controls, dialogs, and forms clearly labeled and keyboard reachable.

## 2. Highest-level architecture and persistence boundary

- The product is a single-page web application.
- It has no account system, server-side project store, or cloud synchronization.
- The browser automatically retains the current plan and the current viewport locally.
- There is only one active plan at a time; there is no project list.
- Manual JSON export/import provides portability and a durable backup mechanism.
- Selection and the currently active editing tool are transient rather than durable project data.
- Undo/redo history is transient and is not restored after a reload, import, or starting from scratch.

Consequences that should be visible in the product experience:

- Returning to the app in the same browser restores the most recent plan automatically.
- Opening it in another browser or on another device does not reveal that plan.
- No explicit Save button or saved-state indicator is needed.
- Clearing site data can remove the locally retained plan unless the user exported it.

## 3. Product vocabulary and object relationships

| Concept | User-facing meaning | Important relationship |
| --- | --- | --- |
| Plan | The single current project, identified by a name | Contains all rooms, walls, doors, windows, and furniture on one shared canvas |
| Room | A named grouping of one or more wall sequences | Has a calculated rectangular interior, a label, and assigned furniture |
| Wall | One straight segment with a length and direction | May belong to a connected wall group |
| Wall sequence | A connected, ordered group of wall segments | Moves as a unit when group-selected and may belong to one room |
| Door | A door opening and swing symbol | Always belongs to one host wall |
| Window | A simple visual opening for reference | Always belongs to one host wall |
| Furniture | A named rectangular footprint | May be assigned to one room or remain unassigned |
| Viewport | The user's pan and zoom position | Persists locally but is not part of exported plan content |
| Selection | The object, room, wall sequence, or set of wall sequences currently targeted | Cmd/Ctrl-click supports multi-selection of wall sequences only |
| Tool mode | Select, add wall, add door, add window, or add furniture | Only one mode is active at a time |

Walls may form multiple disconnected sequences. Two sequences can visually overlap or meet without becoming one connected sequence. A wall sequence belongs to at most one room. Doors and windows cannot exist independently of their host walls and inherit room movement through those walls. Furniture belongs to at most one room but remains directly movable as an independent object.

### 3.1 Room interior and membership model

A room does not require its walls to form a closed loop. Its effective interior is the smallest axis-aligned bounding box containing every wall in every wall sequence assigned to that room. This bounding box is an interaction and grouping region, not a calculation of architectural floor area.

The room interior updates whenever one of its wall sequences is added, removed, moved, extended, shortened, split, or otherwise edited. Irregular, angled, incomplete, or decorative wall arrangements are accepted without closure or self-intersection validation.

Furniture assignment uses the center point of the furniture footprint:

- A furniture item whose center lies within exactly one room interior is assigned to that room.
- If its center lies in overlapping room interiors, preserve its existing room when that room still qualifies. Otherwise assign it to the qualifying room with the smallest bounding-box area; if tied, use the most recently created tied room.
- A furniture item whose center is outside every room interior is **Unassigned**.
- Automatic assignment occurs when furniture is created or directly dropped after a drag. It does not change merely because walls are edited or an entire room is moved.

## 4. Application shell and navigation

The application occupies the full browser viewport and has three persistent regions.

### 4.1 Top toolbar

The toolbar spans the top of the app and contains:

- A **File** dropdown on the left.
- The plan name in the center when a plan exists.
- **Undo** and **Redo**, zoom controls, and **Recenter View** on the right.

Undo and Redo are disabled when unavailable. They use familiar keyboard shortcuts: Cmd+Z / Ctrl+Z for Undo, and Shift+Cmd+Z / Ctrl+Y for Redo.

The File menu contains:

- **Import JSON**
- **Export JSON**
- A divider
- **Start from Scratch**, styled as a destructive action

The menu closes after choosing an action or clicking elsewhere.

#### Undo and Redo

Undo reverses the most recent accepted plan edit. Redo reapplies an edit that was undone. An accepted edit includes creation, deletion, dragging, property changes, room definition or membership changes, and plan-name changes. Selection changes, hovering, tool changes, viewport movement, and unfinished placement gestures are not history entries.

An edit made after Undo clears the redo history. Importing a plan or starting from scratch clears both histories. Undo does not restore a plan replaced by import or removed by Start from Scratch; those actions use confirmation instead.

### 4.2 Left sidebar

The sidebar has a fixed, comfortably readable width, is visually separate from the canvas, and is headed **Room Planner**.

When there is no plan, it says **Create a plan to start planning**.

When a plan exists, it presents four large tool buttons:

- **Add Wall**
- **Add Door**
- **Add Window**
- **Add Furniture**

An active tool button becomes darker and more emphatic. A short instruction appears beneath it. Clicking the already-active button toggles back to ordinary selection mode.

Below the placement tools, show a contextual **Define Room** action. It is disabled until one or more eligible wall sequences are selected, and opens the same room-naming flow as **Create Room from Selection**. This makes room creation discoverable without treating it as another placement mode.

### 4.3 Canvas and property card

The remaining area is an interactive canvas over a subtle grid. The canvas resizes with the available browser space.

When an entity, wall sequence, wall-sequence selection, or room is selected, a white floating contextual property card appears near the upper-right corner of the canvas. It overlays, rather than displacing, the drawing.

The card's title and controls are determined entirely by the current selection. It presents only actions and editable or read-only properties relevant to that selection—for example, wall geometry for a wall, hinge and swing controls for a door, offset and width for a window, dimensions and room assignment for furniture, and grouping actions for selected wall sequences. Selecting a different object updates the existing card in place. Clearing the selection or deleting the selected object closes it.

A modal overlay is used for initial plan setup. It blocks interaction with the rest of the app.

## 5. Plan lifecycle

### 5.1 First arrival or no current plan

Show a blocking **Create New Plan** modal with:

- A required **Plan Name** text field.
- Placeholder text such as **e.g. Main Floor**.
- A **Start Planning** submit button.

The plan-name field receives initial focus. Leading and trailing whitespace is removed on submit. An empty or whitespace-only name is rejected with clear validation feedback.

There is no way to dismiss this modal without creating or importing a plan.

### 5.2 Rename a plan

Clicking the plan name in the toolbar makes it editable in place. The user can commit a non-empty trimmed name with Enter or by moving focus away, or cancel the edit with Escape. Invalid names retain the prior plan name and receive clear validation feedback.

### 5.3 Resume an existing plan

When a locally retained plan exists, bypass onboarding and open it directly. Restore its previous pan and zoom position. Do not restore a prior selection or active placement mode.

### 5.4 Start from scratch

Choosing **File → Start from Scratch** asks for confirmation:

> Are you sure you want to delete the current project? This action cannot be undone.

Cancel preserves the plan. Confirm removes the plan, all of its rooms and entities, and the selection, then returns to the Create New Plan modal.

A newly created plan begins as an empty canvas with its drawing origin centered at 100% zoom. The user adds the first wall with the ordinary **Add Wall** workflow.

## 6. Tool modes and cancellation rules

| Mode | Entry | Main interaction | Normal completion | Cancellation or interruption |
| --- | --- | --- | --- | --- |
| Select | Default; or toggle off an active tool | Select and drag entities; pan empty canvas | Remains active | N/A |
| Add Wall | Click **Add Wall** or a free-endpoint plus control | Two canvas clicks define a wall; moving between clicks previews it | Creates one wall and returns to Select | Click active button again, press Escape, switch tools, or finish below minimum length |
| Add Door | Click **Add Door** | Click a wall | Creates one door and returns to Select | Click active button again, press Escape, click empty canvas, or select a door, window, or furniture item |
| Add Window | Click **Add Window** | Click a wall | Creates one window and returns to Select | Click active button again, press Escape, click empty canvas, or select a door, window, or furniture item |
| Add Furniture | Click **Add Furniture** | Two canvas clicks define opposite corners | Creates one item and returns to Select | Click active button again, press Escape, or switch tools |

Changing away from Add Wall or Add Furniture clears any unfinished first point and preview. Escape cancels any unfinished placement gesture and returns to Select mode without changing the plan.

When no placement gesture or inline edit is active, Escape clears the selection. Escape cancels an inline plan-name edit without changing the name. It never undoes an accepted change; use Undo for that.

## 7. Canvas navigation and visual language

### 7.1 Grid

- Grid lines are spaced 25 cm apart.
- Grid lines remain subtle and extend throughout the visible canvas as the user pans.
- There are no rulers, coordinate labels, origin marker, or grid-snap behavior for furniture.

### 7.2 Panning

Dragging otherwise empty canvas pans the whole plan.

Panning is disabled while:

- A wall or furniture placement gesture is underway.
- Furniture is being dragged.
- A door is being dragged.
- A window is being dragged.
- A room is being dragged by its label.

The default empty-canvas cursor suggests movement. Placement modes use a crosshair. Selectable entities use pointer or grab-style feedback, and active dragging uses a grabbing cursor.

### 7.3 Zooming

The toolbar provides minus and plus buttons with a percentage display.

- Minus and plus change the zoom by a consistent, readily perceptible increment.
- Zoom is constrained to 10%–500%.
- The displayed percentage is rounded to a whole number.

Mouse-wheel or trackpad scrolling also zooms between the same limits. Wheel zoom is anchored around the current pointer location so that the point beneath the cursor remains visually stable.

### 7.4 Recenter View

**Recenter View** fits the plan's walls and furniture into the available canvas with visible padding.

- It may zoom out as needed.
- It does not zoom in past 100%.
- If no walls exist, it resets the view to a centered origin at 100%.

### 7.5 Selection and hover styling

- Walls have a neutral idle treatment and a clear accent treatment when hovered or selected.
- A selected wall group gives all its walls the selected treatment.
- A selected room highlights all of its member wall sequences and its label. Its effective interior receives a subtle translucent highlight.
- A room that is the current automatic-assignment candidate during a furniture drag receives the same interior highlight without changing the selection.
- Furniture has a visually distinct fill and readable contrasting text; selection adds a clear outline.
- Doors use a conventional rectangular opening/leaf plus a quarter-circle swing arc; selection uses the accent treatment.
- Windows appear as a narrow opening across the wall with two parallel lines and no swing arc; selection uses the accent treatment.
- Free wall endpoints expose clearly visible circular **+** controls when their wall is hovered or individually selected.
- Destructive buttons use clear destructive styling.
- Room labels are compact, readable badges positioned at the center of their calculated interiors. They remain horizontally readable regardless of surrounding wall angles.

Clicking truly empty canvas in Select mode clears the selection and closes the property card.

## 8. Wall workflows

### 8.1 Draw a disconnected wall

1. Click **Add Wall**.
2. The sidebar shows **Click on canvas to place a new wall** and the canvas cursor becomes a crosshair.
3. Click the desired start point.
4. A visible start marker appears.
5. Move the pointer. Show a dashed preview wall, an endpoint marker, and a floating length label.
6. Snap the preview direction to the nearest 45° increment.
7. Click the desired endpoint.
8. Create the wall as a new, independently movable wall sequence, select the wall, and return to Select mode.

The preview length is shown to one decimal place followed by `cm`.

The minimum accepted drawn wall length is 1 cm.

Completing a shorter gesture creates nothing, clears the preview, and returns to Select mode without an explanatory message.

### 8.2 Extend a wall from a free endpoint

When an individual wall is selected or hovered, show a circular **+** at each endpoint that does not already coincide with another wall endpoint.

Clicking a plus control should:

1. Select the source wall.
2. Enter Add Wall mode with the clicked endpoint already serving as the start point.
3. Show the normal snapped preview as the pointer moves.
4. Create the new segment attached to the beginning or end of the source sequence after one endpoint click.
5. Preserve the geometric location of all pre-existing walls in the sequence.
6. Select the new wall and return to Select mode.

The extension cannot continue straight ahead or directly backtrack along the source wall. Such a direction collapses to zero length and is rejected by the usual minimum-length rule. Angled extensions remain snapped to 45° increments.

An endpoint is considered unavailable when it is already essentially coincident with another wall endpoint, even if that other wall belongs to a different sequence. Selecting an entire wall sequence hides its endpoint extension controls.

Clicking the same endpoint control again while that exact endpoint extension is active cancels the extension and returns to Select mode.

### 8.3 Select an individual wall

Click a wall once to select that segment. Show the Wall property card and highlight the segment.

The card contains:

- A hint: **Click on this wall again to select all walls connected to it.**
- A **Length (cm)** numeric field.
- An **Angle (°)** field.
- **Delete Wall**.

Valid length changes are applied automatically after a brief pause or when the field loses focus. Changing a wall's length moves all later segments in the same sequence because each segment begins where its predecessor ends.

### 8.4 Select and move a connected wall sequence

Click an already-selected wall a second time to select all walls in its connected sequence.

The property card becomes **Wall Sequence** and says:

> Click and drag to move this group of walls as a unit.

All walls in the sequence highlight together. Dragging any part of the selected sequence moves the sequence, including doors and windows attached to its walls, without changing internal lengths or angles.

There are no group-level numeric position controls and no group delete button.

Even a sequence containing only one wall can be group-selected with the second click.

Holding Cmd on macOS or Ctrl on other platforms while clicking a wall sequence adds or removes that entire sequence from a wall-sequence multi-selection. Ordinary clicking replaces the current selection. Marquee selection is not provided.

When one or more complete wall sequences are selected, the contextual property card provides the applicable room-membership actions described in section 9.1. Direct dragging of a multi-selection is not required; whole-room movement uses the room label.

### 8.5 Edit wall angle

Display every wall angle in degrees. For a standalone wall that is not connected to another segment, the angle is editable. A valid numeric value applies automatically after a brief pause or when the field loses focus, and wraps using 360° arithmetic.

For a wall within a connected sequence, display the angle as read-only so that editing one segment cannot silently break the sequence's joints. Connected geometry is primarily established through the snapped drawing gesture.

Screen-direction conventions are:

- 0° points right.
- 90° points downward on the canvas.
- ±180° points left.
- −90° points upward.

### 8.6 Delete a wall

**Delete Wall** acts immediately without confirmation, clears the selection, and has topology-aware consequences:

- If it is the sequence's only wall, remove the whole sequence.
- If it is the first wall, the second wall becomes the first while the remaining visible geometry stays in place.
- If it is the last wall, truncate the sequence.
- If it is in the middle, split the remaining walls into two independently movable sequences, leaving a gap where the deleted wall was.
- If the original sequence belongs to a room, any surviving sequences produced by deletion remain members of that room.
- Delete every door attached to the deleted wall.
- Delete every window attached to the deleted wall.
- Keep doors on surviving walls attached to those walls.
- Keep windows on surviving walls attached to those walls.
- If deletion removes the last wall sequence in a room, dissolve that room and make its furniture Unassigned.

## 9. Room workflows

### 9.1 Define and edit a room

To create a room:

1. Select one wall sequence, then Cmd/Ctrl-click any additional sequences that should constitute the room.
2. Choose **Create Room from Selection** in the contextual property card.
3. Enter a required room name, such as **Living Room**.
4. Create the room, display its label at the center of its calculated interior, and select the room.
5. Assign any previously unassigned furniture whose center is inside the new room interior.

A wall sequence already assigned to another room cannot be included until it is removed from that room. The grouping UI clearly identifies such sequences rather than silently transferring them.

The contextual card for selected wall sequences offers actions according to their current membership:

- **Create Room from Selection** when all selected sequences are Unassigned.
- **Add to Room**, with a choice of existing rooms, when all selected sequences are Unassigned.
- **Remove from Room** when all selected sequences belong to the same room and removing them would leave that room with at least one sequence.

Adding or removing sequences immediately recalculates the room interior and repositions its label. It does not automatically change existing furniture memberships.

Clicking a room label selects the room and opens a **Room** property card containing:

- Editable **Name**.
- Read-only calculated **Width (cm)** and **Height (cm)**.
- **Dissolve Room**.

A room must retain at least one wall sequence. Removing its final sequence is rejected; use **Dissolve Room** instead. Dissolving removes the room identity, grouping, calculated interior, and label but preserves its walls, doors, windows, and furniture. Its furniture becomes Unassigned.

Dragging a room label moves the complete room as one unit:

- Move every member wall sequence by the same displacement.
- Move all doors and windows with their host walls.
- Move every furniture item assigned to the room by the same displacement.
- Keep the label centered in the translated room interior.
- Preserve all membership relationships and do not run automatic furniture reassignment during this group movement.

Dragging an individual member wall sequence still moves only that sequence and its doors and windows. The room interior and label update to its new bounding box, while existing furniture membership remains unchanged.

## 10. Door and window workflows

### 10.1 Add a door

1. Click **Add Door**.
2. The sidebar shows **Click on a wall to add a door to it**.
3. Click the desired host wall.
4. Create the door centered on the clicked position, clamped as necessary so its full width remains within the host wall.
5. Select the new door and return to Select mode.

Default width is the smaller of the wall length and 75 cm.

Multiple doors may be placed on the same wall.

### 10.2 Select and edit a door

Click a door to select it. The property card contains:

- **Offset (cm)**, measured from the host wall's logical start.
- **Width (cm)**.
- **Swap Hinge**.
- **Reverse Swing**.
- **Delete Door**.

Offset accepts numbers greater than or equal to zero. Width accepts numbers greater than zero. The combination must keep the complete door opening within the host wall. Numeric changes apply automatically after a brief pause or when the field loses focus.

**Swap Hinge** immediately moves the hinge between the two ends of the opening.

**Reverse Swing** immediately flips the swing arc to the opposite side of the wall.

The two controls are independent, producing all four hinge/swing orientations.

The door itself may also be clicked and dragged along the axis of its host wall to change its position, as described below.

### 10.3 Drag a door along its wall

Clicking and dragging the door itself repositions it along the axis of its host wall, even if the door was not already selected and without first using a property field.

- Project pointer movement onto the wall's direction.
- Prevent the door from moving before offset zero.
- Prevent it from moving beyond the wall's far end, based on its current width.
- Continuously show movement during the drag.
- Commit the resulting offset when released.

Dragging does not detach the door or move it to another wall.

### 10.4 Delete a door

**Delete Door** acts immediately without confirmation, removes only that door, clears the selection, and closes the property card.

Deleting the host wall also deletes the door automatically.

### 10.5 Add a window

1. Click **Add Window**.
2. The sidebar shows **Click on a wall to add a window to it**.
3. Click the desired host wall.
4. Create the window centered on the clicked position, clamped as necessary so its full width remains within the host wall.
5. Select the new window and return to Select mode.

Default width is the smaller of the wall length and 100 cm. Multiple windows may be placed on the same wall, and doors and windows may coexist on a wall.

### 10.6 Select and edit a window

Click a window to select it. The **Window** property card contains:

- **Offset (cm)**, measured from the host wall's logical start.
- **Width (cm)**.
- **Delete Window**.

Offset accepts numbers greater than or equal to zero. Width accepts numbers greater than zero. The combination must keep the complete window within the host wall. Numeric changes apply automatically after a brief pause or when the field loses focus.

Windows have no hinge, swing direction, height, sill height, opening style, or other architectural properties. Their purpose is only to show where windows occur along walls in the two-dimensional plan.

### 10.7 Drag a window along its wall

Clicking and dragging the window itself repositions it along the axis of its host wall, even if the window was not already selected.

- Project pointer movement onto the wall's direction.
- Prevent the window from moving before offset zero.
- Prevent it from moving beyond the wall's far end, based on its current width.
- Continuously show movement during the drag.
- Commit the resulting offset when released.

Dragging does not detach the window or move it to another wall.

### 10.8 Delete a window

**Delete Window** acts immediately without confirmation, removes only that window, clears the selection, and closes the property card.

Deleting the host wall also deletes the window automatically.

## 11. Furniture workflows

### 11.1 Draw furniture

1. Click **Add Furniture**.
2. The sidebar shows **Click on canvas to draw furniture bounding box**.
3. Click the first corner.
4. Show a visible start marker.
5. As the pointer moves, show a dashed rectangle with a light translucent fill.
6. Click the opposite corner.
7. Create a rectangular furniture item spanning those corners.
8. Name it **New Furniture**, give it 0° rotation, automatically determine its room assignment from its center point, select it, and return to Select mode.

The gesture works in any drag direction; the item is normalized to a positive width and height. If either dimension is zero, create nothing and clear the placement gesture.

After creation, focus the Name field and select **New Furniture** so the user can immediately type a real name.

### 11.2 Furniture rendering

- Render furniture as a solid, visually distinct rectangular footprint.
- Center the item's position on its rectangle.
- Rotate the rectangle around its center.
- Display the item's name in white, centered over it.
- Keep the text horizontally readable rather than rotating it with the rectangle.
- Use the selection accent for selection.

There is no furniture catalog or iconography; every item is a labeled rectangle.

### 11.3 Select, edit, and move furniture

The Furniture property card contains:

- **Name**.
- **Width (cm)**.
- **Height (cm)**.
- **Rotation (°)**.
- **Room**, offering **Unassigned** and every named room in the plan.
- **Delete Furniture**.

Name changes accept arbitrary text. Width and height must be greater than zero. Rotation accepts any number and wraps using 360° arithmetic. Changes apply automatically after a brief pause or when the field loses focus.

Furniture is directly draggable anywhere on the canvas. It does not snap to the grid, walls, or other furniture, and it does not participate in collision detection.

While furniture is dragged, highlight the room interior that would receive it if dropped. On drop, determine the assignment from the furniture center using the rules in section 3.1. Moving furniture from one room to another therefore transfers its room membership automatically; dropping it outside every room makes it Unassigned.

The **Room** field permits an explicit correction when overlapping or intentionally approximate room interiors produce an unwanted automatic result. Manually assigning a room does not reposition the furniture. A later direct furniture drag evaluates automatic assignment again.

There are no on-canvas resize handles or rotation handles; sizing and rotation are property-card operations.

### 11.4 Delete furniture

**Delete Furniture** acts immediately without confirmation, removes the item, clears the selection, and closes the property card.

## 12. Selection and interaction precedence

- Ordinarily, exactly one entity, room, or wall sequence is selected.
- Cmd-click on macOS and Ctrl-click elsewhere can add or remove complete wall sequences from a multi-selection for room definition and membership editing.
- Multi-selection does not apply to individual walls, doors, windows, furniture, or rooms.
- Selecting a different entity replaces the previous selection.
- Clicking empty canvas in Select mode clears the selection.
- A property card only appears when its selected object still exists.
- Hover feedback does not change the saved plan.
- Clicking a wall in Add Door mode adds a door rather than selecting the wall.
- Clicking a door, window, or furniture item while Add Door mode is active cancels door placement and selects that entity.
- Clicking empty canvas while Add Door mode is active cancels the tool and clears the selection.
- Clicking a wall in Add Window mode adds a window rather than selecting the wall.
- Clicking a door, window, or furniture item while Add Window mode is active cancels window placement and selects that entity.
- Clicking empty canvas while Add Window mode is active cancels the tool and clears the selection.
- Furniture, doors, and windows are draggable directly; wall segments become draggable only as part of an explicitly group-selected wall sequence.
- Room labels are draggable whole-room handles. Dragging a room label takes precedence over selecting or panning content beneath the label.
- Individual wall endpoints are not draggable.

The app does not support marquee selection, arbitrary mixed-object multi-selection, ad hoc furniture grouping, locking entities, layer ordering, duplication, copy/paste, or keyboard deletion.

## 13. Automatic property updates and validation

Property fields do not have Save or Apply buttons.

- Valid changes apply automatically after a brief pause or when the field loses focus.
- Empty, non-numeric, or out-of-range numeric values are not committed to the plan.
- On leaving an invalid field, restore its last accepted value.
- Changes to separate fields must be preserved independently, even when made in rapid succession.

Validation and import failures provide clear blocking feedback. Ordinary successful drawing, dragging, editing, and local persistence do not interrupt the user with transient messages.

## 14. File operations

### 14.1 Export JSON

**File → Export JSON** downloads a human-readable JSON representation of the current plan. The filename follows:

> room-plan-{timestamp}.json

The exported plan preserves:

- Plan name.
- Room names, member wall-sequence relationships, and furniture memberships.
- Wall sequences, their placement, and each wall's geometry.
- Doors and their host-wall relationship, offset, width, and swing orientation.
- Windows and their host-wall relationship, offset, and width.
- Furniture names, positions, dimensions, and rotation.

It does not preserve selection, active tool, unfinished placement gestures, or viewport pan/zoom.

Disable Export when no plan exists.

### 14.2 Import JSON

**File → Import JSON** opens a file chooser restricted to `.json` files.

For a valid room-plan file:

- If the current plan contains any entities, ask for confirmation before replacing it. Cancelling preserves the current plan and leaves the import unapplied.
- If the current plan is empty, replace it without an additional confirmation.
- Retain it locally as the new current plan.
- Cancel any unfinished placement gesture, return to Select mode, and clear the selection.
- Confirm that the plan was imported successfully.

For parseable JSON that does not resemble a room plan, provide clear invalid-file feedback.

For invalid JSON, provide clear invalid-JSON feedback.

Reject files containing invalid entity values or broken relationships rather than partially importing them. Room interiors are recalculated from imported wall geometry rather than treated as authoritative saved geometry.

Import does not automatically recenter the view. The user can choose **Recenter View** afterward.

### 14.3 Confirmation behavior

- Starting from scratch requires confirmation.
- Importing over a non-empty current plan requires confirmation.
- Deleting individual walls, doors, windows, and furniture does not require confirmation.
- Undo restores individual accepted plan edits made during the current editing session. Manual export remains the durable recovery path across sessions.

## 15. Measurement conventions

All linear dimensions, offsets, positions, and grid intervals are measured and displayed in centimeters. The app has no unit selector or alternative unit mode.

- Property labels for lengths, widths, heights, and offsets use `cm`.
- Wall preview lengths use one decimal place followed by `cm`.
- Grid spacing is 25 cm.
- Default maximum door width is 75 cm.
- Default maximum window width is 100 cm.
- Minimum drawn wall length is 1 cm.
- Angular measurements and rotations use degrees, shown with `°`.

## 16. Responsive and input expectations

- The layout is desktop-first: fixed top toolbar, fixed-width sidebar, large canvas, and floating property card.
- The canvas responds to browser resizing.
- Core canvas entities recognize both click and tap events, but the surrounding layout is not optimized for a narrow phone viewport.
- Dragging, wheel/trackpad zoom, and precise canvas placement assume a pointer-capable device.
- Toolbar controls, sidebar controls, modal dialogs, and property fields support ordinary keyboard focus, clear labels, and accessible names. Full keyboard manipulation of canvas geometry is not required.

## 17. Intentional product boundaries and absent capabilities

The following capabilities are outside the product's scope unless explicitly added:

- Multiple saved plans or a project browser.
- Accounts, cloud sync, sharing, or collaboration.
- 3D rendering or elevation views.
- Stairs, columns, plumbing, or other architectural objects beyond walls, doors, and reference windows.
- Wall thickness, height, materials, or finishes as editable properties.
- Furniture catalog, imagery, pricing, or shopping features.
- Object collision detection or automatic layout recommendations.
- Grid snapping, alignment guides, rulers, or dimension annotations.
- Door/window collision checks or automatic conflict resolution.
- Joining or welding separately drawn wall sequences.
- Polygon-based room recognition, wall-closure validation, or architectural floor-area calculations.
- Copy, paste, duplicate, arbitrary mixed-object multi-selection, alignment, or distribution.
- On-canvas resize/rotation handles.
- PDF or image export.
- Print layout.
- Independent repositioning of room labels; labels serve as whole-room drag handles.

## 18. Acceptance scenarios

The following scenarios provide a compact functional test suite.

### Scenario A — Create a plan

1. Open with no saved plan.
2. Enter `Main Floor` and submit.
3. Verify an empty centered canvas and the plan name.
4. Use **Add Wall** to draw a horizontal wall; verify it is selected.
5. Reload and verify the plan returns.

### Scenario B — Draw and select walls

1. Add a disconnected wall with two clicks.
2. Confirm the preview snaps to a 45° direction and shows live length.
3. Select a wall once and edit its length.
4. Click it again and drag its whole sequence.
5. Verify any attached doors move with it.

### Scenario C — Extend and split a wall sequence

1. Use a free-endpoint plus to add two connected walls.
2. Verify the old geometry remains stable and the new wall is selected.
3. Delete the middle wall.
4. Verify two independent wall sequences remain with a gap.

### Scenario D — Add and manipulate a door

1. Enter Add Door mode and click a long wall near its middle.
2. Verify the 75 cm door is centered at the click position, subject to end-of-wall clamping.
3. Click and drag the door itself toward the far end; verify it moves only along the wall's axis and remains fully within the wall.
4. Exercise Swap Hinge and Reverse Swing to reach four orientations.
5. Delete the host wall and verify the door disappears.

### Scenario E — Add and manipulate furniture

1. Enter Add Furniture mode.
2. Click two opposite corners and observe the live dashed preview.
3. Verify **New Furniture** is created and its name is ready to replace.
4. Set name, width, height, and rotation; verify all changes persist.
5. Drag the item elsewhere without snapping.
6. If rooms exist, verify its center-point location determines its assignment and the candidate room highlights during dragging.
7. Delete it and verify it disappears and its property card closes.

### Scenario F — Navigate the canvas

1. Pan by dragging empty canvas.
2. Zoom with the wheel around the pointer.
3. Use minus and plus to reach but not exceed 10% and 500%.
4. Choose Recenter View and verify all visible content fits with padding without zooming above 100%.
5. Reload and verify viewport restoration.

### Scenario G — File round trip

1. Build a plan containing multiple named rooms, member wall sequences, doors with flipped swing settings, windows, assigned furniture, and rotated furniture.
2. Export JSON.
3. Start from scratch and create a throwaway plan.
4. Import the exported file.
5. Verify that replacement confirmation appears; cancel it and verify the throwaway plan remains.
6. Import again and confirm replacement.
7. Verify plan and room names, geometry, room memberships, door relationships/orientations, window relationships, and furniture return.
8. Verify selection, viewport, and prior undo/redo history are not part of the imported plan data.

### Scenario H — Tool cancellation

1. Start drawing a wall, switch to Add Furniture, and verify the wall preview clears.
2. Start drawing furniture, toggle Add Furniture off, and verify the preview clears.
3. Enter Add Door and click empty canvas; verify the tool exits and selection clears.
4. Enter Add Window and click empty canvas; verify the tool exits and selection clears.
5. Start a wall or furniture gesture, press Escape, and verify the preview clears without creating anything.
6. Finish a wall below the minimum length; verify nothing is created and Select mode resumes.

### Scenario I — Define and move a room

1. Draw two disconnected wall sequences without closing either sequence into a loop.
2. Select the first sequence, then Cmd/Ctrl-click the second.
3. Verify **Define Room** becomes enabled, choose it, name the room `Living Room`, and verify a centered label and rectangular interior highlight.
4. Verify the room interior is the smallest axis-aligned bounding box containing both sequences.
5. Add a door and a window to member walls, and add furniture inside the room interior.
6. Drag the room label and verify both sequences, the door, the window, the assigned furniture, and the label move by the same displacement.
7. Verify no closed-wall validation or warning appears.

### Scenario J — Transfer furniture between rooms

1. Create two named rooms with non-overlapping calculated interiors.
2. Create furniture inside the first room and verify it is assigned there.
3. Drag it into the second room; verify the second room highlights and receives the item on drop.
4. Drag it outside both rooms and verify it becomes Unassigned.
5. Create overlapping room interiors, drop unassigned furniture in the overlap, and verify the smallest qualifying room receives it.
6. Manually change the furniture's **Room** field and verify the item does not move.

### Scenario K — Add and manipulate a window

1. Enter Add Window mode and click a wall longer than 100 cm.
2. Verify a 100 cm window is centered at the click position and rendered without a hinge or swing arc.
3. Click and drag the window itself; verify it moves only along the wall's axis and remains fully within the wall.
4. Edit its offset and width and verify both changes apply.
5. Move the wall sequence and verify the window follows its host wall.
6. Delete the host wall and verify the window disappears.

### Scenario L — Undo and redo

1. Draw a wall, add a door, and move the door along its wall.
2. Undo repeatedly and verify the movement, door creation, and wall creation are reversed one accepted edit at a time.
3. Redo those edits and verify they are restored in order.
4. Undo once, then make a different edit; verify Redo becomes unavailable.
5. Start from scratch or import a different plan and verify the prior undo/redo history is unavailable.

The essential product character is a low-friction visual editor: create geometry directly on the canvas, make precise corrections in a small contextual property card, and have every accepted change persist locally without an explicit save workflow.
