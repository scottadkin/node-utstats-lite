class RecordsPage{

    constructor(parent, mode, validTypes, modeTitles, gametypes, maps, 
        gametypeMapCombos, selectedGametype, selectedMap, recordType, data, totalResults,
        page, perPage
    ){


        this.parent = document.querySelector(parent);
        this.mode = mode;
        this.validTypes = validTypes;
        this.modeTitles = modeTitles;

        this.gametypes = gametypes;
        this.maps = maps;
        this.gametypeMapCombos = gametypeMapCombos;

        this.selectedRecordType = recordType;
        this.selectedGametype = parseInt(selectedGametype);
        this.selectedMap = parseInt(selectedMap);
        this.data = data;
        this.totalResults = totalResults;

        page = parseInt(page);
        if(page !== page) page = 1;

        perPage = parseInt(perPage);
        if(perPage !== perPage) perPage = 25;

        this.page = page;
        this.perPage = perPage;


        this.createTabs();
        this.createInfo();
        this.createDropDowns();

        this.header = UIHeader(this.parent, "Records");

        this.render();
    }

    createTabs(){

        const options = [
            {"display": "Player Match Records", "value": "player-match"},
            {"display": "Player Lifetime Records", "value": "player-lifetime"},
        ];

        this.tabs = new UITabs(this.parent, options, this.mode); 

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{

            this.mode = e.detail.newTab;
            this.updateInfoContent();

            this.page = 1;

            
            
            if(!this.recordSelect.updateOptions(this.getRecordOptions(), this.selectedRecordType)){

                const newValue = this.recordSelect.options[0]?.value ?? "score";

                this.recordSelect.changeSelected(newValue);
                this.selectedRecordType = newValue;

                
            }

            this.loadData();
            
            this.render();
        });
    }

    async loadData(){

        try{
            

            this.updateHistory();

            let url = `/json/load-records/?cat=${this.mode}`;
            url += `&rt=${this.selectedRecordType}`;
            url += `&gid=${this.selectedGametype}`;
            url += `&mid=${this.selectedMap}`;
            url += `&p=${this.page}&pp=${this.perPage}`;

            const req = await fetch(`${url}`);

            const res = await req.json();


            if(res.error !== undefined) throw new Error(res.error);

            this.data = res.data;
            this.totalResults = res.totalResults;

            this.render();

        }catch(err){
            console.trace(err);
            new UINotification(this.parent, "error", "Failed To Load Data", err.toString());
        }
    }

    createUrl(){

        return `/records?mode=${this.mode}&rec=${this.selectedRecordType}&gid=${this.selectedGametype}&mid=${this.selectedMap}`;
    }

    updateHistory(){
        history.pushState({}, "", this.createUrl());
    }

    updateInfoContent(){

        const content = [];

        if(this.mode === "player-match"){

            content.push(`Player match records are the highest values for a specific stat in a single match.`);

        }else if(this.mode === "player-lifetime"){

            content.push(`Player lifetime records are the total values for a specific stat.`);
        }

        this.info.updateContent(content);
    }

    createInfo(){

        this.info = new UIInfo(this.parent, []);

        this.updateInfoContent();
    }


    getIdName(type, id){

        const options = (type === "gametypes") ? this.gametypes : this.maps;

        for(let i = 0; i < options.length; i++){

            const m = options[i];

            if(m.id === id) return m.name;
        }

        return "Not Found";
    }


    getMapOptions(){

        const options = [];


        for(let i = 0; i < this.gametypeMapCombos.length; i++){

            const c = this.gametypeMapCombos[i];

            if(this.selectedGametype === 0 || this.selectedGametype === c.gId){

                options.push({"display": this.getIdName("maps", c.mId), "value": c.mId});

            }
        }

        options.sort(sortUISelectOptionsByDisplay);


        options.unshift({"display": "Any", "value": 0});


        return options;
    }


    getRecordOptions(){

        if(this.validTypes[this.mode] === undefined){

            throw new Error(`${this.mode} is no a valid record mode`);
        }

        

        return this.validTypes[this.mode];
    }

    createDropDowns(){


        this.form = UIDiv("form");

        this.recordRow = UIDiv("form-row");
        this.recordRow.append(UILabel("Record Type"));
        this.recordSelect = new UISelect(this.recordRow, this.getRecordOptions(), this.selectedRecordType, (e) =>{

            this.selectedRecordType = e;
            this.page = 1;
            this.loadData();
            this.pagination.changeUrl(`${this.createUrl()}&page=`);
            
        
        });
        

        this.gametypeRow = UIDiv("form-row");
        this.mapRow = UIDiv("form-row");

        this.gametypeRow.append(UILabel("Gametype"));
        this.mapRow.append(UILabel("Map"));


        const gametypeOptions = this.gametypes.map((g) =>{
            return {"display": g.name, "value": g.id};
        });

        
        gametypeOptions.sort(sortUISelectOptionsByDisplay)


        gametypeOptions.unshift({"display": "Any", "value": 0});

        this.gametypeSelect = new UISelect(this.gametypeRow, gametypeOptions, this.selectedGametype, (e) =>{

            this.selectedGametype = parseInt(e);
            
            if(!this.mapSelect.updateOptions(this.getMapOptions())){
    
                const newSel = this.mapSelect.options[0]?.value ?? 0;
                this.mapSelect.changeSelected(newSel);
                this.selectedMap = newSel;
                this.page = 1;
            }

            this.pagination.changeUrl(`${this.createUrl()}&page=`);
            
            this.loadData();

        });

        this.mapSelect = new UISelect(this.mapRow, this.getMapOptions(), this.selectedMap, (e) =>{

            this.selectedMap = parseInt(e);
            this.page = 1;
            this.pagination.changeUrl(`${this.createUrl()}&page=`);
            this.loadData();
        });


        this.form.append(this.recordRow, this.gametypeRow, this.mapRow);
        this.parent.append(this.form);

    }


    getDisplayName(name){

        const options = this.validTypes[this.mode] ?? null;

        if(options === null) throw new Error(`validTypes is null`);

        for(let i = 0; i < options.length; i++){

            const {display, value} = options[i];

            if(value === name) return display;
        }



        return "Not Found";
    }

    updateHeader(){

        const displayName = this.getDisplayName(this.selectedRecordType);

        let title = "";

        if(this.mode === "player-match"){

            title = "Player Single Match Records";

        }else if(this.mode === "player-lifetime"){

            title = "Player Lifetime Records";
        }

        this.header.innerHTML = '';
        this.header.append(`${displayName} - ${title}`);
    }

    render(){

        this.updateHeader();
        const tableOptions = {
            "className": "t-width-1",
            "bNoSort": true,
            "headers": [
                {"display": "Pos"},
                {"display": "Player"},
                {"display": "Last Seen"},
                {"display": "Matches Played"},
                {"display": "Total Playtime"},
                {"display": this.getDisplayName(this.selectedRecordType)},
            ]
        };


        const rows = this.data.map((d, i) =>{
            const pos = i + 1 + (this.page - 1) * this.perPage;
            return [
                {
                    "display": `${pos}${getOrdinal(pos)}`, "className": "ordinal"
                },
                {"display": UIPlayerLink({
                    "playerId": d.player_id,
                    "country": d.country,
                    "name": d.player_name,
                    "bTableElem": true
                }),
                 "bSkipTD": true
            },
                {"display": toDateString(d.last_active, TIME_ZONE, true), "className": "date"},
                {"display": d.total_matches},
                {"display": toPlaytime(d.playtime), "className": "playtime"},
                {"display": d.record_value},
            ];
        });

        if(this.table === undefined){

            this.table = new TESTUITable(this.parent, tableOptions, rows);
        }else{

            this.table.updateRows(rows, tableOptions.headers);
        }


        if(this.pagination === undefined){
            this.pagination = new UIPagination(this.parent, `${this.createUrl()}&page=`, this.totalResults, this.perPage, this.page);
        }else{
            this.pagination.updateResults(this.page, this.totalResults, this.perPage);
        }

    }
}