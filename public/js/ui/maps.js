class MapsSearchForm{

    constructor(parent, nameSearch, sortBy, order, displayMode, page, perPage, maps, totalMatches){

        this.parent = document.querySelector(parent);
        this.nameSearch = decodeHTML(nameSearch);
        this.displayMode = displayMode;
        this.perPage = perPage;
        this.page = page;
        this.sortBy = sortBy;
        this.order = order;

        this.displayModes = [
            {"display": "Default", "value": "default"},
            {"display": "Table", "value": "table"},
        ];

        this.createForm(); 

        this.resultWrapper = UIDiv();

        this.parent.append(this.resultWrapper);

        this.maps = maps;
        this.totalMatches = totalMatches;
        this.renderResults();
    }

    renderResults(){

        this.resultWrapper.innerHTML = ``;

        const display = new MapListDisplay(
            this.resultWrapper,
            this.maps, 
            this.totalMatches, 
            this.nameSearch, 
            this.displayMode,
            this.page, 
            this.perPage,
            this.sortBy,
            this.order
        );   
    }

    async loadData(){

        try{

            const name = encodeURIComponent(this.nameSearch);

            const req = await fetch(`/json/map-search/?name=${name}&order=${this.order}&sortBy=${this.sortBy}&page=${this.page}&perPage=${this.perPage}`);
            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);


            this.maps = res.maps;
            this.totalMatches = res.totalMatches;

            this.renderResults();

        }catch(err){
            console.trace(err);
            new UINotification(this.parent, "error", "Failed To Load Data", err.toString());
        }
    }

    createSortBySelect(parent){

        const options = [
            {"display": "Name", "value": "name"},
            {"display": "First Match", "value": "first_match"},
            {"display": "Last Match", "value": "last_match"},
            {"display": "Matches", "value": "matches"},
            {"display": "Playtime", "value": "playtime"},
        ];  

        const elem = new UISelect(parent, options, this.sortBy, (e) =>{
            this.sortBy = e;
            this.updateUrl();
            this.loadData();
        });
    }

    createForm(){

        this.form = UIDiv("form")

        const nameRow = UIDiv("form-row");

        const nameLabel = UILabel("Name", "name");
   
        const nameElem = UIInput("text", "name", this.nameSearch, "Search for a map...", (e) =>{
            this.nameSearch = e;
            this.updateUrl();
            this.loadData();
        })

        nameRow.append(nameLabel, nameElem);

        this.form.append(nameRow);

        const sortByRow = UIDiv("form-row");
        sortByRow.append(UILabel("Sort By"));


        this.createSortBySelect(sortByRow);


        const orderRow = UIDiv("form-row");
        orderRow.append(UILabel("Order"));

        new UIOrderSelect(orderRow, this.order, (e) =>{
            this.order = e;
            this.updateUrl();
            this.loadData();
        });

        this.form.append(sortByRow, orderRow);

        const displayRow = UIDiv("form-row");

        const displayLabel = UILabel("Display Mode", "display");

        displayRow.append(displayLabel);

        const displayElem = new UISelect(displayRow, this.displayModes, this.displayMode, (e) =>{
            this.displayMode = e;
            this.updateUrl();
            this.renderResults();
        }, "display");

        this.form.append(displayRow);

        this.parent.append(this.form);

    }

    updateUrl(){
        //window.location = `/maps/?name=${this.nameSearch}&display=${this.displayMode}&sortBy=${this.sortBy}&order=${this.order}`;
        history.pushState(
            {},"",
            `/maps/?name=${this.nameSearch}&display=${this.displayMode}&sortBy=${this.sortBy}&order=${this.order}`);
    }
}


class MapListDisplay{

    constructor(parent, data, totalMatches, nameSearch, displayMode, page, perPage, sortBy, order){

        if(data.length === 0){

            const content = [];
            
            if(nameSearch !== ""){
                content.push(`No maps found when searching for "${nameSearch}"`);
            }else{
                content.push(`No maps in database.`);
            }

            new UIInfo(parent, content);
            return;   
        }

        this.nameSearch = nameSearch; 
        this.parent = parent;
        this.data = data;
        this.displayMode = displayMode.toLowerCase();     
        this.sortBy = sortBy;
        this.bAscOrder = order === "ASC";


        if(this.displayMode === "table") this.renderTable();
        if(this.displayMode === "default") this.renderRichView();

        new UIPagination(
            this.parent, 
            `/maps/?name=${this.nameSearch}&display=${displayMode}&sortBy=${this.sortBy}&order=${order}&perPage=${perPage}&page=`,
            totalMatches,
            perPage,
            page
        );
    }

    headerToKey(header){

        const headerNames = {
            "Name": "name", 
            "First": "first_match", 
            "Last": "last_match", 
            "Matches": "matches", 
            "Playtime": "playtime"
        };

        return headerNames[header] ?? "unknown";

    }

    createRows(){

        const rows = [];

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            const url = `/map/${d.id}`;

            rows.push([
                {"display": d.name, "value": d.name.toLowerCase(), "className": "text-left", url},
                {"value": d.first_match, "display": toDateString(d.first_match, true), "className": "date", url},
                {"value": d.last_match, "display": toDateString(d.last_match, true), "className": "date", url},
                {"value": d.matches, url},
                {"value": d.playtime, "display": toPlaytime(d.playtime), "className": "playtime", url}
            ]);
        }

        return rows;
    }

    renderTable(){

  
        const headers = ["Name", "First", "Last", "Matches", "Playtime"];


        const tableOptions = {
            "className": "t-width-1",
            "bNoSort": true,
            "headers": headers.map((h) =>{ 
                return {"display": h, "callback": () =>{ 

                    const targetKey = this.headerToKey(h);

                    if(targetKey === this.sortBy){
                        this.bAscOrder = !this.bAscOrder;
                    }else{
                        this.bAscOrder = true;
                    }
       
                    this.sortBy = targetKey;

                    const order = (this.bAscOrder) ? "ASC" : "DESC";
                    window.location = `/maps/?name=${this.nameSearch}&display=${this.displayMode}&sortBy=${this.sortBy}&order=${order}`;
         
                }
            }
         })};

        this.table = new TESTUITable(this.parent, tableOptions, this.createRows());
    }

    renderRichView(){

        const wrapper = UIDiv("rich-outter");
        this.parent.append(wrapper);

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            wrapper.append(UIMapRichBox(d));
        }
    }
}

function UIMapImage(parent, image, requiredImageName){

    parent = document.querySelector(parent);

    const wrapper = UIDiv("text-center");

    if(image === "default.jpg"){

        wrapper.className = "error";
        wrapper.append(
            `Map doesn't have a screenshot, required screenshot name is:`, 
            UIBr(), 
            UIB(`${requiredImageName}.jpg`), 
            UIBr()
        );

    }else{

        const img = document.createElement("img");
        img.className = "map-sshot";
        img.src = `../images/maps/${image}`;
        img.alt = "Map Screenshot";

        wrapper.append(img);
    }

    parent.append(wrapper);
}

function UIMapBasicSummary(parent, data){

    parent = document.querySelector(parent);

    UIHeader(parent, "Basic Summary");

    const headers = ["First Match", "Last Match", "Matches Played", "Playtime"];

    const row = [
        {"display": toDateString(data.first_match), "value": data.first_match, "className": "date"},
        {"display": toDateString(data.last_match), "value": data.last_match, "className": "date"},
        {"value": data.matches},
        {"display": toPlaytime(data.playtime), "value": data.playtime, "className": "date"},
    ];

    const tableOptions = {
        "className": "t-width-1",
        "headers": headers.map((h) =>{ return {"display": h}})
    };

    new TESTUITable(parent, tableOptions, [row]);

}


class UIMapRecentMatches{

    constructor(parent, mapId){

        this.parent = document.querySelector(parent);
        this.mapId = parseInt(mapId);

        this.page = 1;
        this.perPage = 25;

        this.data = [];
        this.totalMatches = 0;


        UIHeader(this.parent, "Recent Matches");
        this.wrapper = UIDiv();
        this.wrapper.id = "map-recent-matches";
        this.parent.append(this.wrapper);

        this.pagination = new UIPagination(this.wrapper, async (newPage) =>{
            this.page = newPage;
            await this.loadData();
        }, this.totalMatches, this.perPage, this.page);
    

        this.loadData();
    }

    async loadData(){

        try{

            const req = await fetch(`/json/map-recent-matches/?id=${this.mapId}&page=${this.page}&perPage=${this.perPage}`);

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            this.data = res.data;
            this.totalMatches = res.totalResults;

            this.render();

        }catch(err){
            console.trace(err);
            new UINotification(this.parent, "error", "Failed To Load Recent Matches", err.toString());
        }
    }


    render(){

        this.wrapper.innerHTML = ``;
        
        renderMatchesTable("#map-recent-matches", {"data": this.data}, true);
   
        this.pagination.updateResults(this.page, this.totalMatches, this.perPage);
        
    }
}


class UIMapWeaponsSummary{

    constructor(parent, data){

        if(data === null) return;
        this.parent = document.querySelector(parent);
        this.data = data;
        this.selectedGametype = 0;

        this.totals = {};

        this.setTotals();

        this.createElems();
        this.renderTable();
        
    }

    updateTotal(gametypeId, currentData){

        this.totals[gametypeId].kills += currentData.kills;
        this.totals[gametypeId].deaths += currentData.deaths;
        this.totals[gametypeId].suicides += currentData.suicides;
        this.totals[gametypeId].teamKills += currentData.team_kills;
    }

    setTotals(){

        const uniqueGametypes = new Set();

        this.gametypes = [];

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];
            const gametypeId = d.gametype_id;

            if(!uniqueGametypes.has(gametypeId)){
                uniqueGametypes.add(gametypeId);
                this.gametypes.push({"display": d.gametype_name, "value": gametypeId});
            }

            if(this.totals[gametypeId] === undefined){
                this.totals[gametypeId] = {
                    "kills": 0,
                    "deaths": 0,
                    "suicides": 0,
                    "teamKills": 0
                };
            }

            this.updateTotal(gametypeId, d);
    
        }


    }

    createElems(){

        UIHeader(this.parent, "Weapons Summary");

        

        this.tabs = new UITabs(this.parent, this.gametypes, this.selectedGametype);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{

            this.selectedGametype = parseInt(e.detail.newTab);
            this.renderTable();
        });

        this.info = new UIInfo(this.parent, [
            UIB("Deaths, Suicides, Team Kills, Kills:"), 
            " are totals from all matches played with matching map and gametype.",
            UIBr(),
            UIB("Max Suicides/Kills/Deaths "),
            " are the highest total values recorded in a single match.",
            UIBr(),
            UIB("KPM "), "is kills per minute.", UIBr(),
            UIB("Kills Precentage"), " is the percentage of kills made with each weapon compared to the total of all weapons."
        
        ]);
    }

    renderTable(){

        const headers = [
            "Name", "Deaths", "Max Deaths", "Suicides", "Max Suicides", "Team Kills",
            "Kills", "Max Kills", "Kills Percentage", "KPM",
        ];

        const tableOptions = {
            "className": "t-width-1",
            "headers": headers.map((h) =>{ return {"display": h}}),
            "footer": [
                {"display": "Totals | MAX"},
                {"display": "SUM", "dataType": "INT", "callback": ignore0},
                {"display": "MAX", "dataType": "INT", "callback": ignore0},
                {"display": "SUM", "dataType": "INT", "callback": ignore0},
                {"display": "MAX", "dataType": "INT", "callback": ignore0},
                {"display": "SUM", "dataType": "INT", "callback": ignore0},
                {"display": "SUM", "dataType": "INT", "callback": ignore0},
                {"display": "MAX", "dataType": "INT", "callback": ignore0},
                {"display": "SUM", "dataType": "FLOAT", "callback": (v) => `${parseFloat(v).toFixed(2)}%`},
                {"display": "SUM", "dataType": "FLOAT", "callback": (v) => parseFloat(v).toFixed(3)},
            ]
        };


        const rows = [];

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(d.gametype_id !== this.selectedGametype) continue;

            let killsPercent = 0;

            const gametype = (this.selectedGametype === 0) ? 0 : d.gametype_id;

            const totalKills = this.totals[gametype].kills;

            if(totalKills > 0 && d.kills > 0){

                killsPercent = d.kills / totalKills * 100;
            }

            rows.push([
                {"display": d.weapon_name,  "value": d.weapon_name.toLowerCase(), "className": "text-left"},
                {"display": ignore0(d.deaths), "value": d.deaths},
                {"display": ignore0(d.max_deaths), "value": d.max_deaths},
                {"display": ignore0(d.suicides), "value": d.suicides},
                {"display": ignore0(d.max_suicides), "value": d.max_suicides},
                {"display": ignore0(d.team_kills), "value": d.team_kills},
                {"display": ignore0(d.kills), "value": d.kills},
                {"display": ignore0(d.max_kills), "value": d.max_kills},
                {"display": `${killsPercent.toFixed(2)}%`, "value": killsPercent},
                {"display": d.kills_per_min.toFixed(3), "value": d.kills_per_min},
                    
            ]);
        }

        if(this.table === undefined){
            this.table = new TESTUITable(this.parent, tableOptions, rows);
        }else{
            this.table.updateRows(rows);
        }

    }
}

class UIMapPlayerRankings{

    constructor(parent, mapId){

        this.parent = document.querySelector(parent);
        this.mapId = parseInt(mapId);

        this.page = 1;
        this.perPage = 10;
        this.data = [];
        this.totalMatches = 0;
        this.timeRange = 180;

        this.wrapper = UIDiv();
        UIHeader(this.wrapper, "Player Rankings");

        this.parent.append(this.wrapper);

        this.info = new UIInfo(this.wrapper, []);
        this.renderInfo();

        this.content = UIDiv();
        this.parent.append(this.content);

        this.loadData();
    }

    async loadData(){

        try{

            const urlParts = `${this.mapId}&timeRange=${this.timeRange}&page=${this.page}&perPage=${this.perPage}`;
            const req = await fetch(`/json/map-rankings/?id=${urlParts}`);

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);


            this.data = res.data;
            this.totalMatches = res.totalResults;
            

            this.render();

        }catch(err){
            console.trace(err);

            new UINotification(this.parent, "error", "Failed To Load Player Rankings", err.toString());
        }
    }

    renderInfo(){


        this.info.updateContent([`Ranking based on players who have been active in the last ${this.timeRange} days.`]);
    }

    renderTable(){

        const headers = ["Place", "Name", "Last Active", "Playtime", "Matches", "Score"];

        const tableOptions = {
            "className": "t-width-1",
            "headers": headers.map((h) =>{ return {"display": h}}),
            "bNoSort": true
        };

        const rows = [];

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];
            const place = i + 1 + this.perPage * (this.page - 1);

            rows.push([
                {"display": `${place}${getOrdinal(place)}`, "value": place, "className": "ordinal"},
                {
                    "display": UIPlayerLink(
                        {
                            "playerId": d.player_id, 
                            "name": d.name, 
                            "country": d.country, 
                            "bTableElem": true
                        }), 
                    "bSkipTD": true
                },
                {"display": toDateString(d.last_active), "className": "date"},
                {"display": toPlaytime(d.playtime), "className": "playtime"},
                {"display": d.matches},
                {"display": `${d.score.toFixed(2)}`},
            ]);
        }
        

        if(this.table === undefined){
            this.table = new TESTUITable(this.content, tableOptions, rows);
        }else{

            this.table.updateRows(rows);
        }

    }

    render(){

        if(this.totalMatches === 0){

            new UIInfo(this.content, [`There are no player rankings data within the timeframe.`]);
            return;
        }
        

        this.renderTable();

        if(this.pagination === undefined){

            this.pagination = new UIPagination(this.content, async (newPage) =>{

                this.page = newPage;
                await this.loadData();
                
            }, this.totalMatches, this.perPage, this.page);
        }else{
            this.pagination.updateResults(this.page, this.totalMatches, this.perPage);
        }
    }
}

class UIMapPlayerAverages{

    constructor(parent, mapId, validTypes){

        this.parent = document.querySelector(parent);
        this.mapId = parseInt(mapId);
        this.perPage = 10;
        this.page = 1;
        this.cat = "kills";
        this.title = "Kills";
        this.validTypes = validTypes;

        this.data = [];
        this.totalResults = 0;

        this.wrapper = UIDiv();
        this.parent.append(this.wrapper);

        UIHeader(this.wrapper, "Top Player Averages");
        this.createOptions();
        this.content = UIDiv();
        this.wrapper.append(this.content);

        this.pagination = new UIPagination(this.wrapper, async (newPage) =>{ 

            if(newPage === this.page) return;

            this.page = newPage;
            this.loadData();

        }, this.totalResults, this.perPage, this.page);

        this.loadData();

    }

    async loadData(){

        try{


            const urlParts = `${this.mapId}&page=${this.page}&perPage=${this.perPage}&cat=${this.cat}`;

            const req = await fetch(`/json/map-player-averages/?id=${urlParts}`);

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            this.data = res.data;
            this.totalResults = res.totalEntries;
            this.title = res.title;
            this.pagination.updateResults(this.page, this.totalResults, this.perPage);

            this.render();

        }catch(err){
            console.trace(err);
            new UINotification(this.parent, "error", "Failed To Load Player Averages Data", err.toString());
        }
    }


    getTypeSettings(){

        for(let i = 0; i < this.validTypes.length; i++){

            const t = this.validTypes[i];

            if(t.value === this.cat) return t;
        }

        return null;
    }

    renderTable(){

        const headers = ["Place", "Player", "Playtime", this.title];

        const tableOptions = {
            "className": "t-width-1",
            "headers": headers.map((h) =>{ return {"display": h}}),
            "bNoSort": true
        };

        const rows = [];

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            const place = i + 1 + (this.perPage * (this.page - 1));  
            const typeSettings = this.getTypeSettings();

            const row = [
                {
                    "display": `${place}${getOrdinal(place)}`,
                    "className": "ordinal"
                },
                {
                    "bSkipTD": true, 
                    "display": UIPlayerLink({
                        "playerId": d.player_id, 
                        "name": d.name, 
                        "country": d.country, 
                        "bTableElem": true, 
                        "className": "text-left"
                    })
                }, 
                {
                    "display": toPlaytime(d.total_playtime),
                    "className": "playtime"
                },
                {
                    "display": d.target_value.toFixed(3),
                    "className": typeSettings?.className ?? null
                }
            ];
            rows.push(row);
        }

        if(this.table === undefined){

            this.table = new TESTUITable(this.content, tableOptions, rows);
        }else{
            this.table.updateRows(rows, tableOptions.headers);
        }

    }

    createOptions(){

        const row = UIDiv("form-row");
        row.append(UILabel("Category","map-average-cat"));

        this.validTypes.sort((a, b) =>{
            a = a.display.toLowerCase();
            b = b.display.toLowerCase();

            if(a < b) return -1;
            if(a > b) return 1;
            return 0;
        });


        this.select = new UISelect(row, this.validTypes, this.cat, (e) =>{
            this.cat = e;
            this.page = 1;
            this.loadData();
        }, "map-average-cat", "map-average-cat");

        this.wrapper.append(row);
    }

    render(){

        this.renderTable();
    }
}


class UIMapCTFLeague{

    constructor(parent, mapId, pageSettings, leagueSettings){

        this.parent = document.querySelector(parent);
        this.mapId = mapId;
        this.gametypeId = 0;
        this.pageSettings = pageSettings;
        this.leagueSettings = leagueSettings;
        this.page = 1;
        this.perPage = 10;
        this.timeRange = this.leagueSettings?.["Maximum Match Age In Days"].value ?? 180;
        this.bLoadedGametypes = false;
        this.data = [];
        this.totalResults = 0;
        this.bNoDataFound = false;
        if(this.pageSettings["Display CTF League"] === "0") return;

        this.wrapper = UIDiv("hidden");
        UIHeader(this.wrapper, "Player CTF League");
        
        this.parent.append(this.wrapper);
        
        

        this.loadData();
    }


    updateSelect(){
        
        const gametypeOptions = this.gametypes.map((g) =>{ return {
            "display": (g.name === null) ? "All Time" : g.name, 
            "value": g.id
        }});

        if(this.gametypeSelect === undefined){

            const row = UIDiv("form-row");
            this.wrapper.append(row);

            row.append(UILabel("Gametype", "league-selected-gametype"));

            this.gametypeSelect = new UISelect(row, gametypeOptions, this.gametypeId, (e) =>{
                this.gametypeId = parseInt(e);
                this.page = 1;
                this.loadData();
            }, "league-selected-gametype", "league-selected-gametype");
        }else{

            this.gametypeSelect.updateOptions(gametypeOptions, this.gametypeId);
        }
    }

    async loadGametypes(){

        try{

            const req = await fetch(`/json/map-ctf-league-gametypes/?mapId=${this.mapId}&range=${this.timeRange}`);

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            if(res.data.length > 0){
                this.wrapper.className = "";   
            }else{
                this.bNoDataFound = true;
            }

            this.gametypes = res.data;
            this.bLoadedGametypes = true;
            this.updateSelect();

        }catch(err){
            new UINotification(this.parent, "error", "Failed To Load CTF League Data Played Gametypes", err.toString());
        }
    }

    async loadData(){

        try{

            if(!this.bLoadedGametypes){
                await this.loadGametypes();
            }

            if(this.bNoDataFound) return;

            const urlParts = `${this.mapId}&gametypeId=${this.gametypeId}&page=${this.page}&perPage=${this.perPage}&range=${this.timeRange}`;
     
            const req = await fetch(`/json/map-ctf-league/?mapId=${urlParts}`);

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);
            this.data = res.data.data;
            this.totalResults = res.data.totalResults;
            
            this.render();

        }catch(err){

            console.trace(err);

            new UINotification(this.parent, "error", "Failed To Load CTF League Data", err.toString());
        }
    }


    updatePagination(){

        if(this.pagination === undefined){

            this.pagination = new UIPagination(this.wrapper, (newPage) =>{

                this.page = newPage;
                this.loadData();

            }, this.totalResults, this.perPage, this.page);

        }else{

            this.pagination.updateResults(this.page, this.totalResults, this.perPage);
        }
    }

    render(){

        this.updateSelect();
        
        const rows = [];

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];


            const place = i + 1 + (this.perPage * (this.page - 1));
            const row = [
                {
                    "display": `${place}${getOrdinal(place)}`,
                    "className": "ordinal"
                },
                {
                    "display": UIPlayerLink({
                        "playerId": d.player_id, 
                        "name": d.name, 
                        "country": d.country,
                        "bTableElem": true
                    })
                },
                {"display": d.total_matches},
                {"display": ignore0(d.wins)},
                {"display": ignore0(d.draws)},
                {"display": ignore0(d.losses)},
                {"display": ignore0(d.cap_for)},
                {"display": ignore0(d.cap_against)},
                {"display": ignore0((d.cap_offset > 0) ? `+${d.cap_offset}` : d.cap_offset)},
                {"display": ignore0(d.points)}
            ];


            rows.push(row);
        }

        if(this.table === undefined){

            const headers = [
                "Place", "Player", "Played", "Wins",
                "Draws", "Losses", "Caps For", "Caps Against",
                "Caps Offset", "Points"
            ];

            const tableOptions = {
                "headers": headers.map((h) => { return {"display": h}}),
                "bNoSort": true,
                "className": "t-width-1"
            };

            this.table = new TESTUITable(this.wrapper, tableOptions, rows);
        }else{

            this.table.updateRows(rows);
        }

        this.updatePagination();
    }
}