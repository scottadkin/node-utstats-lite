function renderTypeTabs(parent, currentMode){

    parent = document.querySelector(parent);

    const tabOptions = [
        {"display": "Combined", "value": "combined"},
        {"display": "Gametypes", "value": "gametypes"},
        {"display": "Maps", "value": "maps"},
    ];

    const tabs = new UITabs(parent, tabOptions, currentMode);
    tabs.wrapper.addEventListener("tabChanged", (e) =>{
        window.location.replace(`/ctfleague/?mode=${e.detail.newTab}`);
    });
}


class CTFLeagueFilterForm{

    constructor(parent, mode, gametypeNames, mapNames, id, gId){
        
        if(mode === "combined") return;
        this.parent = document.querySelector(parent);
        this.mode = mode;
        this.gametypeNames = gametypeNames;
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

            
            let newUrl = `/ctfleague/?mode=${this.mode}`;

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

    constructor(parent, mode, data, id, gId, page, perPage, subHeader){
        
        this.parent = document.querySelector(parent);
        this.mode = mode;
        this.data = data;

        if(this.data.data.length === 0){

            new UIInfo(this.parent, [`There are no players in this CTF League Table.`]);
            return;
        }

        this.id = id;
        this.gId = gId;
        this.currentPage = page;
        this.perPage = perPage;

        this.table = document.createElement("table");
        this.table.className = `t-width-1`;

        UIHeader(this.parent, `${subHeader} - Player League`);

        this.parent.append(this.table);
        this.render();
    }


    render(){

        const headers = [
            "Place", "Player", "Played", "Wins", 
            "Draws", "Losses", "Caps For",
            "Caps Against", "Cap Offset", "Points"
        ];

        const headerRow = document.createElement("tr");

        for(let i = 0; i < headers.length; i++){

            headerRow.append(UITableHeaderColumn({"content": headers[i]}));
        }

        this.table.append(headerRow);


        for(let i = 0; i < this.data.data.length; i++){

            const d = this.data.data[i];
            const row = document.createElement("tr");

            let pos = 1;

            pos = i + 1 + (this.perPage * (this.currentPage - 1));

            row.append(UITableCell({"content": pos, "parse": ["ordinal"], "className": "ordinal"}));
            row.append(UIPlayerLink({"playerId": d.player.id, "name": d.player.name, "country": d.player.country, "bTableElem": true}));

            row.append(UITableCell({"content": d.total_matches}));
            row.append(UITableCell({"content": d.wins, "parse": ["ignore0"]}));
            row.append(UITableCell({"content": d.draws, "parse": ["ignore0"]}));
            row.append(UITableCell({"content": d.losses, "parse": ["ignore0"]}));
            row.append(UITableCell({"content": d.cap_for, "parse": ["ignore0"]}));
            row.append(UITableCell({"content": d.cap_against, "parse": ["ignore0"]}));
            row.append(UITableCell({"content": d.cap_offset, "parse": ["ignore0"]}));
            row.append(UITableCell({"content": d.points, "parse": ["ignore0"]}));

            this.table.append(row);
        }

        const url = `/ctfleague?mode=${this.mode}${(this.mode === "gametypes") ? `&id=${this.id}` : `&gid=${this.gId}&id=${this.id}`}&page=`;
        new UIPagination(this.parent, url, this.data.totalRows, this.perPage, this.currentPage);
    }
}