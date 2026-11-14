class RankingsSearchForm{

    constructor(parent, mode, data, gametypeNames, mapNames, gametypeId, mapId, 
        selectedTimeRange, selectedPerPage, currentPage, seasonId, bSkipSeasonLinks){

        this.parent = document.querySelector(parent);
        this.seasonId = parseInt(seasonId);
        if(this.seasonId !== this.seasonId) throw new Error(`seasonId must be a valid integer`);
        this.mode = mode;
        this.data = data.data;
        this.totalResults = data.totalResults;
        this.gametypeNames = gametypeNames;
        this.mapNames = mapNames;
        this.selectedGametype = gametypeId;
        this.selectedMap = mapId;
        this.selectedTimeRange = selectedTimeRange;
        this.selectedPerPage = selectedPerPage;
        this.currentPage = currentPage;
        this.bSkipSeasonLinks = bSkipSeasonLinks;

        this.createTabs();

        this.wrapper = UIDiv();


        this.urlBase = (this.seasonId === 0) ? `/rankings/` : `/season/${this.seasonId}/rankings/`

        this.wrapper.action = `${this.urlBase}?mode=${mode}`;
   
        this.wrapper.method = "GET";

        this.parent.append(this.wrapper);

        this.createForm();

        this.render();
    }

    createTabs(){

        const options = [
            {"display": "Gametypes", "value": "gametype"},
            {"display": "Maps", "value": "map"},
            {"display": "Custom", "value": "custom"},
        ];

        this.tabs = new UITabs(this.parent, options, this.mode);
        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{
            window.location.replace(`${this.urlBase}?mode=${e.detail.newTab}&tf=${this.selectedTimeRange}&pp=${this.selectedPerPage}`);// = "#";
        });
    }


    changeURL(){

        let url = `?mode=${this.mode}&g=${this.selectedGametype}`;
        url += `&m=${this.selectedMap}&tf=${this.selectedTimeRange}&`;
        url += `pp=${this.selectedPerPage}&p=1`

        window.location.href = url;

    }

    createForm(){

        const form = UIDiv("form");

        const gametypeOptions = [];
        const mapOptions = [];
        
        for(const [id, name] of Object.entries(this.gametypeNames)){
            gametypeOptions.push({"display":name, "value": id});
        }


        for(const [id, name] of Object.entries(this.mapNames)){
            mapOptions.push({"display":name, "value": id});
        }
        
        function sbn(a, b){
            a = a.display.toLowerCase();
            b = b.display.toLowerCase();
            if(a < b) return -1;
            if(a > b) return 1;
            return 0;
        }

        gametypeOptions.sort(sbn);
        mapOptions.sort(sbn);


        if(this.mode === "custom"){
            gametypeOptions.unshift({"display": "All Time", "value": 0});
            mapOptions.unshift({"display": "All Time", "value": 0});
        }


        if(this.mode !== "map"){

            const gametypeRow = UIDiv("form-row");
            gametypeRow.append(UILabel("Gametype"));

            const gametypeSelect = new UISelect(
                gametypeRow,
                gametypeOptions,
                this.selectedGametype,
                (e) =>{ 

                    this.selectedGametype = e;
                    this.changeURL();
                }
            );

            form.append(gametypeRow);
        }

        if(this.mode !== "gametype"){

            const mapRow = UIDiv("form-row");
            mapRow.append(UILabel("Map"));

            const mapSelect = new UISelect(
                mapRow,
                mapOptions,
                this.selectedMap,
                (e) =>{ 
                    
                    this.selectedMap = e;
                    this.changeURL();
                }
            );


            form.append(mapRow);
        }

        const row = UIDiv("form-row");
        row.id = "last-active-row";

        const la = new UILastActiveSelect(row, this.selectedTimeRange, "tf");
        row.append(UILabel("Active In Previous"),la.elem.select);

        la.elem.select.addEventListener("change", (e) =>{
            this.selectedTimeRange = e.target.value;
            this.changeURL();
        });

        form.append(row);

        const perPageRow = UIDiv("form-row");

        const pp = new UIPerPageSelect(perPageRow, this.selectedPerPage, "pp");

        pp.elem.select.addEventListener("change", (e) =>{
            this.selectedPerPage = e.target.value;
            this.changeURL();
        });

        perPageRow.append(UILabel("Results Per Page"),pp.elem.select);

        form.append(perPageRow);
        this.wrapper.append(form);
    }

    render(){

        if(this.data.length === 0){

            new UIInfo(this.parent, [`There have not been enough matches played in the selected time range for there to be any rankings.`]);
            return;
        }

        const headers = ["Place", "Player", "Last Active", "Playtime", "Matches", "Score"];

        const tableOptions = {
            "className": "t-width-1",
            "headers": headers.map((h) => { return {"display": h}}),
            "bNoSort": true
        };

        const rows = this.data.map((d,i) =>{

            const place = (this.selectedPerPage * (this.currentPage - 1)) + i + 1;


            return [
                {"display": `${place}${getOrdinal(place)}`, "className": "ordinal"},
                {
                    "display": UIPlayerLink({
                    "playerId": d.player_id, 
                    "country": d.country, 
                    "name": d.name, "bTableElem": true,
                    "seasonId": this.seasonId,
                    "bSkipSeasonLinks": this.bSkipSeasonLinks
                })},
                {"display": toDateString(d.last_active, TIME_ZONE, true), "className": "date"},
                {"display": toPlaytime(d.playtime), "className": "playtime"},
                {"display": d.matches},
                {"display": d.score.toFixed(2)}
            ];
        });

        new TESTUITable(this.wrapper, tableOptions, rows)

        let url = `?mode=${this.mode}&g=${this.selectedGametype}`;
        url += `&m=${this.selectedMap}&tf=${this.selectedTimeRange}`;
        url += `&pp=${this.selectedPerPage}&p=`;

        new UIPagination(
            this.parent, 
            url, 
            this.totalResults, 
            this.selectedPerPage, 
            this.currentPage
        );
    }
}

class RankingsExplain{

    constructor(parent, settings, minMatchesSetting){

        this.parent = document.querySelector(parent);
        this.settings = settings;
        this.minMatchesSetting = minMatchesSetting;

        this.wrapper = UIDiv();

        const header = UIHeader(null, "Rankings Explained");
        header.className += ` no-margin-bottom`;
    
        this.mode = "general";
       
        this.parent.append(this.wrapper);

        const mainInfo = new UIInfo(null, [`Ranking scores are calculated by total various events in matches divided by playtime.`,
            UIBr(),
            `Players must participate in a minimum of ${this.minMatchesSetting} matches before getting a ranking score.`]);

        this.mainContent = [header, mainInfo.createElems()];

        new UICollapsibleDiv(this.wrapper, ["Explain Rankings"], this.mainContent, "", "text-center");

     
        
  
        
        this.createTabs();

        this.renderContent();
    }


    createTabs(){

        const options = [
            {"display": "General Events", "value": "general"},
            {"display": "CTF Events", "value": "ctf"},
            {"display": "Penalties", "value": "penalty"},
        ];

        this.tabsWrapper = UIDiv();
        this.tabs = new UITabs(this.tabsWrapper , options, this.mode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{
            this.mode = e.detail.newTab;
            this.renderContent();
        });

        this.mainContent.push(this.tabsWrapper);
    }

    renderContent(){

        

        let settings = this.settings[this.mode];

        if(settings === undefined) return;


        if(this.tableWrapper === undefined){
            this.tableWrapper = UIDiv();

            this.mainContent.push(this.tableWrapper);
            
        }

        settings = Object.values(settings);

        const rows = [];

        for(let i = 0; i < settings.length; i++){

            const s = settings[i];

            if(this.mode === "penalty" && !/under/i.test(s.displayName)){
                continue;
            }

            const row = [];

            let currentValue = s.points;

            if(this.mode === "penalty"){
                currentValue = `Final Score * ${currentValue.toFixed(2)}`;
            }

            row.push({
                    "value": s.displayName.toLowerCase(), 
                    "display": s.displayName, "className": "text-left"
                },
                {"value": currentValue, "className": "text-center"}
            );

            rows.push(row);
        }

        const tableOptions = {
            "className": "t-width-4 rankings-explained-table",
            "headers": [
                {"display": "Event"},
                {"display": (this.mode !== "penalty") ? "Value" : "Penalty"}
            ],
            "sortBy": (this.mode !== "penalty") ? 0 : 1
        };

        if(this.table === undefined){
            this.table = new TESTUITable(this.tableWrapper, tableOptions, rows);
        }else{

            this.table.setSortBy((this.mode !== "penalty") ? 0 : 1);
            this.table.updateRows(rows);
        }
        
        
        
    }
}