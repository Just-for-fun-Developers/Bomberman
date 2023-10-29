import Phaser from "phaser";
import { io, Socket } from "socket.io-client";
import { Maze, PlayerInfo } from "../common/interfaces";

class PlayScene extends Phaser.Scene {
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  toys: Phaser.Physics.Arcade.Group;
  blocks: Phaser.Physics.Arcade.Group;
  otherPlayers: Phaser.Physics.Arcade.Group;
  isMoving: boolean;
  socket: Socket;

  constructor() {
    super("PlayScene");
    this.isMoving = false;
  }

  create() {
    this.socket = io("http://localhost:3000");
    this.otherPlayers = this.physics.add.group();
    this.showPlayers();
    this.createBG();
    this.createMazeBySocket(5);
    this.createOtherPlayer();
    this.animateBomb();
    this.animatePlayer();
    this.detectPlayerMovement();
    this.detectDisconnectedPlayer();

    this.bombInteraction();
    this.bombActivated();
  }

  update() {
    this.playerInteraction();
  }

  createMazeBySocket(toys: number) {
    this.blocks = this.physics.add.group();
    this.toys = this.physics.add.group();
    this.socket.on("game_maze", (game_maze: Maze) => {
      for (let row = 0; row < game_maze.rows; row++) {
        for (let col = 0; col < game_maze.columns; col++) {
          const cellValue = game_maze.data[row][col];
          if (cellValue === 1) {
            this.blocks
              .create(col * 64 + 64, row * 64 + 64, "wood_cell")
              .setImmovable(true)
              .setOrigin(0.0)
              .setScale(1 / 32);
          }
        }
      }
      while (toys > 0) {
        let randomValue = Phaser.Math.Between(
          0,
          game_maze.rows * game_maze.columns - 1
        );
        const row = Math.floor(randomValue / game_maze.rows);
        const col = Math.floor(randomValue % game_maze.columns);
        const cellValue2 = game_maze.data[row][col];
        if (cellValue2 === 0) {
          this.toys
            .create(col * 64 + 64, row * 64 + 64, "toy")
            .setImmovable(true)
            .setOrigin(0, 0)
            .setScale(1 / 16);
          toys--;
        }
      }
      //to build the borders of the maze
      for (let i = 0; i < game_maze.columns + 2; i++) {
        this.blocks
          .create(i * 64, 0, "wood_cell")
          .setImmovable(true)
          .setOrigin(0.0)
          .setScale(1 / 32);
        this.blocks
          .create(i * 64, (game_maze.rows + 1) * 64, "wood_cell")
          .setImmovable(true)
          .setOrigin(0.0)
          .setScale(1 / 32);
      }
      for (let i = 1; i < game_maze.rows + 1; i++) {
        this.blocks
          .create(0, i * 64, "wood_cell")
          .setImmovable(true)
          .setOrigin(0.0)
          .setScale(1 / 32);
        this.blocks
          .create((game_maze.rows + 1) * 64, i * 64, "wood_cell")
          .setImmovable(true)
          .setOrigin(0.0)
          .setScale(1 / 32);
      }
    });
  }

  createBG() {
    this.add
      .image(0, 0, "cloud_bg")
      .setOrigin(0, 0)
      .setScale(1 / 2);
  }

  createPlayer(playerInfo: PlayerInfo) {
    this.player = this.physics.add
      .sprite(playerInfo.x, playerInfo.y, "player")
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

  animateBomb() {
    this.anims.create({
      key: "explode",
      frames: "explosion",
      frameRate: 30,
      /* repeat: -1,
      repeatDelay: 2000
 */
    });
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

  bombActivated() {
    this.socket.on("bomb_activated", (bomb: { x: number; y: number }) => {
      const bombSprite = this.add.sprite(bomb.x, bomb.y, "bomb").setScale(2.5);

      let explosions = this.physics.add.group();

      // Capture the time before the delayedCall
      const startTime = new Date().getTime();

      console.log("Time before delayedCall:", startTime);

      this.time.delayedCall(2000, () => {
        // Capture the time inside the callback
        const endTime = new Date().getTime();

        console.log("Time inside callback:", endTime);
        console.log("Time spent:", endTime - startTime, "milliseconds");

        bombSprite.destroy();
        for (let i = 0; i < 3; i++) {
          const explosion1 = explosions.create(
            bomb.x + 64 * i,
            bomb.y,
            "explosion"
          );
          explosion1.anims.play("explode");
          const explosion2 = explosions.create(
            bomb.x - 64 * i,
            bomb.y,
            "explosion"
          );
          explosion2.anims.play("explode");
          const explosion3 = explosions.create(
            bomb.x,
            bomb.y + 64 * i,
            "explosion"
          );
          explosion3.anims.play("explode");
          const explosion4 = explosions.create(
            bomb.x,
            bomb.y - 64 * i,
            "explosion"
          );
          explosion4.anims.play("explode");
        }
      });
      /* this.time.delayedCall(1000, () => {
        explosions.destroy();
      }) */
    });
  }

  bombInteraction() {
    this.input.keyboard.on("keydown-SPACE", () => {
      this.socket.emit("bomb_activated", {
        x: this.player.x + 32,
        y: this.player.y + 32,
      });
    });
  }

  playerInteraction() {
    if (this.player) {
      let action = "turn";
      if (this.cursors.left.isDown) {
        action = "walk_left";
        this.player.setVelocityX(-160);
      } else if (this.cursors.right.isDown) {
        action = "walk_right";
        this.player.setVelocityX(160);
      } else if (this.cursors.up.isDown) {
        action = "walk_up";
        this.player.setVelocityY(-160);
      } else if (this.cursors.down.isDown) {
        action = "walk_down";
        this.player.setVelocityY(160);
      } else {
        this.player.setVelocityX(0);
        this.player.setVelocityY(0);
      }

      this.player.anims.play(action, true);
      // emit player movement
      let x = this.player.x;
      let y = this.player.y;
      if (this.player.getData("oldPosition")) {
        const oldPosition = this.player.getData("oldPosition");
        if (x !== oldPosition.x || y !== oldPosition.y) {
          console.log("enter!");
          this.socket.emit("playerMovement", {
            x: this.player.x,
            y: this.player.y,
            action: action,
          });
        } else {
          this.socket.emit("playerMovement", {
            x: this.player.x,
            y: this.player.y,
            action: action,
          });
        }
      }
      // save old position data
      this.player.setData("oldPosition", {
        x: this.player.x,
        y: this.player.y,
      });
    }
  }

  collectToy(
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    toy: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  ) {
    toy.disableBody(true, true);
  }

  createOtherPlayer() {
    this.socket.on("newPlayer", (playerInfo: PlayerInfo) => {
      this.addOtherPlayers(playerInfo);
    });
  }

  addOtherPlayers(playerInfo: PlayerInfo) {
    const otherPlayer = this.physics.add
      .sprite(playerInfo.x, playerInfo.y, "otherPlayer")
      .setOrigin(0, 0)
      .setScale(2);
    otherPlayer.setTint(0xff0000);

    otherPlayer.setData("playerId", playerInfo.playerId);
    this.otherPlayers.add(otherPlayer);
  }
  showPlayers() {
    this.socket.on(
      "currentPlayers",
      (players: { [key: string]: PlayerInfo }) => {
        Object.keys(players).forEach((id) => {
          if (players[id].playerId === this.socket.id) {
            this.createPlayer(players[id]);
          } else {
            this.addOtherPlayers(players[id]);
          }
        });
      }
    );
  }

  detectPlayerMovement() {
    this.socket.on(
      "playerMoved",
      (playerInfo: { player: PlayerInfo; action: string }) => {
        this.otherPlayers
          .getChildren()
          .forEach((otherPlayer: Phaser.Physics.Arcade.Sprite) => {
            const OtherPlayerId = otherPlayer.getData("playerId");
            if (playerInfo.player.playerId === OtherPlayerId) {
              if (otherPlayer) {
                const action = playerInfo.action;
                otherPlayer.setPosition(
                  playerInfo.player.x,
                  playerInfo.player.y
                );
                if (action === "walk_left") {
                  otherPlayer.anims.play("walk_left", true);
                } else if (action === "walk_right") {
                  otherPlayer.anims.play("walk_right", true);
                } else if (action === "walk_up") {
                  otherPlayer.anims.play("walk_up", true);
                } else if (action === "walk_down") {
                  otherPlayer.anims.play("walk_down", true);
                } else {
                  otherPlayer.anims.play("turn");
                }
              }
            }
          });
      }
    );
  }

  detectDisconnectedPlayer() {
    this.socket.on("disconnect_player", (playerId: string) => {
      this.otherPlayers
        .getChildren()
        .forEach((otherPlayer: Phaser.Physics.Arcade.Sprite) => {
          const OtherPlayerId = otherPlayer.getData("playerId");
          if (playerId === OtherPlayerId) {
            otherPlayer.destroy();
          }
        });
    });
  }
}

export default PlayScene;
