import BaseScene from "./BaseScene";
import { io, Socket } from "socket.io-client";

class MenuScene extends BaseScene{
    menu:any;
    socket: Socket;
    playerName: string;

    constructor(){
        super('MenuScene');
        
        this.menu = [
            {scene: 'PlayScene', text: 'Play'},
            {scene: null, text: 'Exit'}
        ]
    }

    create() {
        super.create();
        //this.socket = io('localhost:3000')
        /* var input = this.add.dom(0, 0).createFromHTML('<input type="text" id="nameInput" style="width: 200px; font-size: 16px; padding: 8px; text-align: center;">');
        input.setDepth(1);
        input.addListener('click');

        this.input.on('gameobjectup', function (pointer:any, gameObject:any) {
            if (gameObject === input) {
                var inputElement = document.getElementById('nameInput') as HTMLInputElement;

                if (inputElement) {
                    var playerName = inputElement.value;
                    console.log('Player Name:', playerName);
                    // Puedes hacer algo con el nombre del jugador aquí
                }
            }
        }); */
        this.playerName = prompt('Ingresa tu Nickname:');
        //console.log(this.playerName); 
        this.createMenu(this.menu, this.setupMenuEvents.bind(this));
    }

    setupMenuEvents(menuItem:any) {
        const textGO = menuItem.textGO;
        textGO.setInteractive();

        textGO.on('pointerover', () => {
            textGO.setStyle({fill: '#0f0'});
        })

        textGO.on('pointerout', () => {
            textGO.setStyle({fill: '#fff'});
        })

        textGO.on('pointerup', () => {
            menuItem.scene && this.scene.start(menuItem.scene, { playerName: this.playerName });
            if(menuItem.text === 'Exit') {
                this.game.destroy(true);
            }
        })
    }

}

export default MenuScene;