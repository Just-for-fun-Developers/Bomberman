import { Menu } from "../common/interfaces";
import BaseScene from "./BaseScene";
import { Socket } from "socket.io-client";

const NEW_SESSION = "Play (New Session)";
const JOIN_SESSION = "Play (Join Session)";
const EXIT = "Exit";

class MenuScene extends BaseScene {
  menu: Menu[];
  socket: Socket;
  playerName: string;

  constructor() {
    super("MenuScene");

    this.menu = [
      { scene: "PlayScene", text: NEW_SESSION },
      { scene: "PlayScene", text: JOIN_SESSION },
      { scene: null, text: EXIT },
    ];
  }

  create() {
    super.create();

    this.playerName = localStorage.getItem('playerName');

    while (!this.playerName || this.playerName.trim() === "") {
      this.playerName = prompt("Ingresa tu Nickname:");

      if (this.playerName === null) {
        this.scene.start("MenuScene");
        return;
      }
      this.playerName = this.playerName.trim();
    }
    localStorage.setItem('playerName', this.playerName);
    this.createMenu(this.menu, this.setupMenuEvents.bind(this));
  }

  setupMenuEvents(menuItem: Menu) {
    const textGO = menuItem.textGO;
    textGO.setInteractive();

    textGO.on("pointerover", () => {
      textGO.setStyle({ fill: "#0f0" });
    });

    textGO.on("pointerout", () => {
      textGO.setStyle({ fill: "#fff" });
    });

    textGO.on("pointerup", () => {
      if (menuItem.text === NEW_SESSION) {
        menuItem.scene &&
          this.scene.start(menuItem.scene, {
            playerName: this.playerName,
            newSession: true,
          });
      } else if (menuItem.text === JOIN_SESSION) {
        menuItem.scene &&
          this.scene.start(menuItem.scene, {
            playerName: this.playerName,
            newSession: false,
          });
      } else if (menuItem.text === EXIT) {
        this.game.destroy(true);
      }
    });
  }
}

export default MenuScene;
