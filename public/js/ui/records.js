class RecordsPage{

    constructor(parent, validTypes, gametypes, maps, gametypeMapCombos){

        this.parent = document.querySelector(parent);
        this.validTypes = validTypes;

        this.gametypes = gametypes;
        this.maps = maps;
        this.gametypeMapCombos = gametypeMapCombos;

        this.mode = "player-match";

        console.log(this);


        this.createTabs();
        this.createInfo();
    }

    createTabs(){

        const options = [
            {"display": "Player Match Records", "value": "player-match"},
            {"display": "Lifetime Records", "value": "player-lifetime"},
        ];

        this.tabs = new UITabs(this.parent, options, this.mode); 


        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{

            this.mode = e.detail.newTab;
            this.updateInfoContent();
            this.render();
        });
    }

    updateInfoContent(){

        const content = [];

        if(this.mode === "player-match"){

            content.push(`Player match records are the highest values for a specific stat in a single match.`);

        }else if(this.mode === "player-lifetime"){

            content.push(`Player lifetime records are the total values for a specific stat.`);
        }

        this.info.updateContent(content);
    }

    createInfo(){

        this.info = new UIInfo(this.parent, []);

        this.updateInfoContent();
    }


    render(){

    }
}