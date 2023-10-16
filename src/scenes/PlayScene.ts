import Phaser from "phaser";

enum CellType {
  Blocked = "BLOCKED",
  Free = "FREE",
  Occupied = "OCCUPIED",
}

class PlayScene extends Phaser.Scene {
  maze: CellType[][] = [];
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  toys: Phaser.Physics.Arcade.Group;
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
    this.createBG();
    this.toys = this.physics.add.group()
    this.maze.forEach((row, indexRow) => {
      row.forEach((cell, indexCol) => {
        if(this.getCell(cell)=='toy'){
          this.toys.create(indexCol * 64, indexRow * 64, 'toy').setImmovable(true).setOrigin(0,0).setScale(this.getScale(cell));
        }else{
          this.add
          .sprite(indexCol * 64, indexRow * 64, this.getCell(cell))
          .setOrigin(0.0)
          .setScale(this.getScale(cell));
        }
      });
    });
    this.createPlayer();
    this.animatePlayer();
  }
  //UPDATE SECTION FOR THE PLAYER ANIMATION
    update() {
      this.playerInteraction();
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
    this.add.image(0,0,'cloud_bg').setOrigin(0,0).setScale(1/2);
  }

  createPlayer() {
    //debugger;
    this.player = this.physics.add.sprite(0,0, "player")
    .setScale(2)
    .setOrigin(0,0);
    this.player.body.gravity.y = 0;
    this.player.setCollideWorldBounds(true);
  }

  animatePlayer() {
    this.anims.create({
      key: 'walk_right',
      frames: this.anims.generateFrameNumbers('player', {start:24, end:29}),
      frameRate:16,
      repeat: -1
    })
    this.anims.create({
      key: 'walk_left',
      frames: this.anims.generateFrameNumbers('player', {start:24, end:29}),
      frameRate:16,
      repeat: -1
    })
    this.anims.create({
      key: 'walk_up',
      frames: this.anims.generateFrameNumbers('player', {start:46, end:48}),
      frameRate:16,
      repeat: -1
    })
    this.anims.create({
      key: 'walk_down',
      frames: this.anims.generateFrameNumbers('player', {start:2, end:4}),
      frameRate:16,
      repeat: -1
    })
    this.anims.create({
      key: 'turn',
      frames:[ { key: 'player', frame: 0 } ],
      frameRate: 20
    })
    this.cursors = this.input.keyboard.createCursorKeys();
  }
  playerInteraction() {
    if (this.cursors.left.isDown)
    {
        this.player.setVelocityX(-160);
        //this.player.setFlipX(true);
        this.player.anims.play('walk_left', true);
    }
    else if (this.cursors.right.isDown)
    {
        this.player.setVelocityX(160);
        
        this.player.anims.play('walk_right', true);
    }
    else if (this.cursors.up.isDown)
    {
        this.player.setVelocityY(-160);

        this.player.anims.play('walk_up',true);
    }
    else if (this.cursors.down.isDown)
    {
        this.player.setVelocityY(160);

        this.player.anims.play('walk_down',true);
    }else
    {
      this.player.setVelocityX(0);
      this.player.setVelocityY(0);
      this.player.anims.play('turn');
    }
    this.physics.add.overlap(this.player, this.toys, this.collectToy, null, this);
  }
  collectToy(player: any, toy: any){
    console.log(`collapse at:${toy.x} and ${toy.y}`)
    toy.disableBody(true,true);
  }
}

export default PlayScene;
