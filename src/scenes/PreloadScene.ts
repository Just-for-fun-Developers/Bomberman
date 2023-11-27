import Phaser from "phaser";

class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    this.load.image("wood_cell", "assets/wood/wood_bark1.jpg");
    this.load.image("cloud_bg", "assets/clouds/stormy_clouds_p2b.jpg");
    this.load.image(
      "toy",
      "assets/various/energy_spins/misc_energy_ball_fire.jpg"
    );
    this.load.image("bomb", "assets/bomb1.png")
    this.load.spritesheet('explosion', 'assets/explosion.png', {
      frameWidth:64, frameHeight:64, endFrame: 23
    });
    this.load.spritesheet('player', "assets/person/bomberman_player.png", {
      frameWidth:32, frameHeight: 32
    });
    this.load.spritesheet('otherPlayer', "assets/person/bomberman_player.png", {
      frameWidth:32, frameHeight: 32
    });
    this.load.spritesheet('wall_destroyed', "assets/wall_destruction.png", {
      frameWidth:64, frameHeight: 64
    });
  }

  create() {
    this.scene.start("MenuScene");
  }
}

export default PreloadScene;
