## room planner

A web app to make it easy to plan the layout of furniture in your home.

## Features

- Draw walls to create room layouts using a linked-list structure
- Add doors to walls with customizable offset and width
- Place and drag furniture with precise dimensions
- Support for both metric (cm) and imperial (feet/inches) units
- Import/Export floor plans as JSON files
- Pan and zoom canvas for easy navigation
- Minimalist, architect-style interface

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Then open your browser to the URL shown in the terminal (usually http://localhost:5173).

### Build for Production

```bash
npm run build
```

## Usage

### Adding Walls

1. Enter a wall length (e.g., "300cm" or "10'")
2. Set the angle using the rotation buttons or enter manually
3. Click "Add Wall"
4. For connected walls, select the endpoint of an existing wall first

### Adding Doors

1. Select a wall by clicking on it
2. Enter the offset from the wall's start point
3. Enter the door width
4. Click "Add Door"

### Adding Furniture

1. Enter a name for the furniture
2. Enter width and height dimensions
3. Click "Add Furniture"
4. Drag the furniture to position it in the room

### Import/Export

- Use "Export JSON" to save your floor plan
- Use "Import JSON" to load a previously saved floor plan

## Technical Details

- Built with React, TypeScript, and Vite
- Canvas-based rendering for high performance
- Walls form a linked list with the origin wall at (0, 0)
- All dimensions stored with their original units
- Context-based state management

