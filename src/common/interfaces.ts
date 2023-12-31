export interface Maze {
  data: number[][];
  columns: number;
  rows: number;
}

export interface PlayerInfo {
  x: number;
  y: number;
  playerId: string;
  color: string;
  lifes: number;
  name: string;
}

export const directions = [
  { x: -1, y: 0, name: "Left" },
  { x: 1, y: 0, name: "Right" },
  { x: 0, y: 1, name: "Down" },
  { x: 0, y: -1, name: "Up" },
];

export interface Menu {
  scene: string;
  text: string;
  textGO?: Phaser.GameObjects.Text;
}
