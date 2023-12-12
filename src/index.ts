import Phaser from "phaser";
import PlayScene from "./scenes/PlayScene";
import PreloadScene from "./scenes/PreloadScene";
import MenuScene from "./scenes/MenuScene";
import RoomScene from "./scenes/RoomScene";

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
  scene: [PreloadScene, MenuScene, RoomScene, PlayScene],
  // Parent element
  parent: "game-container",
};

new Phaser.Game(config);
