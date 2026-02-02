export default class Items{

    constructor(){
     
        this.events = [];
    }

    parseLine(timestamp, line){

        const reg = /^item_get\t(.+?)\t(\d+)$/i;

        const result = reg.exec(line);

        if(result === null) return;

        const itemName = result[1].toLowerCase();
        const playerId = parseInt(result[2]);

        this.events.push({timestamp, "item": itemName, "playerId": playerId});
    }


    setPlayerStats(playerManager){

        const types = {
            "damage amplifier": "amp",
            "shield belt": "belt",
            "antigrav boots": "boots",
            "body armor": "body",
            "thigh pads": "pads",
            "invisibility": "invis",
            "super health pack": "shp"
        };


        for(let i = 0; i < this.events.length; i++){

            const e = this.events[i];

            const player = playerManager.getPlayerById(e.playerId);
            if(player === null) continue;
            if(types[e.item] === undefined) continue;
            player.stats.items[types[e.item]]++;
        }
    }
}