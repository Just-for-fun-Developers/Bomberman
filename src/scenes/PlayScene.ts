import Phaser from "phaser";
import { io } from "socket.io-client";

enum CellType {
  Blocked = "BLOCKED",
  Free = "FREE",
  Occupied = "OCCUPIED",
  Player = "PLAYER",
}

class PlayScene extends Phaser.Scene {
  maze: CellType[][] = [];
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  toys: Phaser.Physics.Arcade.Group;
  blocks: Phaser.Physics.Arcade.Group;
  isMoving: boolean;
  socket: any;
  constructor() {
    super("PlayScene");
    this.isMoving = false;
  }

  create() {
    this.socket = io("http://localhost:3000");

    this.createBG();
    this.createMaze(10, 10, 30, 6);
    this.createPlayer();
    this.animatePlayer();
  }

  update() {
    this.playerInteraction();
  }

  createMaze(rows: number, columns: number, occupied: number, toys: number) {
    this.maze = new Array(rows);

    for (let row = 0; row < rows; row++) {
      this.maze[row] = new Array(columns).fill(CellType.Free);
    }
    //To reserve the player position
    this.maze[0][0] = CellType.Player;

    // To fill occupied cells
    while (occupied > 0) {
      let randomValue = Phaser.Math.Between(0, rows * columns - 1);
      const row = Math.floor(randomValue / rows);
      const col = Math.floor(randomValue % columns);
      if (this.maze[row][col] === CellType.Free) {
        this.maze[row][col] = CellType.Blocked;
        occupied--;
      }
    }

    // To fill objects to collect
    while (toys > 0) {
      let randomValue = Phaser.Math.Between(0, rows * columns - 1);
      const row = Math.floor(randomValue / rows);
      const col = Math.floor(randomValue % columns);
      if (this.maze[row][col] === CellType.Free) {
        this.maze[row][col] = CellType.Occupied;
        toys--;
      }
    }
    this.blocks = this.physics.add.group();
    this.toys = this.physics.add.group();
    this.maze.forEach((row, indexRow) => {
      row.forEach((cell, indexCol) => {
        if (this.getCell(cell) == "toy") {
          this.toys
            .create(indexCol * 64 + 64, indexRow * 64 + 64, "toy")
            .setImmovable(true)
            .setOrigin(0, 0)
            .setScale(this.getScale(cell));
        } else if (this.getCell(cell) == "wood_cell") {
          this.blocks
            .create(indexCol * 64 + 64, indexRow * 64 + 64, this.getCell(cell))
            .setImmovable(true)
            .setOrigin(0.0)
            .setScale(this.getScale(cell));
        }
      });
    });
    //to build the borders of the maze
    for (let i = 0; i < columns + 2; i++) {
      this.blocks
        .create(i * 64, 0, "wood_cell")
        .setImmovable(true)
        .setOrigin(0.0)
        .setScale(1 / 32);
      this.blocks
        .create(i * 64, (rows + 1) * 64, "wood_cell")
        .setImmovable(true)
        .setOrigin(0.0)
        .setScale(1 / 32);
    }
    for (let i = 1; i < rows + 1; i++) {
      this.blocks
        .create(0, i * 64, "wood_cell")
        .setImmovable(true)
        .setOrigin(0.0)
        .setScale(1 / 32);
      this.blocks
        .create((rows + 1) * 64, i * 64, "wood_cell")
        .setImmovable(true)
        .setOrigin(0.0)
        .setScale(1 / 32);
    }
  }

  // NOTE: check resolutions from the preloaded jpg
  //       files to understand this part
  getScale(cell: CellType) {
    return cell === CellType.Occupied ? 1 / 16 : 1 / 32;
  }

  getCell(cell: CellType) {
    if (cell === CellType.Blocked) {
      return "wood_cell";
    } else if (cell === CellType.Occupied) {
      return "toy";
    }
  }
  createBG() {
    this.add
      .image(0, 0, "cloud_bg")
      .setOrigin(0, 0)
      .setScale(1 / 2);
  }

  createPlayer() {
    this.player = this.physics.add
      .sprite(64, 64, "player")
      .setScale(2)
      .setOrigin(0, 0);
    this.player.body.gravity.y = 0;
    this.player.setCollideWorldBounds(true);

    //collider with blocks
    this.physics.add.collider(this.player, this.blocks);
    this.physics.add.overlap(
      this.player,
      this.toys,
      this.collectToy,
      null,
      this
    );
  }

  animatePlayer() {
    this.anims.create({
      key: "walk_right",
      frames: this.anims.generateFrameNumbers("player", { start: 6, end: 11 }),
      frameRate: 16,
      repeat: -1,
    });
    this.anims.create({
      key: "walk_left",
      frames: this.anims.generateFrameNumbers("player", { start: 18, end: 23 }),
      frameRate: 16,
      repeat: -1,
    });
    this.anims.create({
      key: "walk_up",
      frames: this.anims.generateFrameNumbers("player", { start: 12, end: 17 }),
      frameRate: 16,
      repeat: -1,
    });
    this.anims.create({
      key: "walk_down",
      frames: this.anims.generateFrameNumbers("player", { start: 0, end: 5 }),
      frameRate: 16,
      repeat: -1,
    });
    this.anims.create({
      key: "turn",
      frames: [{ key: "player", frame: 0 }],
      frameRate: 20,
    });
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  playerInteraction() {
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.anims.play("walk_left", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
      this.player.anims.play("walk_right", true);
    } else if (this.cursors.up.isDown) {
      this.player.setVelocityY(-160);
      this.player.anims.play("walk_up", true);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(160);
      this.player.anims.play("walk_down", true);
    } else {
      this.player.setVelocityX(0);
      this.player.setVelocityY(0);
      this.player.anims.play("turn");
    }
  }

  collectToy(
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    toy: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  ) {
    toy.disableBody(true, true);
  }
}

export default PlayScene;
