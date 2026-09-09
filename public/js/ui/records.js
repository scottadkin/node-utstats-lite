class RecordsPage{

    constructor(parent, mode, validTypes, modeTitles, gametypes, maps, 
        gametypeMapCombos, selectedGametype, selectedMap, recordType, data, totalResults){

        this.parent = document.querySelector(parent);
        this.mode = mode;
        this.validTypes = validTypes;
        this.modeTitles = modeTitles;

        this.gametypes = gametypes;
        this.maps = maps;
        this.gametypeMapCombos = gametypeMapCombos;

        this.selectedRecordType = recordType;
        this.selectedGametype = selectedGametype;
        this.selectedMap = selectedMap;
        this.data = data;
        this.totalResults = totalResults;

        console.log(data, totalResults);

        this.createTabs();
        this.createInfo();
        this.createDropDowns();

        this.render();
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

            
            
            if(!this.recordSelect.updateOptions(this.getRecordOptions(), this.selectedRecordType)){

                const newValue = this.recordSelect.options[0]?.value ?? "score";

                this.recordSelect.changeSelected(newValue);
                this.selectedRecordType = newValue;
            }

            history.pushState({}, "", `/records?mode=${this.mode}&rec=${this.selectedRecordType}`);
            
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

        options.sort(sortUISelectOptionsByDisplay);


        options.unshift({"display": "Any", "value": 0});


        return options;
    }


    getRecordOptions(){

        if(this.validTypes[this.mode] === undefined){

            throw new Error(`${this.mode} is no a valid record mode`);
        }

        

        return this.validTypes[this.mode];
    }

    createDropDowns(){


        this.recordRow = UIDiv("form-row");
        this.recordRow.append(UILabel("Record Type"));
        this.recordSelect = new UISelect(this.recordRow, this.getRecordOptions(), this.selectedRecordType, (e) =>{

            this.selectedRecordType = e;
            this.render();
        });
        

        this.gametypeRow = UIDiv("form-row");
        this.mapRow = UIDiv("form-row");

        this.gametypeRow.append(UILabel("Gametype"));
        this.mapRow.append(UILabel("Map"));


        const gametypeOptions = this.gametypes.map((g) =>{
            return {"display": g.name, "value": g.id};
        });

        
        gametypeOptions.sort(sortUISelectOptionsByDisplay)


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


        this.parent.append(this.recordRow, this.gametypeRow, this.mapRow);

    }


    getDisplayName(name){

        const options = this.validTypes[this.mode] ?? null;

        if(options === null) throw new Error(`validTypes is null`);

        for(let i = 0; i < options.length; i++){

            const {display, value} = options[i];

            if(value === name) return display;
        }



        return "Not Found";
    }

    render(){

        const tableOptions = {
            "className": "t-width-1",
            "bNoSort": true,
            "headers": [
                {"display": "Player"},
                {"display": "Last Seen"},
                {"display": "Matches Played"},
                {"display": "Total Playtime"},
                {"display": this.getDisplayName(this.selectedRecordType)},
            ]
        };


        const rows = this.data.map((d) =>{

            return [
                {"display": UIPlayerLink({
                    "playerId": d.player_id,
                    "country": d.country,
                    "name": d.player_name,
                    "bTableElem": true
                }),
                 "bSkipTD": true
            },
                {"display": toDateString(d.last_active, TIME_ZONE, true), "className": "date"},
                {"display": d.total_matches},
                {"display": toPlaytime(d.playtime), "className": "playtime"},
                {"display": d.record_value},
            ];
        });

        if(this.table === undefined){

            this.table = new TESTUITable(this.parent, tableOptions, rows);
        }else{

            this.table.updateRows(rows, tableOptions.headers);
        }

    }
}