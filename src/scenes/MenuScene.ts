import { type Menu } from '../common/interfaces';
import BaseScene from './BaseScene';
import { io, type Socket } from 'socket.io-client';

class MenuScene extends BaseScene {
  menu: Menu[];
  socket: Socket;
  playerName: string;

  constructor() {
    super('MenuScene');

    this.menu = [
      { scene: 'PlayScene', text: 'Play' },
      { scene: null, text: 'Exit' },
    ];
  }

  create() {
    super.create();
    this.playerName = prompt('Ingresa tu Nickname:');
    this.createMenu(this.menu, this.setupMenuEvents.bind(this));
  }

  setupMenuEvents(menuItem: Menu) {
    const textGO = menuItem.textGO;
    textGO.setInteractive();

    textGO.on('pointerover', () => {
      textGO.setStyle({ fill: '#0f0' });
    });

    textGO.on('pointerout', () => {
      textGO.setStyle({ fill: '#fff' });
    });

    textGO.on('pointerup', () => {
      menuItem.scene &&
        this.scene.start(menuItem.scene, { playerName: this.playerName });
      if (menuItem.text === 'Exit') {
        this.game.destroy(true);
      }
    });
  }
}

export default MenuScene;
