import Phaser from "phaser";
import PlayScene from "./scenes/PlayScene";
import PreloadScene from "./scenes/PreloadScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  transparent: true,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 200 },
    },
  },
  scene: [PreloadScene, PlayScene],
};

new Phaser.Game(config);
