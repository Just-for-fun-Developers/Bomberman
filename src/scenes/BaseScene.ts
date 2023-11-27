import Phaser from "phaser";
import { Menu } from "../common/interfaces";

class BaseScene extends Phaser.Scene{
    constructor(key:string){
        super(key);
    }

    create() {
        this.add
      .image(0, 0, "cloud_bg")
      .setOrigin(0, 0)
      .setScale(1 / 2);
    }

    createMenu(menu:Menu[], setupMenuEvents:Function) {
        let lastMenuPositionY = 0;

        menu.forEach((menuItem:Menu) => {
            const menuPosition = [550, 400 + lastMenuPositionY];
            menuItem.textGO = this.add.text(menuPosition[0], menuPosition[1], menuItem.text, {fontSize: '30px'}).setOrigin(0.5, 1);
            lastMenuPositionY += 42;
            setupMenuEvents(menuItem);
        });
    }

}

export default BaseScene;