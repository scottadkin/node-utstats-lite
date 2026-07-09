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

        this.parent.append(this.wrapper);

        this.changeNamesToArrays();

        this.createForm();


        //need to add support for event classback is url is set to null, make sure dont create link elemens
        this.pagination = new UIPagination(this.wrapper, (newPage) =>{
            this.page = newPage;
            this.loadData();
        }, 0, this.perPage, this.page);


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
        if(type === "gametype"){
            select.id = `recent-match-gametype`;
        }else{
            select.id = `recent-match-map`;
        }

        const allOption = document.createElement("option");
        allOption.value = "0";
        allOption.innerHTML = "Any";
        select.append(allOption);

        const names = (type === "gametype") ? this.gametypeNames : this.mapNames;

        for(let i = 0; i < names.length; i++){

            const {name, id} = names[i];

            const option = document.createElement("option");
            option.value = id;
            option.append(name);
            select.append(option);
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

        this.form = UIDiv();


        this.gametypeRow = UIDiv("form-row");

        const gLabel = document.createElement("label");
        gLabel.innerHTML = "Gametype";
        gLabel.htmlFor = "recent-match-gametype";
        this.gametypeRow.append(gLabel, this.createSelect("gametype"));
        this.form.append(this.gametypeRow);

        this.mapRow = UIDiv("form-row");
        const mLabel = document.createElement("label");
        mLabel.innerHTML = "Map";
        mLabel.htmlFor = "recent-match-map";
        this.mapRow.append(mLabel,this.createSelect("map"));
        this.form.append(this.mapRow);

        this.wrapper.append(this.form);
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

            

            this.renderTable();
            this.pagination.updateResults(this.page, res.totalMatches, this.perPage);

        }catch(err){
            console.trace(err);
        }
    }

    createRow(data){


        const url = `/match/${data.match_id}`;


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

        return [
            {"display": toDateString(data.match_date), "className": "date", url},
            {"display": data.gametype_name, url},
            {"display": data.map_name, url},
            {"display": MMSS(data.time_on_server), "className": "mmss", url},
            {"display": string, className, url}];


      
    }

    renderTable(){

        const rows = [];

        for(let i = 0; i < this.data.matches.length; i++){

            const d = this.data.matches[i];

            rows.push(this.createRow(d));
        }

        if(this.table === undefined){
            const headers = ["Date", "Gametype", "Map", "Playtime", "Match Result"];
            const tableOptions = {"className": "t-width-1","bNoSort": true, "headers": headers.map((h) =>{ return {"display": h}})};
            this.table = new TESTUITable(this.wrapper, tableOptions, rows);
        }else{
            this.table.updateRows(rows);
        }
    }
}

function playerGametypeTotals(parent, data){

    if(data.length === 0) return;

    parent = document.querySelector(parent);

    UIHeader(parent, "Gametype Totals");

    const headers = [
        "Gametype", "Last Active", "Score", "Frags", "Deaths",
        "Suicides", "Team Kills", "Eff", "Matches", "Wins", "Winrate",
        "Playtime"
    ];

    const rows = [];

    let footerRow = null;

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        if(data.length === 2){
            //we don't want to display duplicate data if the player has only played one gametype
            if(d.gametype_name === "All") continue;
        }


        const row = [
            {
                "display": d.gametype_name,
                "value": d.gametype_name.toLowerCase(),
                "className": "text-left"
            },
            {
                "display": toDateString(d.last_active, true), 
                "value": d.last_active,
                "className": "date"
            }
        ];

        const ignore0Keys_1 = [
            "score", "frags", "deaths", "suicides", "team_kills"
        ];

        for(let x = 0; x < ignore0Keys_1.length; x++){
            row.push({
                "display": ignore0(d[ignore0Keys_1[x]]), 
                "value": d[ignore0Keys_1[x]]
            });
        }


        row.push({
                "display": `${d.efficiency.toFixed(2)}%`,
                "value": d.efficiency 
            },
            {
                "display": ignore0(d.total_matches), 
                "value": d.total_matches
            },
            {
                "display": ignore0(d.wins), 
                "value": d.wins
            },
            {
                "display": `${d.winrate.toFixed(2)}%`, 
                "value": d.winrate, 
            },
            {
            "display": toPlaytime(d.playtime, true), 
            "value": d.playtime,
            "className": "playtime"
        });

        if(d.gametype_name !== "All"){
            rows.push(row);
        }else{
            footerRow = row;
        }
    }

    new TESTUITable(parent, {
        "className": "t-width-1", 
        "headers": headers.map((h) =>{ return {"display": h}}), 
        "footer": footerRow}, 
    rows)
}


class PlayerSpecialEvents{
    
    constructor(parent, data){

        this.parent = document.querySelector(parent);
        this.data = data;
        UIHeader(parent, "Special Events");
        this.mode = "all";

        this.createTabs();
        
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

        if(this.mode !== "all"){
            headers.unshift("Gametype");
        }

        let footer = null;

        const rows = [];

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(this.mode === "all" && d.gametype_id !== 0) continue;

            if(this.mode !== "all" && this.data.length === 2 && d.gametype_id === 0){
                continue;
            }

            let total = 0;

            for(let x = 0; x < keys.length; x++){
                total += d[keys[x]];
            }

            if(total === 0) continue;

            const row = []

            if(this.mode !== "all"){
                row.push({"display": d.gametype_name, "value": d.gametype_name.toLowerCase(), "className": "text-left"});
            }

            for(let x = 0; x < keys.length; x++){
                row.push({"value": d[keys[x]], "display": ignore0(d[keys[x]])});
            }

            if(d.gametype_id !== 0 || this.mode === "all"){
                rows.push(row);
            }else{
                footer = row;
            }
        }

        table.updateRows(rows, headers.map((h) =>{ return {"display": h}}), footer);

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

        if(this.multisTable === undefined){
            this.multisTable = new TESTUITable(this.parent, {"className": "t-width-1", "headers": multiHeaders.map((h) =>{ return {"display": h}})}, []);
        }

        if(this.spreesTable === undefined){
            this.spreesTable = new TESTUITable(this.parent, {"className": "t-width-1", "headers": spreeHeaders.map((h) =>{ return {"display": h}})}, []);
        }

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

    
        UIHeader(this.parent, "Capture The Flag Summary");
        
        this.createTabs();
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

        const row = [];

        const ignore0Keys = [
            "taken", "pickup", "drop", "assist", "cover", "seal",
            "cap", "kill", "return"
        ];


        row.push({
                "display": this.getTypeName(data), 
                "value": this.getTypeName(data).toLowerCase(), 
                "className": "text-left"
            },
            {
                "value": 
                data.total_matches
            });

        for(let i = 0; i < ignore0Keys.length; i++){

            const key = `${(bMax) ? "max_" : "" }flag_${ignore0Keys[i]}`;

            row.push({"display": ignore0(data[key]), "value": data[key]});
        }

        return row;
    }

    createReturnsRow(data, bMax){

        if(bMax === undefined) bMax = false;

        const ignore0Keys = [
            "", "_base", "_mid", "_enemy_base", "_save"
        ];

        const row = [];

        row.push(
            {
                "display": this.getTypeName(data), 
                "value": this.getTypeName(data).toLowerCase(), 
                "className": "text-left"
            }, {
                "value": data.total_matches
            }
        );

        for(let i = 0; i < ignore0Keys.length; i++){

            const key = `${(bMax) ? "max_" : "" }flag_return${ignore0Keys[i]}`;
            row.push({"display": ignore0(data[key]), "value": data[key]});
        }

        return row;
    }

    render(){

        const generalHeaders = [
            "Gametype", "Matches", "Taken", "Pickup",
            "Drop", "Assist", "Cover", "Seal", "Capture",
            "Kill", "Return"
        ];

        const returnHeaders = [
            "Gametype", "Matches", "Return", "Return Home Base", "Return Mid",
            "Return Enemy Base", "Return Close Save"
        ];

        

        let headers = (this.mode !== "returns" && this.mode !== "return-records") ? generalHeaders : returnHeaders;

        
        if(this.type === "maps") headers[0] = "Map";

        headers = headers.map((h) =>{ return {"display": h}});

        const footer = [];

        for(let i = 0; i < headers.length; i++){

            if(i === 0){
                footer.push({"display": "Total", "className": "text-left"});
            }else{
                footer.push({"display": "SUM", "dataType": "INT", "callback": ignore0});
            }
        }
  

        const rows = [];
        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(this.type === "gametypes" && (d.map_id !== 0 || d.gametype_id === 0)) continue;
            if(this.type === "maps" && (d.gametype_id !== 0 || d.map_id === 0)) continue;
            if(this.type === "lifetime" && (d.gametype_id !== 0 || d.map_id !== 0)) continue;

            if(this.mode === "general"){
                rows.push(this.createGeneralRow(d));
            }else if(this.mode === "returns"){
                rows.push(this.createReturnsRow(d));
            }else if(this.mode === "general-records"){
                rows.push(this.createGeneralRow(d, true));
            }else if(this.mode === "return-records"){
                rows.push(this.createReturnsRow(d, true));
            }
        }

        if(this.table === undefined){

            const tableOptions = {
                headers,
                "className": "t-width-1",
                "footer": (rows.length > 1) ? footer : null
            };
            this.table = new TESTUITable(this.parent, tableOptions, rows)
        }else{

            this.table.updateRows(rows,headers, (rows.length > 1) ? footer : null);
        }
    }
}


class PlayerItemsSummary{

    constructor(parent, data){

        this.parent = document.querySelector(parent);
        this.data = data;

        UIHeader(this.parent, "Items Summary");

        this.render();
    }

    createRow(data){

        const row = [{"display": data.gametype_name, "value": data.gametype_name.toLowerCase(), "className": "text-left"}];

        const keys = ["boots", "body", "pads", "invis", "shp", "belt", "amp"];

        for(let i = 0; i < keys.length; i++){

            row.push({"display": ignore0(data[`item_${keys[i]}`]), "value": data[`item_${keys[i]}`]});
        }

        return row;
    }

    render(){

        const headers = [
            "Gametype",	"Jump Boots", "Body Armour", "Thigh Pads", "Invisibility", 
            "Super Health Pack", "Shield Belt", "Damage Amplifier"				
        ];

        const rows = [];
        let footer = null;
        
        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(this.data.length === 2 && d.gametype_id === 0){
                continue;
            }

            if(this.data.length > 2 && d.gametype_id === 0){
                footer = this.createRow(d);
            }else{
                rows.push(this.createRow(d));
            }
        }

        if(this.table === undefined){

            const tableOptions = {
                "className": "t-width-1",
                "headers": headers.map((h) =>{ return {"display": h}}),
                "footer": footer
            };
            this.table = new TESTUITable(this.parent, tableOptions, rows);
        }else{
            this.table.updateRows(rows, null, footer);
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

        row.appendChild(UITableCell({"content": d.weapon_name, "className": "text-left"}));
        row.appendChild(UITableCell({"content": d.total_matches}));
        row.appendChild(UITableCell({"content": d.team_kills, "parse": ["ignore0"]}));
        row.appendChild(UITableCell({"content": d.deaths, "parse": ["ignore0"]}));
        row.appendChild(UITableCell({"content": d.kills, "parse": ["ignore0"]}));
        row.appendChild(UITableCell({"content": `${d.eff.toFixed(2)}%`}));

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

        if(data.gametypes.length === 0 && data.maps.length === 0) return;

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

        row.appendChild(UITableCell({"content": data.position, "parse": ["ordinal"], "className": "ordinal"}));
        row.appendChild(UITableCell({"content": data.name, "className": "text-left"}));
        row.appendChild(UITableCell({"content": data.last_active, "parse": ["date"], "className": "date"}));
        row.appendChild(UITableCell({"content": data.matches}));
        row.appendChild(UITableCell({"content": data.playtime, "parse": ["playtime"], "className": "playtime"}));
        row.appendChild(UITableCell({"content": data.score.toFixed(2)}));
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

        if(data.length === 0) return;
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

        row.appendChild(UITableCell({"content": parseInt(data.pos) + 1, "parse": ["ordinal"]}));


        let name = "Unknown";

        if(this.mode === "gametypes"){
            name = data.gametype_name;
        }else if(this.mode === "maps"){
            name = data.map_name;
        }else if(this.mode === "combined"){
            name = `Lifetime`;
        }

        row.appendChild(UITableCell({
            "content": name,//(this.mode === "gametypes") ? data.gametype_name : data.map_name,
            "className": "text-left"
        }));

        const ignore0keys = [
            "total_matches", "wins", "draws", "losses", "cap_for", "cap_against"
        ];

        for(let i = 0; i < ignore0keys.length; i++){
            row.appendChild(UITableCell({"content": data[ignore0keys[i]], "parse": ["ignore0"]}));
        }


        let diff = data.cap_offset;

        if(diff > 0){
            diff = `+${diff}`;
        }

        row.appendChild(UITableCell({"content": diff}));
        row.appendChild(UITableCell({"content": data.points, "parse": ["ignore0"]}));


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