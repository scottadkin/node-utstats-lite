class SeasonMatches{

    constructor(seasonId, uniqueCombinations, selectedServer, selectedGametype, selectedMap, matches, page){

        this.seasonId = seasonId;
        this.uniqueCombinations = uniqueCombinations;
        this.matches = matches;
        this.page = parseInt(page);
        if(this.page !== this.page) this.page = 1;
        if(this.page < 1) this.page = 1;

        this.perPage = 25;

        this.selectedServer = parseInt(selectedServer);
        this.selectedGametype = parseInt(selectedGametype);
        this.selectedMap = parseInt(selectedMap);

        this.parent = document.querySelector("#root");

        this.wrapper = UIDiv();

        UIHeader(this.wrapper, "Season Matches");

        this.parent.append(this.wrapper);

        this.createForm();


        this.content = UIDiv();
        this.content.id = "matches-content";

        this.wrapper.append(this.content);

        this.richView = new MatchesRichView("#matches-content",  this.matches);
  
        this.pagination = new UIPagination(this.parent, `${this.getURL()}&page=`, this.matches.totalResults, this.perPage, this.page);
        
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

        let url = `/season/${this.seasonId}/matches?sid=${this.selectedServer}`;
        url += `&gid=${this.selectedGametype}`;
        url += `&mid=${this.selectedMap}`;

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
            url += `&mid=${this.selectedMap}&page=${this.page}`;

            const req = await fetch(url, {
                "signal": this.abortController.signal
            });

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            this.matches = res;
            this.content.innerHTML = ``;

   

            this.richView = new MatchesRichView("#matches-content",  this.matches);
            this.pagination.updateResults(this.page, this.matches.totalResults, this.perPage);


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
            this.updateURL();
            this.loadData();
        });

        this.mapRow = UIDiv("form-row");
        this.mapRow.append(UILabel("Map"));

        this.mapSelect = new UISelect(this.mapRow, this.getOptions("maps"), this.selectedMap, (e) =>{
            this.selectedMap = parseInt(e);
            this.updateURL();
            this.loadData();
        });

        this.form.append(this.serverRow, this.gametypeRow, this.mapRow);

        this.wrapper.append(this.form);
    }
}