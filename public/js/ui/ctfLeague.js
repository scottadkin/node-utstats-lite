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
        this.id = id;
        this.gId = gId;


        this.wrapper = document.createElement("form");
        this.wrapper.className = "form";
        this.wrapper.action = `/ctfleague/`;
        this.wrapper.method = "GET";

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

        const row = document.createElement("div");
        row.className = "form-row";
        const label = document.createElement("label");
        label.htmlFor = (type === "gametypes") ? "gametype" : "map";
        label.innerHTML =  (type === "gametypes") ? "Gametype" : "Map";
        row.append(label);
        this.wrapper.append(row);

        const select = document.createElement("select");

        select.addEventListener("change", (e) =>{

            if(this.mode === "gametypes"){

                this.id = e.target.value;

            }else if(this.mode === "maps"){

                const targetKey = (type === "gametypes") ? "gId" : "id";

                this[targetKey] = e.target.value;
            }

            
            let newUrl = `/ctfleague/?mode=${this.mode}`;

            if(this.mode === "maps"){
                newUrl+=`&id=${this.id}&gid=${this.gId}`;
            }else{
                newUrl+=`&id=${this.id}`;
            }
            window.location = newUrl;

        });

        if(this.mode === "gametypes"){

            select.id = "id";

        }else if(this.mode === "maps"){

            select.id = (type === "gametypes") ? "gid" : "id";
        }

        select.name = select.id;
        select.className = "default-select";

        const names = (type === "gametypes") ? this.gametypeNames : this.mapNames;

        const orderedNames= [];

        for(const [id, name] of Object.entries(names)){
            orderedNames.push({id, name});
        }

        orderedNames.sort(this.sortByName);

        if(this.mode === "maps" && type == "gametypes"){
            orderedNames.unshift({"id": "0", "name": "Any"});
        }

        for(let i = 0; i < orderedNames.length; i++){

            const {id, name} = orderedNames[i];

            const option = document.createElement("option");

            if(this.mode === "gametypes" && type === "gametypes"){

                if(id == this.id) option.selected = true;

            }else if(this.mode === "maps"){

                if(id == this.gId && type === "gametypes") option.selected = true;
                if(id == this.id && type === "maps") option.selected = true;
            }

            option.value = id;
            option.append(document.createTextNode(name));
            select.append(option);
        }

        row.append(select);
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

            const info = UIDiv("info");
            info.append(`There is currently no players in this CTF League Table.`);
            this.parent.append(info);
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

            row.append(UITableColumn({"content": pos, "parse": ["ordinal"], "className": "ordinal"}));
            row.append(UIPlayerLink({"playerId": d.player.id, "name": d.player.name, "country": d.player.country, "bTableElem": true}));

            row.append(UITableColumn({"content": d.total_matches}));
            row.append(UITableColumn({"content": d.wins, "parse": ["ignore0"]}));
            row.append(UITableColumn({"content": d.draws, "parse": ["ignore0"]}));
            row.append(UITableColumn({"content": d.losses, "parse": ["ignore0"]}));
            row.append(UITableColumn({"content": d.cap_for, "parse": ["ignore0"]}));
            row.append(UITableColumn({"content": d.cap_against, "parse": ["ignore0"]}));
            row.append(UITableColumn({"content": d.cap_offset, "parse": ["ignore0"]}));
            row.append(UITableColumn({"content": d.points, "parse": ["ignore0"]}));

            this.table.append(row);
        }

        const url = `/ctfleague?mode=${this.mode}${(this.mode === "gametypes") ? `&id=${this.id}` : `&gid=${this.gId}&id=${this.id}`}&page=`;
        new UIPagination(this.parent, url, this.data.totalRows, this.perPage, this.currentPage);
    }
}