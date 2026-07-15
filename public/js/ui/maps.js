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

            const req = await fetch(`/json/map-search/?name=${name}&page=${this.page}&perPage=${this.perPage}`);
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
            {"display": "First Match", "value": "first"},
            {"display": "Last Match", "value": "last"},
            {"display": "Matches", "value": "matches"},
            {"display": "Playtime", "value": "playtime"},
        ];  

        const elem = new UISelect(parent, options, this.sortBy, (e) =>{
            this.sortBy = e;
            this.updateUrl();
            this.renderResults();
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
            this.renderResults();
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

        this.sortData();

        if(this.displayMode === "table") this.renderTable();
        if(this.displayMode === "default") this.renderRichView();

        new UIPagination(
            this.parent, 
            `/maps/?name=${this.nameSearch}&display=${displayMode}&perPage=${perPage}&page=`,
            totalMatches,
            perPage,
            page
        );
    }

    headerToKey(header){

        const headerNames = {
            "Name": "name", 
            "First": "first", 
            "Last": "last", 
            "Matches": "matches", 
            "Playtime": "playtime"
        };

        return headerNames[header] ?? "unknown";

    }

    sortData(){

        let key = "name";

        const sort = this.sortBy.toLowerCase();

        if(sort === "first"){
            key = "first_match";
        }else if(sort === "last"){
            key = "last_match";
        }else if(sort === "matches"){
            key = "matches";
        }else if(sort === "playtime"){
            key = "playtime";
        }

        this.data.sort((a, b) =>{

            a = a[key];
            b = b[key];


            if(!this.bAscOrder){
                if(a > b){
                    return -1;
                }else if(a < b){
                    return 1;
                }
            }else{
                if(a > b){
                    return 1;
                }else if(a < b){
                    return -1;
                }
            }
            return 0;

        });

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

                    this.sortData();
                    this.table.updateRows(this.createRows()); 

                    const order = (this.bAscOrder) ? "ASC" : "DESC";
                    history.pushState(
                            {},
                            "",
                            `/maps/?name=${this.nameSearch}&display=${this.displayMode}&sortBy=${this.sortBy}&order=${order}`
                        );
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

        this.totals = {
            "kills": 0,
            "deaths": 0,
            "suicides": 0,
            "teamKills": 0
        };

        this.setTotals();

        this.createElems();
        this.renderTable();
        
    }

    setTotals(){

        const uniqueGametypes = new Set();

        this.gametypes = [];

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(!uniqueGametypes.has(d.gametype_id)){
                uniqueGametypes.add(d.gametype_id);
                this.gametypes.push({"display": d.gametype_name, "value": d.gametype_id});
            }

            this.totals.kills += d.kills;
            this.totals.deaths += d.deaths;
            this.totals.suicides += d.suicides;
            this.totals.teamKills += d.team_kills;
        }
    }

    createElems(){
        UIHeader(this.parent, "Weapons Summary");

        this.tabs = new UITabs(this.parent, this.gametypes, this.selectedGametype);
        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{

            this.selectedGametype = parseInt(e.detail.newTab);
            this.renderTable();
        });
    }

    renderTable(){

        const headers = [
            "Name", "Deaths", "Suicides", "Team Kills",
            "Kills", "Kills Percentage", "KPM",
        ];

        const tableOptions = {
            "className": "t-width-1",
            "headers": headers.map((h) =>{ return {"display": h}}),
            "footer": [
                {"display": "Totals | MAX"},
                {"display": "SUM", "dataType": "INT", "callback": ignore0},
                {"display": "SUM", "dataType": "INT", "callback": ignore0},
                {"display": "SUM", "dataType": "INT", "callback": ignore0},
                {"display": "SUM", "dataType": "INT", "callback": ignore0},
                {"display": "SUM", "dataType": "FLOAT", "callback": (v) => `${parseFloat(v).toFixed(2)}%`},
                {"display": "MAX", "dataType": "FLOAT", "callback": (v) => parseFloat(v).toFixed(2)},
            ]
        };


        const rows = [];

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(d.gametype_id !== this.selectedGametype) continue;

            let killsPercent = 0;

            if(this.totals.kills > 0 && d.kills > 0){

                killsPercent = d.kills / this.totals.kills * 100;
            }

            rows.push([
                {"display": d.weapon_name,  "value": d.weapon_name.toLowerCase(), "className": "text-left"},
                {"display": ignore0(d.deaths), "value": d.deaths},
                {"display": ignore0(d.suicides), "value": d.suicides},
                {"display": ignore0(d.team_kills), "value": d.team_kills},
                {"display": ignore0(d.kills), "value": d.kills},
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

        this.table = document.createElement("table");
        this.table.className = `t-width-3`;

        const headers = ["Place", "Player", "Playtime", this.title];

        const headerRow = document.createElement("tr");

        for(let i = 0; i < headers.length; i++){
            headerRow.append(UITableHeaderColumn({"content": headers[i]}));
        }

        this.table.append(headerRow);


        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            const row = document.createElement("tr");

            const ordinal = UITableCell({
                "content": i + 1 + (this.perPage * (this.page - 1)), 
                "parse": ["ordinal"], 
                "className": "ordinal"}
            );

            row.append(ordinal);

            row.append(UIPlayerLink({
                "playerId": d.player_id, 
                "name": d.name, 
                "country": d.country, 
                "bTableElem": true, 
                "className": "text-left"
            }));

            row.append(UITableCell({
                "content": d.total_playtime, 
                "parse": ["playtime"], 
                "className": "playtime"
            }));


            const typeSettings = this.getTypeSettings();
  
            row.append(UITableCell({
                "content": d.target_value.toFixed(3), 
                "className": typeSettings?.className ?? null
            }));

            this.table.append(row);
        }

        this.content.append(this.table);
    }

    createOptions(){

        const row = UIDiv("form-row");
        row.append(UILabel("Category","map-average-cat"));

        const select = document.createElement("select");
        select.id = select.name = "map-average-cat";

        this.validTypes.sort((a, b) =>{
            a = a.display.toLowerCase();
            b = b.display.toLowerCase();

            if(a < b) return -1;
            if(a > b) return 1;
            return 0;
        });

        for(let i = 0; i < this.validTypes.length; i++){

            const {value, display} = this.validTypes[i];

            const option = document.createElement("option");
            option.value = value;
            option.innerHTML = display;
            option.selected = value === this.cat;
            select.append(option);
        }

        row.append(select);
        select.addEventListener("change", (e) =>{
            this.cat = e.target.value;
            this.loadData();
        });
        this.wrapper.append(row);
    }

    render(){

        
        this.content.innerHTML = ``;

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
        this.updateSelect();
        this.createTable();

        this.pagination = new UIPagination(this.wrapper, (newPage) =>{

            this.page = newPage;
            this.loadData();

        }, this.totalResults, this.perPage, this.page);
        

        this.loadData();
    }


    updateSelect(){

        if(this.select !== undefined){

            for(let i = 0; i < this.gametypes.length; i++){

                const {id, name} = this.gametypes[i];

                const option = document.createElement("option");
                option.value = id;
                option.append(document.createTextNode((name === null) ? "All Time" : name));
                this.select.append(option);
            }

            return;
        }
        const row = UIDiv("form-row");
        this.select = document.createElement("select");
        this.select.id = this.select.name = "league-selected-gametype";

        row.append(UILabel("Gametype", "league-selected-gametype"));
        row.append(this.select);

        this.select.addEventListener("change", (e) =>{
            this.gametypeId = e.target.value;
            this.page = 1;
            this.loadData();
        });

        this.wrapper.append(row);

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
            this.pagination.updateResults(this.page, this.totalResults, this.perPage);
            this.render();

        }catch(err){

            console.trace(err);

            new UINotification(this.parent, "error", "Failed To Load CTF League Data", err.toString());
        }
    }

    createTable(){

        this.table = document.createElement("table");
        this.table.className = "t-width-1";
    

        this.wrapper.append(this.table);
    }

    render(){

        this.table.innerHTML = ``;



        const headers = [
            "Place", "Player", "Played", "Wins",
            "Draws", "Losses", "Caps For", "Caps Against",
            "Caps Offset", "Points"
        ];

        const headerRow = document.createElement("tr");

        for(let i = 0; i < headers.length; i++){
            headerRow.append(UITableHeaderColumn({"content": headers[i]}));
        }

        this.table.append(headerRow);

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            const row = document.createElement("tr");
            
            row.append(UITableCell({
                "content": i + 1 + (this.perPage * (this.page - 1)), 
                "parse": ["ordinal"],
                "className": "ordinal"
            }));

            row.append(UIPlayerLink({
                "playerId": d.player_id, 
                "name": d.name, 
                "country": d.country,
                "bTableElem": true
            }));
            

            row.append(UITableCell({"content": d.total_matches}));
            row.append(UITableCell({"content": d.wins, "parse": ["ignore0"]}));
            row.append(UITableCell({"content": d.draws, "parse": ["ignore0"]}));
            row.append(UITableCell({"content": d.losses, "parse": ["ignore0"]}));
            row.append(UITableCell({"content": d.cap_for, "parse": ["ignore0"]}));
            row.append(UITableCell({"content": d.cap_against, "parse": ["ignore0"]}));
            row.append(UITableCell({"content": (d.cap_offset > 0) ? `+${d.cap_offset}` : d.cap_offset, "parse": ["ignore0"]}));
            row.append(UITableCell({"content": d.points, "parse": ["ignore0"]}));

            this.table.append(row);
        }
    }
}