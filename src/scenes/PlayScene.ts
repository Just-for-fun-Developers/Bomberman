import Phaser from "phaser";

enum CellType {
  Blocked = "BLOCKED",
  Free = "FREE",
  Occupied = "OCCUPIED",
}

class PlayScene extends Phaser.Scene {
  maze: CellType[][] = [];

  constructor() {
    super("PlayScene");
    // TODO: Add enum for the type of cells
    // TODO: Add function to create a 2D matrix dinamically
    //       passing n, m, x
    // Example of maze
    // this.maze = [
    //   [CellType.Blocked, CellType.Blocked, CellType.Free, CellType.Free],
    //   [CellType.Blocked, CellType.Free, CellType.Free, CellType.Blocked],
    //   [CellType.Free, CellType.Free, CellType.Blocked, CellType.Blocked],
    // ];
    this.createMaze(9, 9, 30, 5);
  }

  createMaze(rows: number, columns: number, occupied: number, toys: number) {
    this.maze = new Array(rows);

    for (let row = 0; row < rows; row++) {
      this.maze[row] = new Array(columns).fill(CellType.Free);
    }

    // To fill occupied cells
    while (occupied > 0) {
      let randomValue = Phaser.Math.Between(0, rows * columns - 1);
      const row = Math.floor(randomValue / columns);
      const col = Math.floor(randomValue % columns);
      if (this.maze[row][col] === CellType.Free) {
        this.maze[row][col] = CellType.Blocked;
        occupied--;
      }
    }

    // To fill objects to collect
    while (toys > 0) {
      let randomValue = Phaser.Math.Between(0, rows * columns - 1);
      const row = Math.floor(randomValue / columns);
      const col = Math.floor(randomValue % columns);
      if (this.maze[row][col] === CellType.Free) {
        this.maze[row][col] = CellType.Occupied;
        toys--;
      }
    }
  }

  create() {
    this.maze.forEach((row, indexRow) => {
      row.forEach((cell, indexCol) => {
        this.add
          .sprite(indexCol * 64, indexRow * 64, this.getCell(cell))
          .setOrigin(0.0)
          .setScale(this.getScale(cell));
      });
    });
  }

  // NOTE: check resolutions from the preloaded jpg
  //       files to understand this part
  getScale(cell: CellType) {
    return cell === CellType.Occupied ? 1 / 16 : 1 / 32;
  }

  getCell(cell: CellType) {
    if (cell === CellType.Blocked) {
      return "wood_cell";
    } else if (cell === CellType.Free) {
      return "cloud_cell";
    } else {
      return "toy";
    }
  }
}

export default PlayScene;
