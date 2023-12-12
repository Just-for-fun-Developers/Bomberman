import { Menu } from "../common/interfaces";
import BaseScene from "./BaseScene";
import { Socket } from "socket.io-client";
import socket from "../server/socket-io"
import { generateSessionHash } from "../common/utils";
import { PlayerInfo } from "../common/interfaces";

const NEW_SESSION = "START GAME";

class RoomScene extends BaseScene {
  menu: Menu[];
  socket: Socket;
  playerName: string;
  newSession: boolean;
  session: number;
  scoreTexts: Phaser.GameObjects.Group;

  constructor() {
    super("RoomScene");

    this.menu = [
      { scene: "PlayScene", text: NEW_SESSION },
    ];
  }

  init(data: { playerName: string; newSession: boolean }) {
    this.playerName = data.playerName;
    this.newSession = data.newSession;
  }

  create() {
    super.create();
    this.createMenu(this.menu, this.setupMenuEvents.bind(this));
    if (this.newSession) {
        const sessionHash = generateSessionHash();
        this.session = sessionHash;
      } else {
        const sessionHash = prompt("Ingresa session hash:");
        this.session = parseInt(sessionHash);
      }
      // Update the div with the player's session
      const sessionDiv = document.getElementById("session-display");
      if (sessionDiv) {
        sessionDiv.innerText = `session Hash: ${this.session}`;
      }
      socket.emit("initPlayer", {
        name: this.playerName,
        session: this.session,
      });
      socket.on("play", ()=>{
        this.scene.start("PlayScene", {
            playerName: this.playerName,
            session: this.session
          })
      });
      socket.on("newPlayerText", (playerInfo: PlayerInfo) => {
        this.addOtherPlayerText(playerInfo);
      });
      //Show Players
      this.scoreTexts = this.add.group();
      this.showPlayers();
  }

  showPlayers() {
    socket.on(
      "currentPlayersText",
      (players: { [key: string]: PlayerInfo }) => {
        console.log(players)
        Object.keys(players).forEach((id) => {
          if (players[id].playerId === socket.id) {
            this.addPlayerText(players[id]);
          } else {
            this.addOtherPlayerText(players[id]);
          }
        });
      }
    );
  }

  addPlayerText(playerInfo: PlayerInfo) {
    const scoreText = this.add.text(
        20,
        20,
        `player ${playerInfo.name} waiting`,
        {
          fontSize: "32px",
          color: "#000",
        }
      );
    this.scoreTexts.add(scoreText);
    this.printTextScores();
  }

  addOtherPlayerText(playerInfo: PlayerInfo) {
    const scoreText = this.add.text(
        20,
        20,
        `player ${playerInfo.name} waiting`,
        {
          fontSize: "32px",
          color: "#000",
        }
      );
    this.scoreTexts.add(scoreText);
    this.printTextScores();
  }

  printTextScores() {
    this.scoreTexts
      .getChildren()
      .forEach((textObject: Phaser.GameObjects.Text, index: number) => {
        if (textObject instanceof Phaser.GameObjects.Text) {
          const xPos = 20;
          const yPos = 20 + index * 60;
          textObject.setPosition(xPos, yPos);
          textObject.setVisible(true);
        }
      });
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
        /* menuItem.scene &&
          this.scene.start(menuItem.scene, {
            playerName: this.playerName,
            session: this.session
          }); */
        socket.emit("startPlayScene");
      }
    });
  }
}

export default RoomScene;