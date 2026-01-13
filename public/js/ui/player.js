class PlayerRecentMatches{

    constructor(parent, playerId, gametypeNames, mapNames){

        this.parent = document.querySelector(parent);
        this.playerId = playerId;
        this.gametypeNames = gametypeNames;
        this.mapNames = mapNames;

        this.selectedGametype = 0;
        this.selectedMap = 0;
        this.perPage = 25;
        this.page = 1;

        this.data = {"totalMatches": 0, "matches": []};

        this.wrapper = document.createElement("div");

        UIHeader(this.wrapper, "Recent Matches");

        this.parent.appendChild(this.wrapper);

        this.changeNamesToArrays();

        this.createForm();

        this.table = document.createElement("table");
        this.table.className = "t-width-1";


        //need to add support for event classback is url is set to null, make sure dont create link elemens
        this.pagination = new UIPagination(this.parent, (newPage) =>{
            this.page = newPage;
            this.loadData();
        }, this.totalMatches, this.perPage, this.page);

        this.wrapper.appendChild(this.table);

        this.loadData();
    }


    sortByName(a, b){
        
        a = a.name.toLowerCase();
        b = b.name.toLowerCase();

        if(a < b) return -1;
        if(a > b) return 1;
        return 0;
    }

    changeNamesToArrays(){

        const gametypes = [];
        const maps = [];

        for(const [id, name] of Object.entries(this.gametypeNames)){
            gametypes.push({"id": parseInt(id), name});
        }

        for(const [id, name] of Object.entries(this.mapNames)){
            maps.push({"id": parseInt(id), name});
        }

        this.gametypeNames = gametypes;
        this.mapNames = maps;

        this.gametypeNames.sort(this.sortByName);
        this.mapNames.sort(this.sortByName);
    }


    createSelect(type){

        const select = document.createElement("select");
        select.className = "default-select";

        if(type === "gametype"){
            select.id = `recent-match-gametype`;
        }else{
            select.id = `recent-match-map`;
        }

        const allOption = document.createElement("option");
        allOption.value = "0";
        allOption.innerHTML = "Any";
        select.appendChild(allOption);

        const names = (type === "gametype") ? this.gametypeNames : this.mapNames;

        for(let i = 0; i < names.length; i++){

            const {name, id} = names[i];

            const option = document.createElement("option");
            option.value = id;
            option.appendChild(document.createTextNode(name));
            select.appendChild(option);
        }

        select.addEventListener("change", (e) =>{

            const v = parseInt(e.target.value);

            this.page = 1;
            if(type === "gametype"){
                this.selectedGametype = v;
            }else{
                this.selectedMap = v;
            }

            this.loadData();

        });

        return select;
    }


    createForm(){

        this.form = document.createElement("div");


        this.gametypeRow = document.createElement("div");
        this.gametypeRow.className = "form-row";

        const gLabel = document.createElement("label");
        gLabel.innerHTML = "Gametype";
        gLabel.htmlFor = "recent-match-gametype";
        this.gametypeRow.appendChild(gLabel);
        this.gametypeRow.appendChild(this.createSelect("gametype"));
        this.form.appendChild(this.gametypeRow);

        this.mapRow = document.createElement("div");
        this.mapRow.className = "form-row";
        const mLabel = document.createElement("label");
        mLabel.innerHTML = "Map";
        mLabel.htmlFor = "recent-match-map";
        this.mapRow.appendChild(mLabel);
        this.mapRow.appendChild(this.createSelect("map"));
        this.form.appendChild(this.mapRow);

        this.wrapper.appendChild(this.form);
    }


    async loadData(){

        try{

            let url = `../json/player-recent-matches?playerId=${this.playerId}`;
            url+= `&gametypeId=${this.selectedGametype}&mapId=${this.selectedMap}`;
            url+= `&perPage=${this.perPage}&page=${this.page}`;

            const req = await fetch(url);

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            this.data = res;

            this.pagination.updateResults(this.page, res.totalMatches, this.perPage);

            this.renderTable();

        }catch(err){
            console.trace(err);
        }
    }

    createRow(data){

        const row = document.createElement("tr");

        const url = `/match/${data.match_id}`;

        row.appendChild(UITableColumn({"content": toDateString(data.match_date), "className": "date", url}));
        row.appendChild(UITableColumn({"content": data.gametype_name, url}));
        row.appendChild(UITableColumn({"content": data.map_name, url}));
        row.appendChild(UITableColumn({"content": data.time_on_server, "parse": ["playtime"], "className": "playtime", url}));

        let string = "";
        let className = "";

        if(data.match_result === "w"){
            string = "Won The Match";
            className = "green-font";
        }else if(data.match_result === "d"){
            string = "Drew The Match";
            className = "yellow-font";
        }else if(data.match_result === "l"){
            string = "Lost The Match";
            className = "red-font";
        }else if(data.match_result === "s"){
            string = "Spectator";
        }else{
            //this was added in v1.9.x, just incase user doesnt want to reimport all logs
            string = "N/A";
        }

        row.appendChild(UITableColumn({"content": string, className, url}));


        return row;
    }

    renderTable(){


        this.table.innerHTML = "";
        this.wrapper.className = "";

        if(this.data.totalMatches === 0){
            this.wrapper.className = "hidden";
            return;

        }

        const headers = ["Date", "Gametype", "Map", "Playtime", "Match Result"];

        const headerRow = document.createElement("tr");

        for(let i = 0; i < headers.length; i++){

            headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
        }

        this.table.appendChild(headerRow);

        for(let i = 0; i < this.data.matches.length; i++){

            const d = this.data.matches[i];

            this.table.appendChild(this.createRow(d));
        }
    }
}

function playerGametypeTotals(parent, data){

    parent = document.querySelector(parent);

    UIHeader(parent, "Gametype Totals");

    const table = document.createElement("table");
    table.className = "t-width-1";

    const headers = [
        "Gametype", "Last Active", "Score", "Frags", "Deaths",
        "Suicides", "Team Kills", "Eff", "Matches", "Wins", "Winrate",
        "Playtime"
    ];

    const headerRow = document.createElement("tr");

    for(let i = 0; i < headers.length; i++){

        headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
    }

    table.appendChild(headerRow);

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        const row = document.createElement("tr");

        row.appendChild(UITableColumn({
            "content": d.gametype_name,
            "className": "text-left"
        }));

        row.appendChild(UITableColumn({
            "content": toDateString(d.last_active, true), 
            "className": "date"
        }));

        const ignore0Keys_1 = [
            "score", "frags", "deaths", "suicides", "team_kills"
        ];

        for(let x = 0; x < ignore0Keys_1.length; x++){
            row.appendChild(UITableColumn({
                "content": d[ignore0Keys_1[x]], 
                "parse": ["ignore0"]
            }));
        }


        row.appendChild(UITableColumn({
            "content": `${d.efficiency.toFixed(2)}%`, 
        }));

        row.appendChild(UITableColumn({
            "content": d.matches, 
            "parse": ["ignore0"]
        }))
        row.appendChild(UITableColumn({
            "content": d.wins, 
            "parse": ["ignore0"]
        }))

         row.appendChild(UITableColumn({
            "content": `${d.winrate.toFixed(2)}%`, 
        }));

        row.appendChild(UITableColumn({
            "content": d.playtime, 
            "parse": ["playtime"],
            "className": "playtime"
        }))
        table.appendChild(row);
    }

    parent.appendChild(table);
}


class PlayerSpecialEvents{
    
    constructor(parent, data){

        this.parent = document.querySelector(parent);
        this.data = data;
        UIHeader(parent, "Special Events");
        this.mode = "all";

        this.createTabs();


        this.multisTable = document.createElement("table");
        this.spreesTable = document.createElement("table");


        this.parent.appendChild(this.multisTable);
        this.parent.appendChild(this.spreesTable);
        
        this.render();
    }


    createTabs(){

        const options = [
            {"display": "All", "value": "all"},
            {"display": "Gametypes", "value": "gametypes"},
        ];

        this.tabs = new UITabs(this.parent, options, this.mode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{
            this.mode = e.detail.newTab;
            this.render();
        });
    }


    renderTable(table, headers, keys){

        table.innerHTML = ``;
        table.className = `t-width-1`;
        const headerRow = document.createElement("tr");

        if(this.mode !== "all"){
            headerRow.appendChild(UITableHeaderColumn({"content": "Gametype"}));
        }

        for(let i = 0; i < headers.length; i++){

            headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
        }

        table.appendChild(headerRow);

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(this.mode === "all" && d.gametype_id != 0) continue;

            let total = 0;

            for(let x = 0; x < keys.length; x++){
                total += d[keys[x]];
            }

            if(total === 0) continue;

            const row = document.createElement("tr");

            if(this.mode !== "all"){
                row.appendChild(UITableColumn({"content": d.gametype_name, "className": "text-left"}));
            }

            for(let x = 0; x < keys.length; x++){

                row.appendChild(UITableColumn({"content": d[keys[x]], "parse": ["ignore0"]}));
            }

            table.appendChild(row);
        }

    }

    render(){

        const multiHeaders = [
            "Double Kill",
            "Multi Kill",
            "Ultra Kill",
            "Monster Kill",
            "Best Multi Kill",
        ];

        const multiKeys = ["multi_1", "multi_2", "multi_3", "multi_4", "multi_best"];
        const spreeKeys = ["spree_1", "spree_2", "spree_3", "spree_4", "spree_5", "spree_best"];

        const spreeHeaders = [
            "Killing Spree",
            "Rampage",
            "Dominating",
            "Unstoppable",
            "Godlike",
            "Best Spree"
        ];

        this.renderTable(this.multisTable, multiHeaders, multiKeys);
        this.renderTable(this.spreesTable, spreeHeaders, spreeKeys);  
    }
}

class PlayerCTFSummary{

    constructor(parent, data){

        if(data.length === 0) return;
        
        this.parent = document.querySelector(parent);
        this.data = data;
        this.type = "gametypes";
        this.mode = "general";
    
        this.table = document.createElement("table");
    
        UIHeader(this.parent, "Capture The Flag Summary");
        
        this.createTabs();

        this.parent.appendChild(this.table);
        this.render();

    }

    createTabs(){

        const typeOptions = [
            {"display": "Lifetime", "value": "lifetime"},
            {"display": "Gametypes", "value": "gametypes"},
            {"display": "Maps", "value": "maps"},
        ];

        this.typeTabs = new UITabs(this.parent, typeOptions, this.type);

        this.typeTabs.wrapper.addEventListener("tabChanged", (e) =>{

            this.type = e.detail.newTab;
            this.render();
        });

        const options = [
            {"display": "General Totals", "value": "general"},
            {"display": "Returns Totals", "value": "returns"},
            {"display": "Match General Records", "value": "general-records"},
            {"display": "Match Return Records", "value": "return-records"},
        ];

        this.tabs = new UITabs(this.parent, options, this.mode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{

            this.mode = e.detail.newTab;
            this.render();
        });
    }

    getTypeName(data){

        if(this.type === "gametypes") return data.gametype_name;
        if(this.type === "maps") return data.map_name;
        if(this.type === "lifetime") return "All";

        return "Error";
    }

    createGeneralRow(data, bMax){

        if(bMax === undefined) bMax = false;
        const row = document.createElement("tr");

        const ignore0Keys = [
            "taken", "pickup", "drop", "assist", "cover", "seal",
            "cap", "kill", "return"
        ];

        row.appendChild(UITableColumn({"content": this.getTypeName(data), "className": "text-left"}));
        row.appendChild(UITableColumn({"content": data.total_matches}));

        for(let i = 0; i < ignore0Keys.length; i++){
            row.appendChild(UITableColumn({"content": data[`${(bMax) ? "max_" : "" }flag_${ignore0Keys[i]}`], "parse": ["ignore0"]}));
        }

        return row;
    }

    createReturnsRow(data, bMax){

        if(bMax === undefined) bMax = false;

        const row = document.createElement("tr");

        const ignore0Keys = [
            "", "_base", "_mid", "_enemy_base", "_save"
        ];

        row.appendChild(UITableColumn({"content": this.getTypeName(data), "className": "text-left"}));
        row.appendChild(UITableColumn({"content": data.total_matches}));

        for(let i = 0; i < ignore0Keys.length; i++){
            row.appendChild(UITableColumn({"content": data[`${(bMax) ? "max_" : "" }flag_return${ignore0Keys[i]}`], "parse": ["ignore0"]}));
        }

        return row;
    }

    render(){

        this.table.innerHTML = ``;
        this.table.className = `t-width-1`;

        const generalHeaders = [
            "Gametype", "Matches", "Taken", "Pickup",
            "Drop", "Assist", "Cover", "Seal", "Capture",
            "Kill", "Return"
        ];

        const returnHeaders = [
            "Gametype", "Matches", "Return", "Return Home Base", "Return Mid",
            "Return Enemy Base", "Return Close Save"
        ];

        

        const headers = (this.mode !== "returns" && this.mode !== "return-records") ? generalHeaders : returnHeaders;

        if(this.type === "maps") headers[0] = "Map";

        const headerRow = document.createElement("tr");

        for(let i = 0; i < headers.length; i++){
            headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
        }
        
        this.table.appendChild(headerRow);

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(this.type === "gametypes" && (d.map_id !== 0 || d.gametype_id === 0)) continue;
            if(this.type === "maps" && (d.gametype_id !== 0 || d.map_id === 0)) continue;
            if(this.type === "lifetime" && (d.gametype_id !== 0 || d.map_id !== 0)) continue;

            if(this.mode === "general"){
                this.table.appendChild(this.createGeneralRow(d));
            }else if(this.mode === "returns"){
                this.table.appendChild(this.createReturnsRow(d));
            }else if(this.mode === "general-records"){
                this.table.appendChild(this.createGeneralRow(d, true));
            }else if(this.mode === "return-records"){
                 this.table.appendChild(this.createReturnsRow(d, true));
            }

        }
    }
}


class PlayerItemsSummary{

    constructor(parent, data){

        this.parent = document.querySelector(parent);
        this.data = data;

        UIHeader(this.parent, "Items Summary");

        this.table = document.createElement("table");

        this.parent.appendChild(this.table);

        this.render();
    }

    createRow(data){

        const row = document.createElement("tr");

        row.appendChild(UITableColumn({"content": data.gametype_name, "className": "text-left"}));

        const keys = ["boots", "body", "pads", "invis", "shp", "belt", "amp"];

        for(let i = 0; i < keys.length; i++){

            row.appendChild(UITableColumn({"content": data[`item_${keys[i]}`], "parse": ["ignore0"]}));
        }

        return row;
    }

    render(){

        this.table.innerHTML = ``;
        this.table.className = `t-width-1`;

        const headers = [
            "Gametype",	"Jump Boots", "Body Armour", "Thigh Pads", "Invisibility", 
            "Super Health Pack", "Shield Belt", "Damage Amplifier"				
        ];

        const headerRow = document.createElement("tr");

        for(let i = 0; i < headers.length; i++){
            headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
        }

        this.table.appendChild(headerRow);

        
        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            this.table.appendChild(this.createRow(d));
        }
    }
}


class PlayerWeaponsSummary{

    constructor(parent, data, gametypeNames){

        this.parent = document.querySelector(parent);
        this.data = data;
        this.gametypeNames = gametypeNames;

        UIHeader(this.parent, "Weapons Summary");

        this.mode = 0;
        this.createTabs();
        

        this.table = document.createElement("table");
        this.table.className = `t-width-1`;
        this.parent.appendChild(this.table);

        this.render();
    }


    createTabs(){

        const options = [
            {"display": "All Gametypes", "value": 0},
        ];

        for(const [id, name] of Object.entries(this.gametypeNames)){
            options.push({"display": name, "value": parseInt(id)});
        }

        this.tabs = new UITabs(this.parent, options, this.mode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{
            this.mode = parseInt(e.detail.newTab);
            this.render();
        });
    }

    createRow(d){

        const row = document.createElement("tr");

        row.appendChild(UITableColumn({"content": d.weapon_name, "className": "text-left"}));
        row.appendChild(UITableColumn({"content": d.total_matches}));
        row.appendChild(UITableColumn({"content": d.team_kills, "parse": ["ignore0"]}));
        row.appendChild(UITableColumn({"content": d.deaths, "parse": ["ignore0"]}));
        row.appendChild(UITableColumn({"content": d.kills, "parse": ["ignore0"]}));
        row.appendChild(UITableColumn({"content": `${d.eff.toFixed(2)}%`}));

        return row;
    }

    render(){

        this.table.innerHTML = ``;

        const headers = [
            "Name", "Matches", "Team Kills", "Deaths", "Kills", "Efficiency"
        ];

        const headerRow = document.createElement("tr");

        for(let i = 0; i < headers.length; i++){

            headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
        }

        this.table.appendChild(headerRow);

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(d.gametype_id !== this.mode) continue;
            this.table.appendChild(this.createRow(d));
        }
    }
}


class PlayerRankingSummary{

    constructor(parent, data){

        this.parent = document.querySelector(parent);
        this.data = data;

        UIHeader(this.parent, "Ranking Summary");

        this.info = document.createElement("div");
        this.info.className = "info";
        this.info.innerHTML = `Ranking positions based on gametypes where player has been active in the last 28 days.`;

        this.parent.appendChild(this.info);

        this.mode = "gametypes";
        this.createTabs();

        this.table = document.createElement("table");
        this.table.className = `t-width-1`;
        this.parent.appendChild(this.table);

        this.render();

    }

    createTabs(){

        const options = [
            {"display": "Gametypes", "value": "gametypes"},
            {"display": "Maps", "value": "maps"},
        ];

        this.tabs = new UITabs(this.parent, options, this.mode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{
            this.mode = e.detail.newTab;
            this.render();
        }); 
    }


    createRow(data){

        const row = document.createElement("tr");

        row.appendChild(UITableColumn({"content": data.position, "parse": ["ordinal"], "className": "ordinal"}));
        row.appendChild(UITableColumn({"content": data.name, "className": "text-left"}));
        row.appendChild(UITableColumn({"content": data.last_active, "parse": ["date"], "className": "date"}));
        row.appendChild(UITableColumn({"content": data.matches}));
        row.appendChild(UITableColumn({"content": data.playtime, "parse": ["playtime"], "className": "playtime"}));
        row.appendChild(UITableColumn({"content": data.score.toFixed(2)}));
        return row;
    }

    render(){

        this.table.innerHTML = ``;

        const headerRow = document.createElement("tr");

        const headers = [
            "Place", "Name", "Last Active", 
            "Matches", "Playtime", "Points"
        ];

        for(let i = 0; i < headers.length; i++){

            headerRow.appendChild(UITableHeaderColumn({
                "content": headers[i]
            }));
        }

        this.table.appendChild(headerRow);

        const data = (this.mode === "gametypes") ? this.data.gametypes : this.data.maps;

        for(let i = 0; i < data.length; i++){

            this.table.appendChild(this.createRow(data[i]));
        }
    }
}

class PlayerCTFLeague{

    constructor(parent, data){

        this.parent = document.querySelector(parent);
        this.data = data;

        UIHeader(this.parent, "CTF League");

        this.mode = "gametypes";
        this.createTabs();

        this.table = document.createElement("table");
        this.table.className = `t-width-1`;

        this.parent.appendChild(this.table);

        this.render();
    }

    createTabs(){

        const options = [
            {"display": "Combined", "value": "combined"},
            {"display": "Gametypes", "value": "gametypes"},
            {"display": "Maps", "value": "maps"},
        ];

        this.tabs = new UITabs(this.parent, options, this.mode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{
            this.mode = e.detail.newTab;
            this.render();
        });
    }

    createRow(data){

        const row = document.createElement("tr");

        row.appendChild(UITableColumn({"content": parseInt(data.pos) + 1, "parse": ["ordinal"]}));


        let name = "Unknown";

        if(this.mode === "gametypes"){
            name = data.gametype_name;
        }else if(this.mode === "maps"){
            name = data.map_name;
        }else if(this.mode === "combined"){
            name = `Lifetime`;
        }

        row.appendChild(UITableColumn({
            "content": name,//(this.mode === "gametypes") ? data.gametype_name : data.map_name,
            "className": "text-left"
        }));

        const ignore0keys = [
            "total_matches", "wins", "draws", "losses", "cap_for", "cap_against"
        ];

        for(let i = 0; i < ignore0keys.length; i++){
            row.appendChild(UITableColumn({"content": data[ignore0keys[i]], "parse": ["ignore0"]}));
        }


        let diff = data.cap_offset;

        if(diff > 0){
            diff = `+${diff}`;
        }

        row.appendChild(UITableColumn({"content": diff}));
        row.appendChild(UITableColumn({"content": data.points, "parse": ["ignore0"]}));


        return row;
    }

    render(){

        this.table.innerHTML = ``;

        const headers = [
            "Place", "Name", "Played", "Wins", "Draws", "Losses",
            "Caps For", "Caps Against", "Cap Diff", "Points"
        ];

        const headerRow = document.createElement("tr");

        for(let i = 0; i < headers.length; i++){
            headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
        }

        this.table.appendChild(headerRow);

      

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];
            
            if(this.mode === "gametypes" && (d.map_id !== 0 || d.gametype_id === 0)) continue;
            if(this.mode === "maps" && (d.map_id === 0 || d.gametype_id !== 0)) continue;
            if(this.mode === "combined" && (d.map_id !== 0 || d.gametype_id !== 0)) continue;

            this.table.appendChild(this.createRow(d));
        }
    }
}


function playerPermaLinks(parent, hash){

    parent = document.querySelector(parent);

    new UIWatchlistButton(parent, "players", hash);
    UICopyURLToClipboard(parent, "Copy Player Perma Link To Clipboard", `/player/${hash}`);
}