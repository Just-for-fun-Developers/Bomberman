export interface Maze {
  data: number[][];
  columns: number;
  rows: number;
}

export interface PlayerInfo {
  x: number;
  y: number;
  playerId: string;
}

export const directions = [
  { x: -1, y: 0, name: "Left" },
  { x: 1, y: 0, name: "Right" },
  { x: 0, y: 1, name: "Down" },
  { x: 0, y: -1, name: "Up" },
];
