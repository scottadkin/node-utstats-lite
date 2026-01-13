class MapsSearchForm{

    constructor(parent, nameSearch, displayMode){


        this.parent = document.querySelector(parent);
        this.nameSearch = decodeHTML(nameSearch);
        this.displayMode = displayMode;

        this.displayModes = [
            {"display": "Default", "value": "default"},
            {"display": "Table", "value": "table"},
        ];

        
        this.createForm(); 
    }

    createForm(){

        this.form = document.createElement("form");
        this.form.className = "form";
        this.form.action = "/maps/";
        this.form.method = "GET";

        const nameRow = document.createElement("div");
        nameRow.className = "form-row";

        const nameLabel = document.createElement("label");
        nameLabel.innerHTML = "Name";
        nameLabel.htmlFor = "name";
        nameRow.appendChild(nameLabel);

        const nameElem = document.createElement("input");
        nameElem.type = "text";
        nameElem.className = "textbox";
        nameElem.placeholder = "Search for a map...";
        nameElem.id = "name";
        nameElem.name = "name";
        nameElem.value = this.nameSearch;

        nameRow.appendChild(nameElem);

        this.form.appendChild(nameRow);

        const displayRow = document.createElement("div");
        displayRow.className = "form-row";

        const displayLabel = document.createElement("label");
        displayLabel.innerHTML = "Display Mode";
        displayLabel.htmlFor = "display";

        displayRow.appendChild(displayLabel);

        const displayElem = document.createElement("select");
        displayElem.className = "default-select";
        displayElem.name = "display";
        displayElem.id = "display";

        for(let i = 0; i < this.displayModes.length; i++){

            const {display, value} = this.displayModes[i];

            const option = document.createElement("option");
            option.value = value;
            option.innerHTML = display;

            if(value == this.displayMode) option.selected = true;
            displayElem.appendChild(option);
        }

        displayRow.appendChild(displayElem);
        this.form.appendChild(displayRow);

        const submit = document.createElement("input");
        submit.type = "submit";
        submit.className = "submit-button";
        submit.value = "Search";

        this.form.appendChild(submit);
        this.parent.appendChild(this.form);

    }
}


class MapListDisplay{

    constructor(parent, data, displayMode){

        if(data.length === 0) return;
        
        this.parent = document.querySelector(parent);
        this.data = data;
        this.displayMode = displayMode.toLowerCase();

        if(this.displayMode === "table") this.renderTable();
        if(this.displayMode === "default") this.renderRichView();
    }

    renderTable(){

        const table = document.createElement("table");
        table.className = "t-width-1";

        const headers = ["Name", "First", "Last", "Matches", "Playtime"];

        const headerRow = document.createElement("tr");

        for(let i = 0; i < headers.length; i++){

            headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}))
        }

        table.appendChild(headerRow);

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            const row = document.createElement("tr");

            const url = `/map/${d.id}`;

            row.appendChild(UITableColumn({"content": d.name, "className": "text-left", url}));
            row.appendChild(UITableColumn({"content": d.first_match, "parse": ["date"], "className": "date", url}));
            row.appendChild(UITableColumn({"content": d.last_match, "parse": ["date"], "className": "date", url}));
            row.appendChild(UITableColumn({"content": d.matches, url}));
            row.appendChild(UITableColumn({"content": d.playtime, "parse": ["playtime"], "className": "playtime", url}));

            table.appendChild(row);

        }

        this.parent.appendChild(table);
    }


    createRichBox(data){

        const link = document.createElement("a");
        link.href = `/map/${data.id}`;

        const wrapper = document.createElement("div");
        wrapper.className = "rich-wrapper";

        const title = document.createElement("div");
        title.className = "rich-title";
        title.appendChild(document.createTextNode(data.name));

        wrapper.appendChild(title);

        const image = document.createElement("img");
        image.className = "rich-image";
        image.src = `/images/maps/${data.image}`;
        wrapper.appendChild(image);

        const info = document.createElement("div");
        info.className = "rich-info";
        info.appendChild(document.createTextNode(`${data.matches} Match${(data.matches === 1) ? "" : "es"} Played`));

        info.appendChild(document.createElement("br"));
        info.appendChild(document.createTextNode(`Playtime ${toPlaytime(data.playtime)}`));
        info.appendChild(document.createElement("br"));
        info.appendChild(document.createTextNode(`Last Match ${toDateString(data.last_match, true)}`));

        wrapper.appendChild(info);

        link.appendChild(wrapper);
        return link;
    }

    renderRichView(){


        const wrapper = document.createElement("div");
        wrapper.className = "rich-outter";

        this.parent.appendChild(wrapper);

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            wrapper.appendChild(this.createRichBox(d));
        }
    }
}

function UIMapImage(parent, image){

    if(image === "default.jpg") return;

    parent = document.querySelector(parent);

    const wrapper = UIDiv();
    wrapper.className = "text-center";

    const img = document.createElement("img");
    img.className = "map-sshot";
    img.src = `../images/maps/${image}`;
    img.alt = "Map Screenshot";

    wrapper.appendChild(img);

    parent.appendChild(wrapper);
}

function UIMapBasicSummary(parent, data){

    parent = document.querySelector(parent);

    UIHeader(parent, "Basic Summary");

    const table = document.createElement("table");
    table.className = "t-width-4";

    const headers = ["First Match", "Last Match", "Matches Played", "Playtime"];

    const headerRow = document.createElement("tr");

    for(let i = 0; i < headers.length; i++){

        headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
    }

    table.appendChild(headerRow);

    const row = document.createElement("tr");

    row.appendChild(UITableColumn({"content": data.first_match, "parse": ["date"], "className": "date"}));
    row.appendChild(UITableColumn({"content": data.last_match, "parse": ["date"], "className": "date"}));
    row.appendChild(UITableColumn({"content": data.matches}));
    row.appendChild(UITableColumn({"content": data.playtime, "parse": ["playtime"], "className": "playtime"}));

    table.appendChild(row);
    parent.appendChild(table);
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
        this.parent.appendChild(this.wrapper);

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


function UIMapWeaponsSummary(parent, data){

    parent = document.querySelector(parent);
    UIHeader(parent, "Weapons Summary");
    data.weapons.sort((a, b) =>{
        a = a.name.toLowerCase();
        b = b.name.toLowerCase();

        if(a < b) return -1;
        if(a > b) return 1;
        return 0;
    });

    const table = document.createElement("table");
    table.className = "t-width-1";

    const headerRow = document.createElement("tr");

    const headers = [
        "Name", "Deaths", "Suicides", "Team Kills",
        "Kills", "Kills Percentage", "KPM",
    ];


    for(let i = 0; i < headers.length; i++){
        headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
    }

    table.appendChild(headerRow);

    for(let i = 0; i < data.weapons.length; i++){

        const d = data.weapons[i];

        let killsPercent = 0;

        if(data.totals.kills > 0 && d.kills > 0){

            killsPercent = d.kills / data.totals.kills * 100;
        }

        const row = document.createElement("tr");

        row.appendChild(UITableColumn({"content": d.name, "className": "text-left"}));
        row.appendChild(UITableColumn({"content": d.deaths, "parse": ["ignore0"]}));
        row.appendChild(UITableColumn({"content": d.suicides, "parse": ["ignore0"]}));
        row.appendChild(UITableColumn({"content": d.team_kills, "parse": ["ignore0"]}));
        row.appendChild(UITableColumn({"content": d.kills, "parse": ["ignore0"]}));
        row.appendChild(UITableColumn({"content": `${killsPercent.toFixed(2)}%`}));
        row.appendChild(UITableColumn({"content": d.kills_per_min.toFixed(3)}));

        table.appendChild(row);

    }

    parent.appendChild(table);
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

        this.parent.appendChild(this.wrapper);

        this.info = UIDiv("info");
        this.wrapper.appendChild(this.info);
        this.renderInfo();

        this.content = UIDiv();
        this.parent.appendChild(this.content);

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

        this.info.innerHTML = ``;

        this.info.innerHTML = `Ranking based on players who have been active in the last ${this.timeRange} days.`;
    }

    renderTable(){

        this.table = document.createElement("table");
        this.table.className = "t-width-1";
        this.content.appendChild(this.table);
 
        const headers = ["Place", "Name", "Last Active", "Playtime", "Matches", "Score"];

        const headerRow = document.createElement("tr");

        for(let i = 0; i < headers.length; i++){
            
            headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
        }

        this.table.appendChild(headerRow);

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            const row = document.createElement("tr");

            const place = i + 1 + this.perPage * (this.page - 1);

            row.appendChild(UITableColumn({"content": place, "parse": ["ordinal"], "className": "ordinal"}));
            row.appendChild(UIPlayerLink({"playerId": d.player_id, "name": d.name, "country": d.country, "bTableElem": true}));
            row.appendChild(UITableColumn({"content": d.last_active, "parse": ["date"], "className": "date"}));
            row.appendChild(UITableColumn({"content": d.playtime, "parse": ["playtime"], "className": "playtime"}));
            row.appendChild(UITableColumn({"content": d.matches}));
            row.appendChild(UITableColumn({"content": d.score.toFixed(2)}));

            this.table.appendChild(row);
        }

    }

    render(){

        if(this.totalMatches === 0){
            const none = UIDiv("info");
            none.innerHTML = `There are no player rankings data within the timeframe.`;
            this.content.appendChild(none);
            return;
        }

       
        this.content.innerHTML = ``;
        

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
        this.parent.appendChild(this.wrapper);

        UIHeader(this.wrapper, "Top Player Averages");
        this.createOptions();
        this.content = UIDiv();
        this.parent.appendChild(this.content);

        this.pagination = new UIPagination(this.parent, async (newPage) =>{ 

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
            headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
        }

        this.table.appendChild(headerRow);


        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            const row = document.createElement("tr");

            const ordinal = UITableColumn({
                "content": i + 1 + (this.perPage * (this.page - 1)), 
                "parse": ["ordinal"], 
                "className": "ordinal"}
            );

            row.appendChild(ordinal);

            row.appendChild(UIPlayerLink({
                "playerId": d.player_id, 
                "name": d.name, 
                "country": d.country, 
                "bTableElem": true, 
                "className": "text-left"
            }));

            row.appendChild(UITableColumn({
                "content": d.total_playtime, 
                "parse": ["playtime"], 
                "className": "playtime"
            }));


            const typeSettings = this.getTypeSettings();
  
            row.appendChild(UITableColumn({
                "content": d.target_value.toFixed(3), 
                "className": typeSettings?.className ?? null
            }));

            this.table.appendChild(row);
        }

        this.content.appendChild(this.table);
    }

    createOptions(){

        const row = UIDiv("form-row");
        row.appendChild(UILabel("Category","map-average-cat"));

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
            select.appendChild(option);
        }

        row.appendChild(select);
        select.addEventListener("change", (e) =>{
            this.cat = e.target.value;
            this.loadData();
        });
        this.parent.appendChild(row);
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
        if(this.pageSettings["Display CTF League"] === "0") return;

        this.wrapper = UIDiv();
        UIHeader(this.wrapper, "Player CTF League");
        
        this.parent.appendChild(this.wrapper);
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
                option.appendChild(document.createTextNode((name === null) ? "All Time" : name));
                this.select.appendChild(option);
            }

            return;
        }
        const row = UIDiv("form-row");
        this.select = document.createElement("select");
        this.select.id = this.select.name = "league-selected-gametype";

        row.appendChild(UILabel("Gametype", "league-selected-gametype"));
        row.appendChild(this.select);

        this.select.addEventListener("change", (e) =>{
            this.gametypeId = e.target.value;
            this.page = 1;
            this.loadData();
        });

        this.wrapper.appendChild(row);

    }

    async loadGametypes(){

        try{

            

            const req = await fetch(`/json/map-ctf-league-gametypes/?mapId=${this.mapId}&range=${this.timeRange}`);

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

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
    

        this.wrapper.appendChild(this.table);
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
            headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
        }

        this.table.appendChild(headerRow);

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            const row = document.createElement("tr");
            
            row.appendChild(UITableColumn({
                "content": i + 1 + (this.perPage * (this.page - 1)), 
                "parse": ["ordinal"],
                "className": "ordinal"
            }));

            row.appendChild(UIPlayerLink({
                "playerId": d.player_id, 
                "name": d.name, 
                "country": d.country,
                "bTableElem": true
            }));
            

            row.appendChild(UITableColumn({"content": d.total_matches}));
            row.appendChild(UITableColumn({"content": d.wins, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": d.draws, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": d.losses, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": d.cap_for, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": d.cap_against, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": (d.cap_offset > 0) ? `+${d.cap_offset}` : d.cap_offset, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": d.points, "parse": ["ignore0"]}));

            this.table.appendChild(row);
        }
    }
}