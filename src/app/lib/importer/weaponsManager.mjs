import { getWeaponId, createWeapon } from "../weapons.mjs";

export class WeaponsManager{

    constructor(){

        this.tempNames = [];
        this.weapons = {};
    }


    parseLine(line){

        const reg = /^(kill|teamkill)\t\d+?\t(.+?)\t\d+?\t(.+?)\t.+$/i;

        const result = reg.exec(line);

        //const killType = result[1].toLowerCase();
        const killerWeapon = result[2];
        const victimWeapon = result[3];

        if(this.tempNames.indexOf(killerWeapon) === -1) this.tempNames.push(killerWeapon);
        if(this.tempNames.indexOf(victimWeapon) === -1) this.tempNames.push(victimWeapon);

    }

    async setWeaponIds(){

        for(let i = 0; i < this.tempNames.length; i++){

            const name = this.tempNames[i];

            let id = await getWeaponId(name);

            if(id === null){
                id = await createWeapon(name);
            }

            this.weapons[id] = name;
        }
    }
}