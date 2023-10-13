import Phaser from "phaser";

class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    this.load.image("wood_cell", "assets/wood/wood_bark1.jpg");
    this.load.image("cloud_cell", "assets/clouds/stormy_clouds_p2b.jpg");
    this.load.image(
      "toy",
      "assets/various/energy_spins/misc_energy_ball_fire.jpg"
    );
  }

  create() {
    this.scene.start("PlayScene");
  }
}

export default PreloadScene;
