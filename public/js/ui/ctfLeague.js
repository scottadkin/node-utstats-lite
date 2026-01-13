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

        this.parent.appendChild(this.wrapper);

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
        row.appendChild(label);
        this.wrapper.appendChild(row);

        const select = document.createElement("select");

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
            option.appendChild(document.createTextNode(name));
            select.appendChild(option);
        }

        row.appendChild(select);
    }

    createForm(){

        this.createDropDown("gametypes");
        
        if(this.mode === "maps"){
            this.createDropDown("maps");
        }

        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.id = "mode";
        hidden.name = "mode";
        hidden.value = this.mode;

        this.wrapper.appendChild(hidden);

        const submit = document.createElement("input");
        submit.type = "submit";
        submit.value = "Search";
        submit.className = "submit-button";
        this.wrapper.appendChild(submit);
    }
}


class CTFLeagueTable{

    constructor(parent, mode, data, id, gId, page, perPage, subHeader){
        
        this.parent = document.querySelector(parent);
        this.mode = mode;
        this.data = data;

        if(this.data.data.length === 0) return;

        this.id = id;
        this.gId = gId;
        this.currentPage = page;
        this.perPage = perPage;

        this.table = document.createElement("table");
        this.table.className = `t-width-1`;

        UIHeader(this.parent, `${subHeader} - Player League`);

        this.parent.appendChild(this.table);
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

            headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
        }

        this.table.appendChild(headerRow);


        for(let i = 0; i < this.data.data.length; i++){

            const d = this.data.data[i];
            const row = document.createElement("tr");

            let pos = 1;

            pos = i + 1 + (this.perPage * (this.currentPage - 1));

            row.appendChild(UITableColumn({"content": pos, "parse": ["ordinal"], "className": "ordinal"}));
            row.appendChild(UIPlayerLink({"playerId": d.player.id, "name": d.player.name, "country": d.player.country, "bTableElem": true}));

            row.appendChild(UITableColumn({"content": d.total_matches}));
            row.appendChild(UITableColumn({"content": d.wins, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": d.draws, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": d.losses, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": d.cap_for, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": d.cap_against, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": d.cap_offset, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": d.points, "parse": ["ignore0"]}));

            this.table.appendChild(row);
        }

        const url = `/ctfleague?mode=${this.mode}${(this.mode === "gametypes") ? `&id=${this.id}` : `&gid=${this.gId}&id=${this.id}`}&page=`;
        new UIPagination(this.parent, url, this.data.totalRows, this.perPage, this.currentPage);
    }
}