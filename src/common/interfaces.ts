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
