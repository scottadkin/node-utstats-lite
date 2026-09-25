
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

        this.createElems();
        
    }

    createInfoElems(){

        const d = this.data;

        const info = UIDiv("rich-info");

        const gametype = UIDiv("white");

        gametype.append(UIB(d.gametype_name));

        const players = UIDiv("white");
        players.append(`${d.players} Player${(d.players === 1) ? "" : "s"}`);

        info.append(gametype, toDateString(d.date, TIME_ZONE, true), players, toPlaytime(d.playtime));


        this.wrapper.append(info);
    }

    createElems(){

        const title = UIDiv("rich-title")
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

        this.wrapper = UIDiv("rich-outter t-width-1");

        this.parent.append(this.wrapper);


        this.createElems();

    }

    createElems(){

        for(let i = 0; i < this.matches.data.length; i++){

            const d = this.matches.data[i];

            new MatchRichViewBox(this.wrapper, d);
        }
    }
}

class MatchesSearchForm{

    constructor(seasonId, uniqueCombinations, selectedServer, selectedGametype, selectedMap, displayMode, matches, page, perPage){

        console.log(matches);
        this.seasonId = seasonId;
        this.uniqueCombinations = uniqueCombinations;
        this.matches = matches;
        this.displayMode = displayMode;
        this.page = parseInt(page);
        if(this.page !== this.page) this.page = 1;
        if(this.page < 1) this.page = 1;


        this.perPage = parseInt(perPage);
        if(this.perPage !== this.perPage) this.perPage = 25;
        if(this.perPage < 5 || this.perPage > 100) this.perPage = 25;

        this.selectedServer = parseInt(selectedServer);
        this.selectedGametype = parseInt(selectedGametype);
        this.selectedMap = parseInt(selectedMap);
        this.selectedDisplayMode = displayMode.toLowerCase();

        this.parent = document.querySelector("#root");

        this.wrapper = UIDiv();

        UIHeader(this.wrapper, "Season Matches");

        this.parent.append(this.wrapper);

        this.createForm();


        this.content = UIDiv();
        this.content.id = "matches-content";

        this.wrapper.append(this.content);

  
        this.pagination = new UIPagination(this.parent, `${this.getURL()}&page=`, this.matches.total, this.perPage, this.page);

        this.render();
        
    }
    
    getIdKeyNameKey(type){

        if(type === "servers"){
            return {"idKey": "server_id", "nameKey": "server_name"};
        }else if(type === "gametypes"){
            return {"idKey": "gametype_id", "nameKey": "gametype_name"};
        }else if(type === "maps"){
            return {"idKey": "map_id", "nameKey": "map_name"};
        }

        throw new Error(`Unknown id type`);
    }



    getOptions(type){


        const usedIds = new Set();
        const found = [];

        for(let i = 0; i < this.uniqueCombinations.length; i++){

            const u = this.uniqueCombinations[i];

            const {idKey, nameKey} = this.getIdKeyNameKey(type);

            if(type !== "servers" && this.selectedServer !== 0 && u.server_id !== this.selectedServer) continue;
            if(type !== "gametypes" && this.selectedGametype !== 0 && u.gametype_id !== this.selectedGametype) continue;

            if(!usedIds.has(u[idKey])){

                found.push({"display": u[nameKey], "value": u[idKey]});
                usedIds.add(u[idKey]);
            }
        }


        found.sort((a, b) =>{
            a = a.display.toLowerCase();
            b = b.display.toLowerCase();

            if(a < b){
                return -1;
            }else if(a > b){
                return 1;
            }
            return 0;
        });

        found.unshift({"display": "Any", "value": 0});

        return found;
    }

    getURL(){

        let url = ``;

        if(this.seasonId !== 0){
            url += `/season/${this.seasonId}/matches/`;
        }

        url = `?sid=${this.selectedServer}`;
        url += `&gid=${this.selectedGametype}`;
        url += `&mid=${this.selectedMap}`;//&pp=${this.perPage}`;
        url+= `&display=${this.selectedDisplayMode}`;

        return url;
    }

    updateURL(){

        const url = this.getURL();

        this.pagination.changeUrl(`${url}&page=`);

        history.pushState({}, "", url);
    }


    async loadData(){

        try{

            if(this.abortController === undefined){

                this.abortController = new AbortController();
            }else{

                this.abortController.abort("New input");
                this.abortController = new AbortController();
            }

            let url = `/json/season-search-matches/`;
            url += `?season=${this.seasonId}&sid=${this.selectedServer}&gid=${this.selectedGametype}`;
            url += `&mid=${this.selectedMap}&page=${this.page}&pp=${this.perPage}`;

            const req = await fetch(url, {
                "signal": this.abortController.signal
            });

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            this.matches = res;
            this.content.innerHTML = ``;

   

            this.render();
            this.pagination.updateResults(this.page, this.matches.total, this.perPage);




        }catch(err){

            if(err.name === "AbortError") return;
            console.trace(err);

            new UINotification(this.parent, "error", "Failed To Load Data", err.toString());
        }
    }

    createForm(){

        this.form = UIDiv("form");

        this.serverRow = UIDiv("form-row");
        this.serverRow.append(UILabel("Server"));

        this.serverSelect = new UISelect(this.serverRow, this.getOptions("servers"), this.selectedServer, (e) =>{

            this.selectedServer = parseInt(e);

            const newOptionsGametypes = this.getOptions("gametypes");

            if(!this.gametypeSelect.updateOptions(newOptionsGametypes, this.selectedGametype) && newOptionsGametypes.length > 0){
                this.selectedGametype = newOptionsGametypes[0].value;
                this.gametypeSelect.changeSelected(this.selectedGametype);
            }

            const newOptionsMaps = this.getOptions("maps");

            if(!this.mapSelect.updateOptions(newOptionsMaps, this.selectedMap) && newOptionsMaps.length > 0){
                this.selectedMap = newOptionsMaps[0].value;
                this.mapSelect.changeSelected(this.selectedMap);
            }

            this.page = 1;
            this.updateURL();
            this.loadData();
        });

        this.gametypeRow = UIDiv("form-row");
        this.gametypeRow.append(UILabel("Gametype"));

        this.gametypeSelect = new UISelect(this.gametypeRow, this.getOptions("gametypes"), this.selectedGametype, (e) =>{

            this.selectedGametype = parseInt(e);
            const newOptions = this.getOptions("maps");

            if(!this.mapSelect.updateOptions(newOptions, this.selectedMap) && newOptions.length > 0){
                this.selectedMap = newOptions[0].value;
                this.mapSelect.changeSelected(this.selectedMap);
            }
            this.page = 1;
            this.updateURL();
            this.loadData();
        });

        this.mapRow = UIDiv("form-row");
        this.mapRow.append(UILabel("Map"));

        this.mapSelect = new UISelect(this.mapRow, this.getOptions("maps"), this.selectedMap, (e) =>{
            this.selectedMap = parseInt(e);
            this.page = 1;
            this.updateURL();
            this.loadData();
        });

        this.displayRow = UIDiv("form-row");
        this.displayRow.append(UILabel("Display Mode"));


        this.displaySelect = new UISelect(this.displayRow, [
            {"display": "Default", "value": "default"},
            {"display": "Table View", "value": "table"},
        ], this.selectedDisplayMode, (e) =>{

            this.selectedDisplayMode = e;
            this.updateURL();
            this.render();
        });

        this.form.append(this.serverRow, this.gametypeRow, this.mapRow, this.displayRow);

        this.wrapper.append(this.form);
    }

    render(){

        this.content.innerHTML = ``;

        if(this.selectedDisplayMode === "default"){
            new MatchesRichView("#matches-content",  this.matches);
        }else{
            //renderMatchesTable("#root", matchData, false, true);
            new renderMatchesTable("#matches-content", this.matches, false, true);
        }
    }
}