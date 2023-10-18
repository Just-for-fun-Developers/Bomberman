import Phaser from "phaser";
import PlayScene from "./scenes/PlayScene";
import PreloadScene from "./scenes/PreloadScene";
import jwt_decode from "jwt-decode";

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

function handleCredentialResponse(body: any) {
  const decoded: any = jwt_decode(body["credential"]);
  const name = decoded["name"];
  const userNameElement = document.getElementById("userName");
  if (userNameElement) {
    userNameElement.textContent = `Hello, ${name}!`;
  }
}

(window as any).handleCredentialResponse = handleCredentialResponse;
