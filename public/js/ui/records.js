class RecordsPage{

    constructor(parent, validTypes, gametypes, maps, gametypeMapCombos){

        this.parent = document.querySelector(parent);
        this.validTypes = validTypes;

        this.gametypes = gametypes;
        this.maps = maps;
        this.gametypeMapCombos = gametypeMapCombos;

        this.selectedGametype = 0;
        this.selectedMap = 0;

        this.mode = "player-match";


        this.createTabs();
        this.createInfo();
        this.createDropDowns();
    }

    createTabs(){

        const options = [
            {"display": "Player Match Records", "value": "player-match"},
            {"display": "Player Lifetime Records", "value": "player-lifetime"},
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


    getMapName(id){

        for(let i = 0; i < this.maps.length; i++){

            const m = this.maps[i];

            if(m.id === id) return m.name;
        }

        return "Not Found";
    }


    getMapOptions(){

        const options = [];


        for(let i = 0; i < this.gametypeMapCombos.length; i++){

            const c = this.gametypeMapCombos[i];

            if(this.selectedGametype === 0 || this.selectedGametype === c.gId){

                options.push({"display": this.getMapName(c.mId), "value": c.mId});

            }
        }


        options.unshift({"display": "Any", "value": 0});


        return options;
    }


    createDropDowns(){

        this.gametypeRow = UIDiv("form-row");
        this.mapRow = UIDiv("form-row");

        this.gametypeRow.append(UILabel("Gametype"));
        this.mapRow.append(UILabel("Map"));


        const gametypeOptions = this.gametypes.map((g) =>{
            return {"display": g.name, "value": g.id};
        });

        
      


        gametypeOptions.unshift({"display": "Any", "value": 0});

        this.gametypeSelect = new UISelect(this.gametypeRow, gametypeOptions, this.selectedGametype, (e) =>{

            this.selectedGametype = parseInt(e);
            this.mapSelect.updateOptions(this.getMapOptions());
            this.mapSelect.changeSelected(this.mapSelect.options[0].value ?? 0);
            this.render();

        });

        this.mapSelect = new UISelect(this.mapRow, this.getMapOptions(), this.selectedMap, (e) =>{

            this.selectedMap = parseInt(e);
            this.render();
        });


        this.parent.append(this.gametypeRow, this.mapRow);

    }

    render(){

    }
}