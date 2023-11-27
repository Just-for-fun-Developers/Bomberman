import Phaser from "phaser";
import PlayScene from "./scenes/PlayScene";
import PreloadScene from "./scenes/PreloadScene";
import MenuScene from "./scenes/MenuScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1100,
  height: 800,
  transparent: true,
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
    },
  },
  scene: [PreloadScene, MenuScene, PlayScene],
};

new Phaser.Game(config);
