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


class PlayerGeneralSummary{

    constructor(parent, data){

        this.parent = document.querySelector(parent);
        this.data = data;

        this.mode = "all";
        this.selectedType = "totals";

        this.wrapper = UIDiv();
        UIHeader(this.wrapper, "General Summary");

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


        const typeOptions = [
            {"display": "Totals", "value": "totals"},
            {"display": "Averages Per Match", "value": "avg-per-match"},
            {"display": "Events Per Minute", "value": "epm-per-min"},
        ];

        this.typeTabs = new UITabs(this.wrapper, typeOptions, this.selectedType);

        this.typeTabs.wrapper.addEventListener("tabChanged", (e) =>{
            this.selectedType = e.detail.newTab;
            this.render();
        });
    }


    bMatchCurrentFilter(gametypeId, mapId){

        if(this.mode === "gametypes" && mapId !== 0) return false;
        if(this.mode === "maps" && gametypeId !== 0) return false;
        if(this.mode === "all" && (gametypeId !== 0 || mapId !== 0)) return false;
        

        return true;
    }



    renderTotals(){

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

            if(!this.bMatchCurrentFilter(d.gametype_id, d.map_id)) continue;

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


    createTargetKeyColumns(targetKeys, d){

        const cols = [];

        const name = (this.mode === "gametypes") ? d.gametype_name : d.map_name;

        for(let i = 0; i < targetKeys.length; i++){

            const k = targetKeys[i];
            const value = d[k]

            cols.push({"display": (value === 0) ? "" : d[k].toFixed(2), value});
        }

        cols.unshift({"display": `${d.winrate.toFixed(2)}%`, "value": d.winrate});
        cols.unshift({"display": toPlaytime(d.playtime), "value": d.playtime, "className": "playtime"});
        

        if(this.mode !== "all"){
            cols.unshift({"display": name, "value": name.toLowerCase(), "className": "text-left"});
        }

        return cols;
    }


    renderAverage(headers, targetKeys){

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

            if(!this.bMatchCurrentFilter(d.gametype_id, d.map_id)) continue;

            const row = [...this.createTargetKeyColumns(targetKeys, d)];

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


    render(){


        const avgHeaders = [
            "Playtime", "Winrate", "Score", "Frags","Kills", "Deaths",
            "Suicides", "Team Kills", "Headshots", "Best Spree"
        ];


        const avgKeys = [
            "avg_score", "avg_frags", "avg_kills", "avg_deaths", 
            "avg_suicides", "avg_team_kills", "avg_headshots", "avg_spree_best"
        ];

    
        const epmHeaders = [
            "Playtime", "Winrate", "Score", "Frags","Kills", "Deaths",
            "Suicides", "Team Kills", "Headshots"
        ];


        const epmKeys = ["epm_score", "epm_frags", "epm_kills", "epm_deaths", "epm_suicides", "epm_team_kills", "epm_headshots"];


        if(this.selectedType === "totals"){
            this.renderTotals();
        }else if(this.selectedType === "avg-per-match"){
            this.renderAverage(avgHeaders, avgKeys);
        }else if(this.selectedType === "epm-per-min"){
            this.renderAverage(epmHeaders, epmKeys);
        }
    }
}


class PlayerSpecialEvents{
    
    constructor(parent, data){

        this.parent = document.querySelector(parent);
        this.data = data;
        UIHeader(parent, "Special Events");
        this.mode = "all";
        this.dataCat = "totals";


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


        const modeOptions = [
            {"display": "Totals", "value": "totals"},
            {"display": "Match Averages", "value": "averages"},
            {"display": "Events Per Minute", "value": "epm"},
        ];

        this.modeTabs = new UITabs(this.parent, modeOptions, this.dataCat);

        this.modeTabs.wrapper.addEventListener("tabChanged", (e) =>{
            this.dataCat = e.detail.newTab;
            this.render();
        }); 
    }


    bDataMatchFilter(gametypeId, mapId){

         if(this.mode === "all" && (gametypeId !== 0 || mapId !== 0)){    
            return false;
        }

        if(this.mode === "gametypes" && (mapId !== 0 || gametypeId === 0)){
            return false;
        }

        if(this.mode === "maps" && (gametypeId !== 0 || mapId === 0)){
            return false;
        }

        return true;
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

            if(!this.bDataMatchFilter(d.gametype_id, d.map_id)) continue;

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

                const value = d[keys[x]];

                let display = (this.dataCat === "totals") ? ignore0(value) : value.toFixed(3);

                if(this.dataCat === "averages" && x === keys.length - 1){
                    display = value.toFixed(2);
                }

                if(display === "0.000") display = "";
                row.push({value, display});
            }

            rows.push(row);
  
        }

        table.updateRows(rows, headers.map((h) =>{ return {"display": h}}), footer);

    }


    getHeadersKeys(){


        if(this.dataCat === "totals"){

            return { 
                "multiHeaders": [
                    "Double Kill",
                    "Multi Kill",
                    "Ultra Kill",
                    "Monster Kill",
                    "Best Multi Kill"
                ], 
                "spreeHeaders": [
                    "Killing Spree",
                    "Rampage",
                    "Dominating",
                    "Unstoppable",
                    "Godlike",
                    "Best Spree"
                ],
                "multiKeys": ["multi_1", "multi_2", "multi_3", "multi_4", "multi_best"],
                "spreeKeys": ["spree_1", "spree_2", "spree_3", "spree_4", "spree_5", "spree_best"]
            }

        }else if(this.dataCat === "averages"){

            return { 
                "multiHeaders": [
                    "Double Kill",
                    "Multi Kill",
                    "Ultra Kill",
                    "Monster Kill",
                    "AVG Best Multi Kill"
                ], 
                "spreeHeaders": [
                    "Killing Spree",
                    "Rampage",
                    "Dominating",
                    "Unstoppable",
                    "Godlike",
                    "AVG Best Spree"
                ],
                "multiKeys": ["avg_multi_1", "avg_multi_2", "avg_multi_3", "avg_multi_4", "avg_multi_best"],
                "spreeKeys": ["avg_spree_1", "avg_spree_2", "avg_spree_3", "avg_spree_4", "avg_spree_5", "avg_spree_best"]
            }

        }else if(this.dataCat === "epm"){

            return { 
                "multiHeaders": [
                    "Double Kill",
                    "Multi Kill",
                    "Ultra Kill",
                    "Monster Kill",
                ], 
                "spreeHeaders": [
                    "Killing Spree",
                    "Rampage",
                    "Dominating",
                    "Unstoppable",
                    "Godlike",
                ],
                "multiKeys": ["epm_multi_1", "epm_multi_2", "epm_multi_3", "epm_multi_4"],
                "spreeKeys": ["epm_spree_1", "epm_spree_2", "epm_spree_3", "epm_spree_4", "epm_spree_5"]
            }
        }


    }

    render(){

        const {multiHeaders, spreeHeaders, multiKeys, spreeKeys} = this.getHeadersKeys();

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
            {"display": "General Averages", "value": "general-averages"},
            {"display": "Return Averages", "value": "returns-averages"},
            {"display": "General EPM", "value": "general-epm"},
            {"display": "Returns EPM", "value": "returns-epm"},
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


    updateKey(type, key){

        if(type === "max"){
            key = `max_${key}`
        }else if(type === "avg"){
            key = `avg_${key}`;
        }else if(type === "epm"){
            key = `epm_${key}`;
        }

        return key;
    }

    createGeneralRow(data, type){


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
            

            const key = this.updateKey(type, `flag_${ignore0Keys[i]}`);

            let value = data[key];

            if(type !== "avg" && type !== "epm"){
                value = ignore0(data[key]);
            }else{
                value = data[key].toFixed(2);
                if(value == 0) value = "";
            }


            row.push({"display": value, "value": data[key]});
        }

        return row;
    }

    createReturnsRow(data, type){

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

            const key = this.updateKey(type, `flag_return${ignore0Keys[i]}`);

            let value = data[key];

            if(type !== "avg" && type !== "epm"){
                value = ignore0(data[key]);
            }else{
                value = parseFloat(data[key].toFixed(2));

                if(value == 0) value = "";
            }

            row.push({"display": value, "value": data[key]});
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


        const returnModes = ["returns", "return-records", "returns-averages", "returns-epm"];

        let headers = (returnModes.indexOf(this.mode) === -1) ? generalHeaders : returnHeaders;

        
        if(this.type === "maps") headers[0] = "Map";

        headers = headers.map((h) =>{ return {"display": h}});

        const footer = [];

        const ignoreFooterTypes = [
            "returns-averages", "general-averages", "returns-epm", "general-epm"
        ];

        if(ignoreFooterTypes.indexOf(this.mode) === -1){
            for(let i = 0; i < headers.length; i++){

                if(i === 0){
                    footer.push({"display": "Total", "className": "text-left"});
                }else{


                    footer.push({"display": "SUM", "dataType": "INT", "callback": ignore0});
                    
                }
            }
        }
  

        const rows = [];
        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(this.type === "gametypes" && (d.map_id !== 0 || d.gametype_id === 0)) continue;
            if(this.type === "maps" && (d.gametype_id !== 0 || d.map_id === 0)) continue;
            if(this.type === "lifetime" && (d.gametype_id !== 0 || d.map_id !== 0)) continue;

            if(this.mode === "general"){
                rows.push(this.createGeneralRow(d, "totals"));
            }else if(this.mode === "returns"){
                rows.push(this.createReturnsRow(d, "totals"));
            }else if(this.mode === "general-records"){
                rows.push(this.createGeneralRow(d, "max"));
            }else if(this.mode === "return-records"){
                rows.push(this.createReturnsRow(d, "max"));
            }else if(this.mode === "general-averages"){
                rows.push(this.createGeneralRow(d, "avg"));
            }else if(this.mode === "returns-averages"){
                rows.push(this.createReturnsRow(d, "avg"));
            }else if(this.mode === "general-epm"){
                rows.push(this.createGeneralRow(d, "epm"));
            }else if(this.mode === "returns-epm"){
                rows.push(this.createReturnsRow(d, "epm"));
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
        this.dataCat = "totals";

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
        });


        const typeTabOptions = [
            {"display": "Totals", "value": "totals"},
            {"display": "Match Averages", "value": "averages"},
            {"display": "Events Per Minute", "value": "epm"},
        ];

        this.typeTabs = new UITabs(this.wrapper, typeTabOptions, this.dataCat);

        this.typeTabs.wrapper.addEventListener("tabChanged", (e) =>{
            this.dataCat = e.detail.newTab;
            this.render();
        });
    }

    createRow(data){

        const row = [];

        if(this.mode !== "all"){

            const name = (this.mode === "gametypes") ? data.gametype_name : data.map_name;
            row.unshift({"display": name, "value": name.toLowerCase(), "className": "text-left"});
        }

        const keys = ["boots", "body", "pads", "invis", "shp", "belt", "amp"];

        row.push({"display": toPlaytime(data.playtime), "value":data.playtime, "className": "playtime"});

        for(let i = 0; i < keys.length; i++){

            let key = `item_${keys[i]}`;
            if(this.dataCat === "averages"){
                key = `avg_${key}`;
            }else if(this.dataCat === "epm"){
                key = `epm_${key}`;
            }

            let display = (this.dataCat === "totals") ? ignore0(data[key]) :  data[key].toFixed(3);
            if(display === "0.000") display = "";

            row.push({display, "value": data[key]});
        }

        return row;
    }

    bAnyData(data){

        const keys = ["boots", "body", "pads", "invis", "shp", "belt", "amp"];

        for(let i = 0; i < keys.length; i++){

            let key = `item_${keys[i]}`;
            if(this.dataCat === "averages"){
                key = `avg_${key}`;
            }else if(this.dataCat === "epm"){
                key = `epm_${key}`;
            }

            if(data[key] > 0) return true;
        }

        return false;
    }

    bMatchDataFilter(gametypeId, mapId){

        if(this.mode === "all" && (gametypeId !== 0 || mapId !== 0)) return false;
        if(this.mode === "gametypes" && (gametypeId === 0 || mapId !== 0)) return false;
        if(this.mode === "maps" && (mapId === 0 || gametypeId !== 0)) return false;

        return true;
    }
    
    getHeaders(){

        const headers = [
            "Playtime", "Jump Boots", "Body Armour", "Thigh Pads", "Invisibility", 
            "Super Health Pack", "Shield Belt", "Damage Amplifier"
        ];

        


        if(this.mode === "gametypes"){
            headers.unshift("Gametype");
        }else if(this.mode === "maps"){
            headers.unshift("Map");
        }

        return headers;
    }

    render(){

     
        const headers = this.getHeaders();

        const rows = [];
        let footer = null;
        
        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(!this.bMatchDataFilter(d.gametype_id, d.map_id) || !this.bAnyData(d)) continue;

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
        this.mode = "all";
        this.dataCat = "totals";
        this.selectedGametype = 0;
        this.selectedMap = 0;

        this.wrapper = UIDiv();

        this.parent.append(this.wrapper);
        UIHeader(this.wrapper, "Weapons Summary");

        this.getAllUniqueNames();
        this.createTabs();

        

        this.render();
    }

    sortByDisplayName(a, b){

        a = a.display.toLowerCase();
        b = b.display.toLowerCase();

        if(a < b){
            return -1;
        }else if(a > b){
            return 1;
        }
        return 0;
    }

    getAllUniqueNames(){

        this.gametypeNames = [];
        this.mapNames = [];

        const foundGametypes = new Set();
        const foundMaps = new Set();

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(d.gametype_name !== "All Gametypes" && !foundGametypes.has(d.gametype_id)){
                foundGametypes.add(d.gametype_id);
                this.gametypeNames.push({"value": d.gametype_id, "display": d.gametype_name});
            }

            if(d.map_name !== "All Maps" && !foundMaps.has(d.map_id)){

                foundMaps.add(d.map_id);
                this.mapNames.push({"value": d.map_id, "display": d.map_name});
            }
        }

        this.allMapNames = this.mapNames;
        this.allGametypeNames = this.gametypeNames;
        
        this.gametypeNames.sort(this.sortByDisplayName);
        this.mapNames.sort(this.sortByDisplayName);

        if(this.gametypeNames.length > 0){
            this.selectedGametype = this.gametypeNames[0].value;
        }

        if(this.mapNames.length > 0){
            this.selectedMap = this.mapNames[0].value;
        }
    }

    filterMaps(gametype){

        const found = [];
        const usedIds = new Set();

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(d.gametype_id !== gametype) continue;
            if(usedIds.has(d.map_id) || d.map_id === 0) continue;
            usedIds.add(d.map_id);
            found.push(d);
        }

        return found;
    }

    toggleDropDowns(){

        this.gametypeRow.className = (this.mode === "gametypes" || this.mode === "custom") ? "form-row" : "hidden";
        this.mapRow.className = (this.mode === "maps" || this.mode === "custom") ? "form-row" : "hidden";


        if(this.mode === "custom"){

            const currentMaps = this.filterMaps(this.selectedGametype);

            let selectedMap = 0;

            const a = currentMaps.map((d, i) =>{
                if(i === 0) selectedMap = d.map_id;
                return {"value": d.map_id, "display": d.map_name};
            });

            this.selectedMap = selectedMap;

            this.mapSelect.updateOptions(a, 0);
        }else{
            if(this.mode !== "maps"){
                this.selectedMap = 0;
            }
            this.mapSelect.updateOptions(this.mapNames, 0);
        }
    }

    createTabs(){

        const options = [
            {"display": "All Time", "value": "all"},
            {"display": "Gametypes", "value": "gametypes"},
            {"display": "Maps", "value": "maps"},
            {"display": "Custom", "value": "custom"},
        ];


        this.tabs = new UITabs(this.wrapper, options, this.mode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{

            this.mode = e.detail.newTab;

            this.toggleDropDowns();
            this.render();
        })

        const dataOptions = [
            {"display": "Totals", "value": "totals"},
            {"display": "Averages", "value": "averages"},
            {"display": "Events Per Minute", "value": "epm"},
        ];

        this.dataTabs = new UITabs(this.wrapper, dataOptions, this.dataCat);

        this.dataTabs.wrapper.addEventListener("tabChanged", (e) =>{
            this.dataCat = e.detail.newTab;
            this.toggleDropDowns();
            this.render();
        });

        this.gametypeRow = UIDiv(`form-row ${(this.mode === "gametypes" || this.mode === "custom") ? "" : "hidden"}`);

        this.gametypeRow.append(UILabel("Gametype"));

        this.gametypeSelect = new UISelect(this.gametypeRow, this.gametypeNames, this.selectedGametype, (e) =>{
            this.selectedGametype = parseInt(e);
            this.toggleDropDowns();
            this.render();
        });

        this.wrapper.append(this.gametypeRow);


        this.mapRow = UIDiv(`form-row ${(this.mode === "maps" || this.mode === "custom") ? "" : "hidden"}`);
        this.mapRow.append(UILabel("Map"));

        this.mapSelect = new UISelect(this.mapRow, this.mapNames, this.selectedMap, (e) =>{
            this.selectedMap = parseInt(e);
       
            this.render();
        });

        this.wrapper.append(this.mapRow);

    }

    createRow(d){

        const row = [
            {"display": d.weapon_name, "value":d.weapon_name.toLowerCase(), "className": "text-left"},
            
        ];


        if(this.dataCat !== "epm"){
            row.push({"value": d.total_matches});
        }else{
            row.push({"value": d.playtime, "display": toPlaytime(d.playtime), "className": "playtime"});
        }

        if(this.dataCat === "totals"){

            return [
                ...row,
                {"display": ignore0(d.team_kills), "value": d.team_kills},
                {"display": ignore0(d.max_team_kills), "value": d.max_team_kills},
                {"display": ignore0(d.deaths), "value": d.deaths},
                {"display": ignore0(d.max_deaths), "value": d.max_deaths},
                {"display": ignore0(d.suicides), "value": d.suicides},
                {"display": ignore0(d.max_suicides), "value": d.max_suicides},
                {"display": ignore0(d.kills), "value": d.kills},
                {"display": ignore0(d.max_kills), "value": d.max_kills},
                {"display": `${d.eff.toFixed(2)}%`, "value": d.eff},   
            ];

        }else if(this.dataCat === "averages"){


            let tk = d.avg_team_kills.toFixed(2);
            if(tk === "0.00") tk = "";

            let deaths = d.avg_deaths.toFixed(2);
            if(deaths === "0.00") deaths = "";

            let suicides = d.avg_suicides.toFixed(2);
            if(suicides === "0.00") suicides = "";

            let kills = d.avg_kills.toFixed(2);
            if(kills === "0.00") kills = "";

            return [
                ...row,
                {"display": tk, "value": d.avg_team_kills},
                {"display": deaths, "value": d.avg_deaths},
                {"display": suicides, "value": d.avg_suicides},
                {"display": kills, "value": d.avg_kills},
            ];

        }else if(this.dataCat === "epm"){

            let tk = d.epm_team_kills.toFixed(2);
            let deaths = d.epm_deaths.toFixed(2);
            let suicides = d.epm_suicides.toFixed(2);
            let kills = d.epm_kills.toFixed(2);

            return [
                ...row,
                {"value": d.epm_team_kills, "display": (tk !== "0.00") ? tk : ""},
                {"value": d.epm_deaths, "display": (deaths !== "0.00") ? deaths : ""},
                {"value": d.epm_suicides, "display": (suicides !== "0.00") ? suicides : ""},
                {"value": d.epm_kills, "display": (kills !== "0.00") ? kills : ""},
            ];
        }

        return [];
    }

    bDataMatchFilter(gametypeId, mapId){

        if(this.mode === "all" && (gametypeId !== 0 || mapId !== 0)) return false;
        if(this.mode === "gametypes" && mapId !== 0) return false;
        if(this.mode === "gametypes" && (this.selectedGametype === 0 || gametypeId !== this.selectedGametype)) return false;

        if(this.mode === "maps" && gametypeId !== 0) return false;
        if(this.mode === "maps" && (this.selectedMap === 0 || mapId !== this.selectedMap)) return false;

        if(this.mode === "custom" && (gametypeId !== this.selectedGametype || mapId !== this.selectedMap)) return false;

        return true;
    }


    getTotalsFooter(rows, totals){

        if(this.dataCat === "totals"){

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

                return [
                    {"display": "Totals"},
                    {"display": `${totals.matches}(MAX)`},
                    {"display": "SUM", "dataType": "INT", "callback": ignore0},
                    {"display": "MAX", "dataType": "INT", "callback": ignore0},
                    {"display": "SUM", "dataType": "INT", "callback": ignore0},
                    {"display": "MAX", "dataType": "INT", "callback": ignore0},
                    {"display": "SUM", "dataType": "INT", "callback": ignore0},
                    {"display": "MAX", "dataType": "INT", "callback": ignore0},
                    {"display": "SUM", "dataType": "INT", "callback": ignore0},
                    {"display": "MAX", "dataType": "INT", "callback": ignore0},
                    {"display": `${eff.toFixed(2)}%`},
                ];
            }
        }


        return null;
    }



    render(){

        const totalHeaders = [
            "Name", "Matches", "Team Kills",
            "Worst Team Kills", "Deaths", "Worst Deaths", 
            "Suicides", "Most Suicides", "Kills", 
            "Best Kills", "Efficiency"
        ];

        const avgHeaders = [
           "Name", "Matches", "Team Kills","Deaths", 
           "Suicides", "Kills"
        ];

        const epmHeaders = [
            "Name", "Playtime", "Team Kills", "Deaths", "Suicides", "Kills"
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

            if(!this.bDataMatchFilter(d.gametype_id, d.map_id)) continue;

            totals.teamKills += d.team_kills;
            totals.deaths += d.deaths;
            totals.kills += d.kills;
            if(d.total_matches > totals.matches) totals.matches = d.total_matches;
            rows.push(this.createRow(d));
        }

        let footer = null;

        if(this.dataCat === "totals"){
            footer = this.getTotalsFooter(rows, totals);
        }

        let h = [];

        if(this.dataCat === "totals"){
            h = totalHeaders.map((h) =>{ return {"display": h}});
        }else if(this.dataCat === "averages"){
            h = avgHeaders.map((h) =>{ return {"display": h}});
        }else if(this.dataCat === "epm"){
            h = epmHeaders.map((h) =>{ return {"display": h}});
        }
        
        if(this.table === undefined){

            this.table = new TESTUITable(

                this.parent, 
                {
                    "className": "t-width-1",
                    "headers": h,
                    footer
                },
                rows
            );

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

        new UIInfo(this.parent, [infoContent]);

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