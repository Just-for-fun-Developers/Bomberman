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
    this.load.spritesheet('player', "assets/person/bomberman_player.png", {
      frameWidth:32, frameHeight: 32
    });
    this.load.spritesheet('otherPlayer', "assets/person/bomberman_player.png", {
      frameWidth:32, frameHeight: 32
    });
  }

  create() {
    this.scene.start("PlayScene");
  }
}

export default PreloadScene;
