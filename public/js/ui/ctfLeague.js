function renderTypeTabs(parent, currentMode, seasonId){

    seasonId = parseInt(seasonId);
    if(seasonId !== seasonId) throw new Error(`seasonId must be a valid integer`);
    parent = document.querySelector(parent);

    const tabOptions = [
        {"display": "Combined", "value": "combined"},
        {"display": "Gametypes", "value": "gametypes"},
        {"display": "Maps", "value": "maps"},
    ];

    const tabs = new UITabs(parent, tabOptions, currentMode);

    tabs.wrapper.addEventListener("tabChanged", (e) =>{
        const urlBase = (seasonId === 0) ? `/ctfleague/` : `/season/${seasonId}/ctfleague/`;

        window.location.replace(`${urlBase}?mode=${e.detail.newTab}`);
    });
}


class CTFLeagueFilterForm{

    constructor(parent, mode, gametypeNames, mapNames, id, gId, seasonId){
        
        if(mode === "combined") return;
        this.parent = document.querySelector(parent);
        this.mode = mode;
        this.gametypeNames = gametypeNames;
        this.seasonId = parseInt(seasonId);
        if(this.seasonId !== this.seasonId) throw new Error(`seasonId must be valid integer`)
        this.mapNames = mapNames;
        this.id = parseInt(id);
        this.gId = parseInt(gId);

        this.wrapper = UIDiv("form");
        this.parent.append(this.wrapper);

        this.createForm();
    }

    sortByName(a, b){
  
        a = a.name.toLowerCase();
        b = b.name.toLowerCase();
        if(a < b) return -1;
        if(a > b) return 1;
        return 0;
        
    }


    createDropDown(type){

        const row = UIDiv("form-row");


        const labelFor = (type === "gametypes") ? "gametype" : "map";
        const labelDisplay = (type === "gametypes") ? "Gametype" : "Map";

        const label = UILabel(labelDisplay, labelFor)

        row.append(label);
        this.wrapper.append(row);

        const names = (type === "gametypes") ? this.gametypeNames : this.mapNames;
        const orderedNames = [];

        for(const [id, name] of Object.entries(names)){
            orderedNames.push({id, name});
        }

        orderedNames.sort(this.sortByName);

        if(this.mode === "maps" && type == "gametypes"){
            orderedNames.unshift({"id": "0", "name": "Any"});
        }

        const selectOptions = [];

        let currentValue = this.id;


        if(type === "gametypes" && this.mode === "maps"){

            currentValue = this.gId;
        }

        const select = new UISelect(row, orderedNames.map((o) =>{ return {"display": o.name, "value": parseInt(o.id)}}),
            currentValue,
        (e) =>{

            if(this.mode === "gametypes"){

                this.id = parseInt(e);

            }else if(this.mode === "maps"){

                const targetKey = (type === "gametypes") ? "gId" : "id";

                this[targetKey] = parseInt(e);
            }

            const urlBase = (this.seasonId === 0) ? `/ctfleague/` : `/season/${this.seasonId}/ctfleague/`;
            
            let newUrl = `${urlBase}?mode=${this.mode}`;

            if(this.mode === "maps"){
                newUrl+=`&id=${this.id}&gid=${this.gId}`;
                   
            }else{
                newUrl+=`&id=${this.id}`;
            }
    

            window.location = newUrl;
        }, labelFor, labelFor);

        
    }

    createForm(){

        this.createDropDown("gametypes");
        
        if(this.mode === "maps"){
            this.createDropDown("maps");
        }


    }
}


class CTFLeagueTable{

    constructor(parent, mode, data, id, gId, page, perPage, subHeader, seasonId){
        
        this.parent = document.querySelector(parent);
        this.mode = mode;
        this.data = data;
        this.seasonId = parseInt(seasonId);
        if(this.seasonId !== this.seasonId) throw new Error(`seasonId must be valid integer`);

        if(this.data.data.length === 0){

            new UIInfo(this.parent, [`There are no players in this CTF League Table.`]);
            return;
        }

        this.id = id;
        this.gId = gId;
        this.currentPage = page;
        this.perPage = perPage;

        
        UIHeader(this.parent, `${subHeader} - Player League`);
        this.content = UIDiv();
        this.parent.append(this.content);


        this.render();
    }


    render(){

        const tableOptions = {
            "headers":[
                "Place", "Player", "Played", "Wins", 
                "Draws", "Losses", "Caps For",
                "Caps Against", "Cap Offset", "Points"
            ].map((h) => { return {"display": h}}),
            "className": "t-width-1",
            "bNoSort": true
        }

        const rows = [];

        for(let i = 0; i < this.data.data.length; i++){

            const d = this.data.data[i];
            

            let pos = 1;

            pos = i + 1 + (this.perPage * (this.currentPage - 1));

            
            rows.push([
                {"display": `${pos}${getOrdinal(pos)}`, "className": "ordinal"},
                {
                    "display": UIPlayerLink({
                        "playerId": d.player.id, 
                        "name": d.player.name, 
                        "country": d.player.country, 
                        "bTableElem": true
                    }), 
                    "bSkipTD": true
                },
                {"display": d.total_matches},
                {"display": ignore0(d.wins)},
                {"display": ignore0(d.draws)},
                {"display": ignore0(d.losses)},
                {"display": ignore0(d.cap_for)},
                {"display": ignore0(d.cap_against)},
                {"display": d.cap_offset},
                {"display": ignore0(d.points)},
            ]);
        }

        this.table = new TESTUITable(this.content, tableOptions, rows);

        const urlBase = (this.seasonId === 0) ? `/ctfleague/` : `/season/${this.seasonId}/ctfleague/`;

        const url = `${urlBase}?mode=${this.mode}${(this.mode === "gametypes") ? `&id=${this.id}` : `&gid=${this.gId}&id=${this.id}`}&page=`;
        new UIPagination(this.parent, url, this.data.totalRows, this.perPage, this.currentPage);
    }
}