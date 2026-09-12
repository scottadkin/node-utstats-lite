
function renderMatchesPagination(parent, server, gametype, map, totalMatches, perPage, currentPage, displayMode){

    new UIPagination(parent, `/matches/?s=${server}&g=${gametype}&m=${map}&display=${displayMode}&page=`, totalMatches, perPage, currentPage);
}

function renderMatchesTable(parent, data, bMapsPage, bNoSort){

    if(typeof parent === "string"){
        parent = document.querySelector(parent);
    }

    const matches = data.data;

    if(matches.length === 0) return;

    if(bMapsPage === undefined) bMapsPage = false;

    if(bNoSort === undefined) bNoSort = false;
    if(bMapsPage) bNoSort = true;

    const wrapper = UIDiv("center text-center");


    const tableOptions = {
        "width": 1,
        bNoSort,
        "headers": [
            {"display": "Gametype"},
            {"display": "Server"},
            {"display": "Date"},
            {"display": "Players"},
            {"display": "Playtime"},
            {"display": "Result"},
        ],
        "className": "t-width-1"
    };

    if(!bMapsPage) tableOptions.headers.unshift({"display": "Map"});


    const rows = [];


    for(let i = 0; i < matches.length; i++){

        const m = matches[i];
        
        const row = [];

        const url = `/match/${m.id}`;

        if(!bMapsPage){
            row.push({"display": m.map_name, "value": m.map_name.toLowerCase(), "className": "text-left", url});
        }
        row.push({"display": m.gametype_name, "value": m.gametype_name.toLowerCase(), "className": "font-small", url});
        row.push({"display": m.server_name, "value": m.server_name.toLowerCase(), "className": "font-small", url});
        row.push({"display": toDateString(m.date, TIME_ZONE), "value": m.date,  "className": "playtime", url});
        row.push({"value": m.players, url});
        row.push({"display": toPlaytime(m.playtime), "value": m.playtime,  "className": "playtime", url});

        const a = document.createElement("td");
        UIMatchScoreBox(a, m, true, false);
        row.push({"display": a, "bSkipTD": true});

        rows.push(row);
    }


    //wrapper.append(table);

    new TESTUITable(wrapper, tableOptions, rows)

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

        const info = UIDiv("rich-info");

        const gametype = UIDiv("white");

        gametype.append(UIB(d.gametype_name));
        info.append(gametype);

        info.append(toDateString(d.date, TIME_ZONE, true));

        const players = document.createElement("div");
        players.className = "white";
        players.innerHTML = `${d.players} Player${(d.players === 1) ? "" : "s"}`;
        info.append(players);

        info.append(toPlaytime(d.playtime));

        this.wrapper.append(info);
    }

    createElems(){

        const title = document.createElement("div");
        title.className = "rich-title";
        title.append(this.data.map_name);
        this.wrapper.append(title);

        const image = document.createElement("img");
        image.className = "rich-image";
        image.alt = "map-sshot";
        image.src = getMapThumbOrFullSize(this.data);

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

    constructor(parent, servers, gametypes, maps, selectedServer, selectedGametype, selectedMap, 
        selectedDisplayMode, uniqueGametypeMapCombos){

        this.parent = document.querySelector(parent);

        this.servers = servers;
        this.gametypes = gametypes;
        this.maps = maps;
        this.uniqueGametypeMapCombos = uniqueGametypeMapCombos;

        this.selectedServer = parseInt(selectedServer);
        this.selectedGametype = parseInt(selectedGametype);
        this.selectedMap = parseInt(selectedMap);
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
        let id = "";

        if(type === "servers"){

            selectedKey = "selectedServer";
            title = "Server";
            id = "s";

        }else if(type === "gametypes"){

            selectedKey = "selectedGametype";
            title = "Gametype";
            id = "g";

        }else if(type === "maps"){

            selectedKey = "selectedMap";
            title = "Map";
            id = "m";

        }else if(type === "display"){

            selectedKey = "selectedDisplayMode";
            title = "Display Mode";
            id = "display";
        }


        const row = UIDiv("form-row");
        row.append(UILabel(title));

        const select = new UISelect(
            row, 
            this.getNameOptions(type), 
            this[selectedKey],
            (newTab) => { 
                this.changeSelected(selectedKey, newTab);
            }
        );

        select.select.id = select.select.name = id;

        return row;
    }

    getGametypeInfo(id){

        if(id === 0) return {"bCTF": 1, "bDom": 1};

        for(let i = 0; i < this.gametypes.length; i++){

            const g = this.gametypes[i];
    
            if(g.id === id) return {"bCTF": g.b_ctf, "bDom": g.b_dom}
        }

        return null;
    }

    bMapUsedWithGametype(gametypeId, mapId){


        return this.uniqueGametypeMapCombos?.[gametypeId]?.indexOf(mapId) !== -1;

    }

    filterMaps(){

        const valid = [];


        for(let i = 0; i < this.maps.length; i++){

            const m = this.maps[i];

            if(this.selectedGametype === 0){
                valid.push({"display": m.name, "value": m.id});
                continue;
            }

            if(!this.bMapUsedWithGametype(this.selectedGametype, m.id)) continue;


            valid.push({"display": m.name, "value": m.id});

        }

        valid.unshift({"display": "All", "value": 0});

        return valid;
    }

    getNameOptions(type){


        let targets = [];

        if(type === "servers"){

            targets = this.servers.map((s) =>{
                return {"display": s.name, "value": s.id}
            });
        }else if(type === "gametypes"){

            targets = this.gametypes.map((g) =>{
                return {"display": g.name, "value": g.id}
            });



        }else if(type === "maps"){
            targets = this.filterMaps();
        }else if(type === "display"){
            targets = [
                {"display": "Default View", "value": "default"},
                {"display": "Table View", "value": "table"}
            ];
        }




        if(type !== "display"){

            targets.sort((a, b) =>{
                a = a.display.toLowerCase();
                b = b.display.toLowerCase();

                if(a < b){
                    return -1;
                }else if(a > b){
                    return 1;
                }
                return 0;
            });
        }


        return targets;
    }

    createFormElems(){

        this.wrapper.append(this.createSelect("servers"));
        this.wrapper.append(this.createSelect("gametypes"));
        this.wrapper.append(this.createSelect("maps"));
        this.wrapper.append(this.createSelect("display"));
    }

}