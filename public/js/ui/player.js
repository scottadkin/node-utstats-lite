class PlayerRecentMatches{

    constructor(parent, playerId){

        this.parent = document.querySelector(parent);
        this.playerId = playerId;


        this.gametypes = [];
        this.maps = [];
        this.gametypeMaps = {};
        this.mapGametypes = {};
        this.selectedGametype = 0;
        this.selectedMap = 0;
        this.perPage = 25;
        this.page = 1;

        this.data = {"totalMatches": 0, "matches": []};

        this.wrapper = document.createElement("div");

        UIHeader(this.wrapper, "Recent Matches");

        this.parent.append(this.wrapper);



        this.loadAllPlayedNames();
        
    }

    async loadAllPlayedNames(){

        try{

            const url = `../json/player-get-all-gametypes-maps?playerId=${this.playerId}`;

            const req = await fetch(url);

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            this.gametypes = res.gametypes;
            this.maps = res.maps;
            this.gametypeMaps = res.gametypeMaps;
            this.mapGametypes = res.mapGametypes;


        }catch(err){
            console.trace(err);
        }finally{
            this.createForm();


            //need to add support for event classback is url is set to null, make sure dont create link elemens
            this.pagination = new UIPagination(this.wrapper, (newPage) =>{
                this.page = newPage;
                this.loadData();
            }, 0, this.perPage, this.page);
            this.loadData();
        }
    }

    getValidMaps(targets){

        const found = [];

        for(let i = 0; i < this.maps.length; i++){

            const m = this.maps[i];

            if(targets.indexOf(m.id) !== -1){
                found.push({"display": m.name, "value": m.id})
            }
        }

        return found;
    }

    getValidOptions(type){

        const valid = [{"value": 0, "display": "Any"}];

        const targetData = (type === "map") ? this.gametypeMaps : this.mapGametypes;

        if(targetData[this.selectedGametype] !== undefined){

            valid.push(...this.getValidMaps(targetData[this.selectedGametype]));
        }

        return valid;
    }

    createSelect(parent, type){


        const names = (type === "gametype") ? this.gametypes : this.maps;

        const options = [{"display": "Any", "value": 0}];

        for(let i = 0; i < names.length; i++){

            const {name, id} = names[i];

            options.push({"value": id, "display": name});
        }


        this[`${type}Select`] = new UISelect(parent, options, (type === "gametype") ? this.selectedGametype : this.selectedMap);


        this[`${type}Select`].select.addEventListener("change", (e) =>{

            const v = parseInt(e.target.value);

            this.page = 1;
            if(type === "gametype"){
                this.selectedGametype = v;
            }else{
                this.selectedMap = v;
            }


            const otherType = (type === "gametype") ? "map" : "gametype";

            if(type === "gametype"){
                if(!this[`${otherType}Select`].updateOptions(this.getValidOptions(otherType), this.selectedMap)){
                    this.selectedMap = 0;
                }
            }

            //NEED TO UPDATE GAMETYPE AND MAP SELECT ON FILTER CHANGE TO REMOVE MAPS THAT HAVENT BEEN PLAYERD WITH COMBO OR GAMETYPE

            this.loadData();

        });

    }


    createForm(){

        this.form = UIDiv();


        this.gametypeRow = UIDiv("form-row");

        this.gametypeRow.append(UILabel("Gametype"));
        this.createSelect(this.gametypeRow, "gametype");

        this.mapRow = UIDiv("form-row");

        this.mapRow.append(UILabel("Map"));
        this.createSelect(this.mapRow, "map");
        this.form.append(this.gametypeRow, this.mapRow);

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


class PlayerBasicTotals{

    constructor(parent, data){

        this.parent = document.querySelector(parent);
        this.data = data;

        this.mode = "all";

        this.wrapper = UIDiv();
        UIHeader(this.wrapper, "Basic Totals");

        this.parent.append(this.wrapper);

        this.createTabs();
        this.render();
    }

    createTabs(){

        const options = [
            {"display": "All Time", "value": "all"},
            {"display": "Gametypes", "value": "gametypes"},
            {"display": "Maps", "value": "maps"},
        ];

        this.tabs = new UITabs(this.wrapper, options, this.mode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{
            this.mode = e.detail.newTab;
            this.render();
        
        })
    }

    render(){

        const headers = [
            "Last Active", "Score", "Frags","Kills", "Deaths",
            "Suicides", "Team Kills", "Eff", "Matches", "Wins", "Winrate",
            "Playtime"
        ];

        if(this.mode !== "all"){
            headers.unshift((this.mode === "maps") ? "Map" : "Gametype");
        }

        const tableOptions = {
            "className": "t-width-1",
            "headers": headers.map((h) =>{ return {"display": h}} )
        };

        const rows = [];

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(this.mode === "gametypes" && d.map_id !== 0) continue;
            if(this.mode === "maps" && d.gametype_id !== 0) continue;
            if(this.mode === "all" && (d.gametype_id !== 0 || d.map_id !== 0)) continue;

            const name = (this.mode === "gametypes") ? d.gametype_name : d.map_name;
            

            const row = [
                {"display": toDateString(d.last_active, true), "value": d.last_active, "className": "date"},
                {"display": ignore0(d.score), "value": d.score},
                {"display": ignore0(d.frags), "value": d.frags},
                {"display": ignore0(d.kills), "value": d.kills},
                {"display": ignore0(d.deaths), "value": d.deaths},
                {"display": ignore0(d.suicides), "value": d.suicides},
                {"display": ignore0(d.team_kills), "value": d.team_kills},
                {"display": `${d.efficiency.toFixed(2)}%`, "value": d.efficiency},
                {"value": d.total_matches},
                {"display": ignore0(d.wins), "value": d.wins},
                {"display": `${d.winrate.toFixed(2)}%`, "value": d.winrate},
                {"display": toPlaytime(d.playtime), "value": d.playtime, "className": "playtime"},
            ];

            if(this.mode !== "all"){
                row.unshift({"display": name, "value": name.toLowerCase(), "className": "text-left"},);
            }

            if(this.mode !== "all" && (d.gametype_id === 0 && d.map_id === 0)){

                tableOptions.footer = row;
            }else{
                rows.push(row);
                tableOptions.footer = null;
            }
        }

        if(this.table === undefined){
            this.table = new TESTUITable(this.wrapper, tableOptions, rows);
        }else{
            this.table.updateRows(rows, tableOptions.headers, tableOptions.footer);
        }
    }
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
            {"display": "All Time", "value": "all"},
            {"display": "Gametypes", "value": "gametypes"},
            {"display": "Maps", "value": "maps"},
        ];

        this.tabs = new UITabs(this.parent, options, this.mode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{
            this.mode = e.detail.newTab;
            this.render();
        });
    }


    renderTable(table, headers, keys){

        if(this.mode !== "all"){
            headers.unshift((this.mode === "maps") ? "Map" : "Gametype");
        }

        let footer = null;

        const rows = [];

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];
           // console.log(d);

            if(this.mode === "all" && (d.gametype_id !== 0 || d.map_id !== 0)){    
                continue;
            }

            if(this.mode === "gametypes" && (d.map_id !== 0 || d.gametype_id === 0)){
                continue;
            }

            if(this.mode === "maps" && (d.gametype_id !== 0 || d.map_id === 0)){
                continue;
            }



            let total = 0;

            for(let x = 0; x < keys.length; x++){
                total += d[keys[x]];
            }

            if(total === 0) continue;

            const row = []

            let currentName = (this.mode === "gametypes") ? d.gametype_name : d.map_name;

            if(this.mode !== "all"){
                row.push({"display": currentName, "value": currentName.toLowerCase(), "className": "text-left"});
            }

            for(let x = 0; x < keys.length; x++){
                row.push({"value": d[keys[x]], "display": ignore0(d[keys[x]])});
            }

         

            //if((d.gametype_id !== 0 && d.map_id !== 0) || this.mode === "all"){
                rows.push(row);
            //}else{
           //     footer = row;
            //}
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
        this.mode = "all";

        this.wrapper = UIDiv();

        this.parent.append(this.wrapper);

        UIHeader(this.wrapper, "Items Summary");

        this.createTabs();
        this.render();
    }


    createTabs(){

        const tabOptions = [
            {"display": "All Time","value": "all"},
            {"display": "Gametypes","value": "gametypes"},
            {"display": "Maps","value": "maps"},
        ];

        this.tabs = new UITabs(this.wrapper, tabOptions, this.mode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{

            this.mode = e.detail.newTab;

            this.render();
        })
    }

    createRow(data){

        

        const row = [];

        if(this.mode !== "all"){

            const name = (this.mode === "gametypes") ? data.gametype_name : data.map_name;
            row.unshift({"display": name, "value": name.toLowerCase(), "className": "text-left"});
        }

        const keys = ["boots", "body", "pads", "invis", "shp", "belt", "amp"];

        for(let i = 0; i < keys.length; i++){

            row.push({"display": ignore0(data[`item_${keys[i]}`]), "value": data[`item_${keys[i]}`]});
        }

        return row;
    }

    bAnyData(data){

        const keys = ["boots", "body", "pads", "invis", "shp", "belt", "amp"];

        for(let i = 0; i < keys.length; i++){

            if(data[`item_${keys[i]}`] > 0) return true;
        }

        return false;
    }

    render(){

        const headers = ["Jump Boots", "Body Armour", "Thigh Pads", "Invisibility", 
            "Super Health Pack", "Shield Belt", "Damage Amplifier"				
        ];

        if(this.mode === "gametypes"){
            headers.unshift("Gametype");
        }else if(this.mode === "maps"){
            headers.unshift("Map");
        }

        const rows = [];
        let footer = null;
        
        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(this.mode === "all" && (d.gametype_id !== 0 || d.map_id !== 0)) continue;
            if(this.mode === "gametypes" && (d.gametype_id === 0 || d.map_id !== 0)) continue;
            if(this.mode === "maps" && (d.map_id === 0 || d.gametype_id !== 0)) continue;

            if(!this.bAnyData(d)) continue;
            rows.push(this.createRow(d));
          
        }

        if(this.table === undefined){

            const tableOptions = {
                "className": "t-width-1",
                "headers": headers.map((h) =>{ return {"display": h}}),
                "footer": footer
            };
            this.table = new TESTUITable(this.parent, tableOptions, rows);
        }else{
            this.table.updateRows(rows, headers.map((h) =>{ return {"display": h}}), footer);
        }
    }
}


class PlayerWeaponsSummary{

    constructor(parent, data){

        this.parent = document.querySelector(parent);
        this.data = data;

        UIHeader(this.parent, "Weapons Summary");

        this.mode = 0;
        this.createTabs();

        this.render();
    }


    setAllGametypeNames(){

        this.gametypeNames = {};

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            this.gametypeNames[d.gametype_id] = d.gametype_name;
        }
    }

    createTabs(){

        const options = [];

        this.setAllGametypeNames();

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

        return [
            {"display": d.weapon_name, "value":d.weapon_name.toLowerCase(), "className": "text-left"},
            {"value": d.total_matches},
            {"display": ignore0(d.team_kills), "value": d.team_kills},
            {"display": ignore0(d.deaths), "value": d.deaths},
            {"display": ignore0(d.kills), "value": d.kills},
            {"display": `${d.eff.toFixed(2)}%`, "value": d.eff},
        ]
    }

    render(){


        const headers = [
            "Name", "Matches", "Team Kills", "Deaths", "Kills", "Efficiency"
        ];

        const rows = [];

        const totals = {
            "teamKills": 0,
            "deaths": 0,
            "kills": 0,
            "matches": 0
        };

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(d.gametype_id !== this.mode) continue;

            totals.teamKills += d.team_kills;
            totals.deaths += d.deaths;
            totals.kills += d.kills;
            if(d.total_matches > totals.matches) totals.matches = d.total_matches;
            rows.push(this.createRow(d));
        }

        let footer = null;

        if(rows.length > 1){

            let eff = 0;

            if(totals.kills > 0){

                if(totals.deaths === 0 && totals.teamKills === 0){
                    eff = 100;
                }else{

                    const t = totals.deaths + totals.teamKills;
                    if(t !== 0){
                        eff = (totals.kills / (t + totals.kills)) * 100;
                    }
                }
            }

            footer = [
                {"display": "Totals"},
                {"display": totals.matches},
                {"display": "SUM", "dataType": "INT", "callback": ignore0},
                {"display": "SUM", "dataType": "INT", "callback": ignore0},
                {"display": "SUM", "dataType": "INT", "callback": ignore0},
                {"display": `${eff.toFixed(2)}%`},
            ];
        }

        const h = headers.map((h) =>{ return {"display": h}});

        if(this.table === undefined){

            this.table = new TESTUITable(
                this.parent, 
                {
                    "className": "t-width-1",
                    "headers": h,
                    footer},
                    rows);
        }else{
            this.table.updateRows(rows, h, footer);
        }
    }
}


class PlayerRankingSummary{

    constructor(parent, data){

        if(data.gametypes.length === 0 && data.maps.length === 0) return;

        this.parent = document.querySelector(parent);
        this.data = data;

        UIHeader(this.parent, "Ranking Summary");

        const infoContent = `Ranking positions based on gametypes or maps where the player has been active in the last ${data.maxDays} Days.`;

        this.parent.append(UIInfo(infoContent));

        this.mode = "gametypes";
        this.createTabs();


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


        return [
            {"display": `${data.position}${getOrdinal(data.position)}`, "value": data.position, "className": "ordinal"},
            {"display": data.name, "value": data.name.toLowerCase(), "className": "text-left"},
            {"display": toDateString(data.last_active, true), "value": data.last_active, "className": "date"},
            {"value": data.matches},
            {"display": toPlaytime(data.playtime), "value": data.playtime, "className": "playtime"},
            {"display": data.score.toFixed(2), "value": data.score}
        ];
    }

    render(){

        const headers = [
            "Place", "Name", "Last Active", 
            "Matches", "Playtime", "Points"
        ];


        const data = (this.mode === "gametypes") ? this.data.gametypes : this.data.maps;

        const rows = [];
        for(let i = 0; i < data.length; i++){

            rows.push(this.createRow(data[i]));
        }

        if(this.table === undefined){

            this.table = new TESTUITable(
                this.parent,
                {
                    "className": "t-width-1", 
                    "headers": headers.map((h) =>{ return {"display": h}})
                },
                rows
            );
        }else{

            this.table.updateRows(rows);
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


        let name = "Unknown";

        if(this.mode === "gametypes"){
            name = data.gametype_name;
        }else if(this.mode === "maps"){
            name = data.map_name;
        }else if(this.mode === "combined"){
            name = `Lifetime`;
        }


        const row = [
            {
                "display": `${data.pos+1}${getOrdinal(parseInt(data.pos) + 1)}`, 
                "value": data.pos
            },
            {
                "display": name,
                "value": name.toLowerCase(),
                "className": "text-left"
            }
        ];

        const ignore0keys = [
            "total_matches", "wins", "draws", "losses", "cap_for", "cap_against"
        ];

        for(let i = 0; i < ignore0keys.length; i++){
            row.push({"display": ignore0(data[ignore0keys[i]]), "value": data[ignore0keys[i]]});
        }


        let diff = data.cap_offset;

        if(diff > 0){
            diff = `+${diff}`;
        }

        row.push({"display": diff, "value": data.cap_offset},{"display": ignore0(data.points), "value": data.points});


        return row;
    }

    render(){


        const headers = [
            "Place", "Name", "Played", "Wins", "Draws", "Losses",
            "Caps For", "Caps Against", "Cap Diff", "Points"
        ];
      
        const rows = [];

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];
            
            if(this.mode === "gametypes" && (d.map_id !== 0 || d.gametype_id === 0)) continue;
            if(this.mode === "maps" && (d.map_id === 0 || d.gametype_id !== 0)) continue;
            if(this.mode === "combined" && (d.map_id !== 0 || d.gametype_id !== 0)) continue;

            rows.push(this.createRow(d));
        }

        if(this.table === undefined){
            this.table = new TESTUITable(this.parent, {"className": "t-width-1", "headers": headers.map((h) =>{return {"display": h}})}, rows);
        }else{
            this.table.updateRows(rows);
        }
    }
}


function playerPermaLinks(parent, hash){

    parent = document.querySelector(parent);

    new UIWatchlistButton(parent, "players", hash);
    UICopyURLToClipboard(parent, "Copy Player Perma Link To Clipboard", `/player/${hash}`);
}