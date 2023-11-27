import Phaser from "phaser";
import { io, Socket } from "socket.io-client";
import { directions, Maze, PlayerInfo } from "../common/interfaces";

class PlayScene extends Phaser.Scene {
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  toys: Phaser.Physics.Arcade.Group;
  blocks: Phaser.Physics.Arcade.Group;
  otherPlayers: Phaser.Physics.Arcade.Group;
  scoreTexts: Phaser.GameObjects.Group;
  isMoving: boolean;
  player_dead: boolean;
  amAlive: boolean;
  socket: Socket;
  playerName: String;

  constructor() {
    super("PlayScene");
    this.isMoving = false;
  }

  init(data:{playerName:string}){
    this.playerName = data.playerName;
  }

  create() {
    // For production
    this.socket = io(`${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`);
    // For Dev
    //this.socket = io('localhost:3000');
    this.socket.emit('initPlayer', this.playerName);
    this.otherPlayers = this.physics.add.group();
    this.scoreTexts = this.add.group();
    this.showPlayers();
    this.createBG();
    this.createMazeBySocket();
    this.createOtherPlayer();
    this.animateWallDestruction();
    this.animateBomb();
    this.animatePlayer();
    this.detectPlayerMovement();
    this.detectDisconnectedPlayer();

    this.bombActivated();
    this.bombInteraction();

    this.rewriteScore();
  }

  update() {
    this.playerInteraction();
  }

  createMazeBySocket() {
    this.blocks = this.physics.add.group();
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

  createToys(toys: number, game_maze: Maze) {
    this.toys = this.physics.add.group();
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
  }

  createBG() {
    this.add
      .image(0, 0, "cloud_bg")
      .setOrigin(0, 0)
      .setScale(1 / 2);
  }

  createPlayer(playerInfo: PlayerInfo) {
    this.amAlive = true;
    this.player = this.physics.add
      .sprite(playerInfo.x, playerInfo.y, "player")
      .setScale(2)
      .setOrigin(0, 0);
    this.player.setBodySize(this.player.width - 15, this.player.height - 5);
    this.player.body.gravity.y = 0;
    this.player.setCollideWorldBounds(true);
    this.player.setData("x_start", playerInfo.x);
    this.player.setData("y_start", playerInfo.y);
    this.player.setData("playerId", playerInfo.playerId);
    this.player.setTint(parseInt(playerInfo.color, 16));
    this.player.setDepth(1);
    //collider with blocks
    this.physics.add.collider(this.player, this.blocks);
    this.physics.add.overlap(
      this.player,
      this.toys,
      this.collectToy,
      null,
      this
    );
    this.player_dead = false;

    let scoreText = this.add.text(800, 20, `${playerInfo.name}: ${playerInfo.lifes}`, {
      fontSize: "32px",
      color: "#000",
    });
    scoreText.setVisible(false);
    scoreText.setData("playerId", playerInfo.playerId);
    scoreText.setStyle({ color: "#" + playerInfo.color.substring(2) });
    this.scoreTexts.add(scoreText);
    this.printTextScores();
  }

  animateBomb() {
    this.anims.create({
      key: "explode",
      frames: "explosion",
      frameRate: 30,
    });
  }

  animateWallDestruction() {
    this.anims.create({
      key: "wall_destroy",
      frames: this.anims.generateFrameNumbers("wall_destroyed", {
        start: 0,
        end: 14,
      }),
      frameRate: 16,
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
    this.anims.create({
      key: "die",
      frames: this.anims.generateFrameNumbers("player", { start: 24, end: 29 }),
      frameRate: 16,
    });

    this.cursors = this.input.keyboard.createCursorKeys();
  }

  checkOverlapWithBlocksAt(x: number, y: number) {
    // Create a small temporary sprite at the position
    let tempSprite = this.physics.add
      .sprite(x, y, null)
      .setSize(1, 1)
      .setOrigin(0, 0);

    // Check overlap
    let isOverlapping = false;
    this.physics.overlap(tempSprite, this.blocks, () => {
      isOverlapping = true;
    });

    // Destroy the temporary sprite
    tempSprite.destroy();

    return isOverlapping;
  }

  bombActivated() {
    this.socket.on("bomb_activated", (bomb: { x: number; y: number }) => {
      let explosions = this.physics.add.group();
      const bombSprite = this.add.sprite(bomb.x, bomb.y, "bomb").setScale(2.5);
      this.time.delayedCall(2000, () => {
        bombSprite.destroy();
        const aux = this.player.getData("playerId");

        for (let direction of directions) {
          for (let i = 0; i < 3; i++) {
            const newX = bombSprite.x + 64 * i * direction.x;
            const newY = bombSprite.y + 64 * i * direction.y;
            if (!this.checkOverlapWithBlocksAt(newX, newY)) {
              let explotion = explosions
                .create(newX, newY, "explosion")
                .anims.play("explode");

              // Delete sprites after animation finish
              explotion.on("animationcomplete", () => {
                explotion.destroy();
              });
            } else {
              let explotion = explosions
                .create(newX, newY, "explosion")
                .anims.play("explode");

              // Delete sprites after animation finish
              explotion.on("animationcomplete", () => {
                explotion.destroy();
              });
              break;
            }
          }
        }
      });
      
      // Set up overlap check between explosions and player
      let playerHit = false;
      this.physics.add.overlap(
        this.player,
        explosions,
        (player, explosion) => {
          if (!playerHit) {
            this.playerHitByExplosion(player, explosion);
            playerHit = true;
            this.time.delayedCall(1000, () => {
              playerHit = false;
            });
          }
        },
        null,
        this
      );
      this.physics.add.overlap(
        explosions,
        this.blocks,
        this.destroyWall,
        null,
        this
      );
    });
  }

  playerHitByExplosion(player: any, explosion: any) {
    this.player_dead = true;
    player.setVelocity(0, 0);
    player.anims.play("die");

    if (this.amAlive) {
      this.time.delayedCall(3000, () => {
        player.setAlpha(1);
        this.player_dead = false;
        const startPositionX = player.getData("x_start");
        const startPositionY = player.getData("y_start");
        player.enableBody(true, startPositionX, startPositionY, true, true);
      });
    }

    this.socket.emit("playerMovement", {
      x: this.player.x,
      y: this.player.y,
      action: "die",
    });
    this.socket.emit("updateScore", {});
  }

  rewriteScore() {
    this.socket.on("changeScore", (playerInfo: { player: PlayerInfo }) => {
      const player_Id = this.player.getData("playerId");
      if (
        playerInfo.player.lifes === 1 &&
        player_Id == playerInfo.player.playerId
      ) {
        this.amAlive = false;
      }
      if (playerInfo.player.lifes === 0) {
        this.otherPlayers
          .getChildren()
          .forEach((otherPlayer: Phaser.Physics.Arcade.Sprite) => {
            const OtherPlayerId = otherPlayer.getData("playerId");
            if (playerInfo.player.playerId === OtherPlayerId) {
              otherPlayer.destroy();
            }
          });
      }

      this.scoreTexts.getChildren().forEach((otherPlayerScoreText: any) => {
        const OtherPlayerId = otherPlayerScoreText.getData("playerId");
        if (playerInfo.player.playerId === OtherPlayerId) {
          if (otherPlayerScoreText) {
            otherPlayerScoreText.setText(`life: ${playerInfo.player.lifes}`);
          }
        }
      });
    });
  }

  destroyWall(
    explosion: Phaser.Physics.Arcade.Sprite,
    block: Phaser.Physics.Arcade.Sprite
  ) {
    block.setVisible(false);
    const wall = this.physics.add
      .sprite(block.x, block.y, "wall_destroyed")
      .setOrigin(0, 0)
      .setDepth(1);
    wall.anims.play("wall_destroy");
    wall.on("animationcomplete", () => {
      wall.destroy();
    });
    block.destroy();
  }

  bombInteraction() {
    this.input.keyboard.on("keydown-SPACE", () => {
      this.socket.emit("bomb_activated", {
        x: this.player.x + 32 - ((this.player.x + 32) % 64) + 32,
        y: this.player.y + 32 - ((this.player.y + 32) % 64) + 32,
      });
    });
  }

  playerInteraction() {
    if (this.player && !this.player_dead) {
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
    otherPlayer.setTint(parseInt(playerInfo.color, 16));
    otherPlayer.setDepth(1);

    otherPlayer.setData("playerId", playerInfo.playerId);
    this.otherPlayers.add(otherPlayer);
    let scoreText = this.add.text(800, 20, `${playerInfo.name}: ${playerInfo.lifes}`, {
      fontSize: "32px",
      color: "#000",
    });
    scoreText.setVisible(false);
    scoreText.setData("playerId", playerInfo.playerId);
    scoreText.setStyle({ color: "#" + playerInfo.color.substring(2) });
    this.scoreTexts.add(scoreText);
    this.printTextScores();
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
                } else if (action === "die") {
                  otherPlayer.anims.play("die");
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

  printTextScores() {
    this.scoreTexts.getChildren().forEach((textObject: any, index: number) => {
      if (textObject instanceof Phaser.GameObjects.Text) {
        const xPos = 800;
        const yPos = 20 + index * 60;
        textObject.setPosition(xPos, yPos);
        textObject.setVisible(true);
      }
    });
  }
}

export default PlayScene;
