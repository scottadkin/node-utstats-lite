
function renderMatchesPagination(parent, server, gametype, map, totalMatches, perPage, currentPage, displayMode){

    new UIPagination(parent, `/matches/?s=${server}&g=${gametype}&m=${map}&display=${displayMode}&page=`, totalMatches, perPage, currentPage);
}

function renderMatchesTable(parent, data, bMapsPage){

    parent = document.querySelector(parent);

    const matches = data.data;

    if(matches.length === 0) return;

    if(bMapsPage === undefined) bMapsPage = false;

    const wrapper = document.createElement("div");
    wrapper.className = "center text-center";

    const table = document.createElement("table");
    table.className = "t-width-1";

    const headers = [
        "Gametype", "Server", "Date", "Players", "Playtime", "Result"
    ];

    if(!bMapsPage) headers.unshift("Map");

    const headerRow = document.createElement("tr");

    for(let i = 0; i < headers.length; i++){

        headerRow.append(UITableHeaderColumn({"content": headers[i]}));
    }

    table.append(headerRow);


    for(let i = 0; i < matches.length; i++){

        const m = matches[i];
        
        const row = document.createElement("tr");

        const url = `/match/${m.id}`;

        if(!bMapsPage){
            row.append(UITableColumn({"content": m.map_name, "className": "text-left", url}));
        }
        row.append(UITableColumn({"content": m.gametype_name, "className": "font-small", url}));
        row.append(UITableColumn({"content": m.server_name, "className": "font-small", url}));
        row.append(UITableColumn({"content": m.date, "parse": ["date"], "className": "playtime", url}));
        row.append(UITableColumn({"content": m.players, "parse": ["ignore0"], url}));
        row.append(UITableColumn({"content": m.playtime, "parse": ["playtime"], "className": "playtime", url}));

        const a = document.createElement("td");
        UIMatchScoreBox(a, m, true, false);
        row.append(a);
        table.append(row);
    }


    wrapper.append(table);


    parent.append(wrapper); 
}

class MatchRichViewBox{

    constructor(parent, data){

        this.parent = parent;
        this.data = data;

        this.wrapper = document.createElement("a");
        this.wrapper.href = `/match/${data.id}`;
        this.wrapper.className = "rich-wrapper";
        this.parent.append(this.wrapper);

        this.createElems()
        
    }

    createInfoElems(){

        const d = this.data;

        const info = document.createElement("div");
        info.className = "rich-info";

        const gametype = document.createElement("div");
        gametype.className = "white";

        gametype.append(document.createTextNode(d.gametype_name));
        info.append(gametype);

        info.append(document.createTextNode(toDateString(d.date, true)));

        const players = document.createElement("div");
        players.className = "white";
        players.innerHTML = `${d.players} Player${(d.players === 1) ? "" : "s"}`;
        info.append(players);

        info.append(document.createTextNode(toPlaytime(d.playtime)));

        this.wrapper.append(info);
    }

    createElems(){

        const title = document.createElement("div");
        title.className = "rich-title";
        title.append(document.createTextNode(this.data.map_name));
        this.wrapper.append(title);

        const image = document.createElement("img");
        image.className = "rich-image";
        image.alt = "map-sshot";
        image.src = `/images/maps/${this.data.map_image}`;

        this.wrapper.append(image);
        this.createInfoElems();
        UIMatchScoreBox(this.wrapper, this.data, false, false);
    }
}

class MatchesRichView{

    constructor(parent, matches){

        this.parent = document.querySelector(parent);
        this.matches = matches;

        this.wrapper = document.createElement("div");
        this.wrapper.className = "rich-outter t-width-1";

        this.parent.append(this.wrapper);


        this.createElems();

    }


    createElems(){

        this.elems = [];

        for(let i = 0; i < this.matches.data.length; i++){

            const d = this.matches.data[i];

            this.elems.push(new MatchRichViewBox(this.wrapper, d));
        }
    }
}

class MatchesSearchForm{

    constructor(parent, servers, gametypes, maps, selectedServer, selectedGametype, selectedMap, selectedDisplayMode){

        this.parent = document.querySelector(parent);

        this.servers = servers;
        this.gametypes = gametypes;
        this.maps = maps;

        this.selectedServer = selectedServer;
        this.selectedGametype = selectedGametype;
        this.selectedMap = selectedMap;
        this.selectedDisplayMode = selectedDisplayMode;

        UIHeader(this.parent, "Recent Matches");
        this.wrapper = UIDiv("form");
        
        this.createFormElems();
        this.parent.append(this.wrapper);
    }

    changeSelected(key, value){

        this[key] = value;
        const url = `/matches/?s=${this.selectedServer}&g=${this.selectedGametype}&m=${this.selectedMap}&display=${this.selectedDisplayMode}`;
        window.location.href = url;
    }

    createSelect(type){

        let title = "";
        let selectedKey = "";
        let targetNames = [];
        let id = "";

        if(type === "servers"){

            selectedKey = "selectedServer";
            title = "Server";
            id = "s";
            targetNames = this.servers;

        }else if(type === "gametypes"){

            selectedKey = "selectedGametype";
            title = "Gametype";
            id = "g";
            targetNames = this.gametypes;

        }else if(type === "maps"){

            selectedKey = "selectedMap";
            title = "Map";
            id = "m";
            targetNames = this.maps;

        }else if(type === "display"){

            selectedKey = "selectedDisplayMode";
            title = "Display Mode";
            id = "display";

            targetNames = [
                {"name": "Default View", "id": "default"},
                {"name": "Table View", "id": "table"}
            ];
        }

        if(type !== "display"){

            targetNames.sort((a, b) =>{
                a = a.name.toLowerCase();
                b = b.name.toLowerCase();

                if(a < b){
                    return -1;
                }else if(a > b){
                    return 1;
                }
                return 0;
            });
        }

        const row = UIDiv("form-row");
        row.append(UILabel(title));

        const select = new UISelect(
            row, 
            targetNames.map((s) =>{
                return {"display": s.name, "value": s.id};
            }), 
            this[selectedKey],
            (newTab) => { 
                this.changeSelected(selectedKey, newTab);
            }
        );

        select.select.id = select.select.name = id;

        return row;
    }

    createFormElems(){

        this.wrapper.append(this.createSelect("servers"));
        this.wrapper.append(this.createSelect("gametypes"));
        this.wrapper.append(this.createSelect("maps"));
        this.wrapper.append(this.createSelect("display"));
    }

}