class RecordsSearchForm{

    constructor(parent, mode, validMatchTypes, validLifetimeTypes, gametypeNames, selectedGametype, selectedCat){

        this.parent = document.querySelector(parent);
        this.lifetimeTypes = validLifetimeTypes;
        this.matchTypes = validMatchTypes;
        this.gametypeNames = gametypeNames;
        this.selectedGametype = selectedGametype;
        this.selectedCat = selectedCat;

        this.wrapper = UIDiv();
        this.parent.append(this.wrapper);

        this.mode = mode;

        this.createTabs();
        this.createForm();

    }

    createTabs(){

        const options = [
            {"display": "Match Records", "value": "match"},
            {"display": "Lifetime Records", "value": "lifetime"},
        ];

        this.tabs = new UITabs(this.parent, options, this.mode);
        
        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{
            window.location = `/records/?mode=${e.detail.newTab}`;
        });
    }

    createForm(){

        this.form = document.createElement("form");
        this.form.className = "form";
        

        this.parent.append(this.form);

        const typeRow = UIDiv("form-row");

        const tLabel = UILabel("Record Type", "cat");
        typeRow.append(tLabel);

        const tSelect = new UIRecordsTypeSelect(
            typeRow, 
            this.mode, 
            this.selectedCat, 
            {"matches": this.matchTypes , "lifetime": this.lifetimeTypes}
        );


        tSelect.elem.select.id = tSelect.elem.select.name = "cat";

        tSelect.elem.select.addEventListener("change", (e) =>{
            this.selectedCat = e.target.value;
            this.updateUrl();
        });

        typeRow.append(tSelect.elem.select);
        
        this.form.append(typeRow);

        const gametypeRow = UIDiv("form-row");
        const gLable = UILabel("Gametype", "g");
        gametypeRow.append(gLable);


        const gametypeOptions = this.gametypeNames.map((g) =>{ return {"display": g.name, "value": g.id}});

        const gSelect = new UISelect(gametypeRow, gametypeOptions, this.selectedGametype, (e) =>{
            this.selectedGametype = parseInt(e);
            this.updateUrl();
        }, "g", "g");



        this.form.append(gametypeRow);
    }

    updateUrl(){

        window.location = `/records/?mode=${this.mode}&cat=${this.selectedCat}&g=${this.selectedGametype}`;
    }
}


class RecordsDataDisplay{

    constructor(parent, mode, cat, gametype, data, title, gametypeNames, totalResults, page, perPage){

        if(data.length === 0) return;
        
        this.parent = document.querySelector(parent);
        this.mode = mode;
        this.cat = cat;
        this.gametype = gametype;
        this.data = data;
        this.gametypeNames = gametypeNames;
        this.totalResults = totalResults;
        this.perPage = perPage;
        this.currentPage = page;

        UIHeader(this.parent, `${title} - ${(mode === "match") ? "Single Match" : "Lifetime"} Records`);

        if(this.mode === "match"){
            this.renderMatch();
        }else if(this.mode === "lifetime"){
            this.renderLifetime();
        }

        this.pagination = new UIPagination(
            this.parent, 
            `/records/?mode=${this.mode}&cat=${this.cat}&g=${this.gametype}&page=`, 
            this.totalResults, 
            this.perPage, 
            this.currentPage
        );
    }

    getGametypeName(id){

        for(let i = 0; i < this.gametypeNames.length; i++){

            const g = this.gametypeNames[i];
            if(g.id == -1 && id == 0) return "All";
            if(g.id == id) return g.name;
        }

        return "Not Found";
    }

    renderLifetime(){

        const headers = [
            "Place", "Player", "Last Active", "Gametype",  "Playtime", "Value"
        ];

        const rows = [];

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            const place = i + 1 + (this.perPage * (this.currentPage - 1));

            const row = [
                {"display": `${place}${getOrdinal(place)}`, "className": "ordinal"},
                {"display": UIPlayerLink({"playerId": d.player_id, "name": d.player_name, "country": d.player_country, "bTableElem": true}), "bSkipTD": true},
                {"display": toDateString(d.last_active, true), "className": "date"},
                {"display": this.getGametypeName(d.gametype_id)},
                {"display": toPlaytime(d.playtime), "className": "playtime"},
            ];

            if(this.cat === "playtime" || this.cat === "ttl"){
                row.push({"display": toPlaytime(d.record_value), "className": "playtime"});
            }else{
                row.push({"display": d.record_value});
            }


            rows.push(row);
        }

        const tableOptions = {
            "className": "t-width-1",
            "bNoSort": true,
            "headers": headers.map((h) =>{ return {"display": h}})
        };

        if(this.table === undefined){
            this.table = new TESTUITable(this.parent, tableOptions, rows)
        }else{
            this.table.updateRows(rows, tableOptions.headers);
        }
    }

    renderMatch(){

        const headers = [
            "Place", "Player", "Date", "Playtime", "Gametype", "Map", "Value"
        ];

        const rows = [];

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            const place = i + 1 + (this.perPage * (this.currentPage - 1));


            const row = [
                {"display": `${place}${getOrdinal(place)}`, "className": "ordinal"},
                {"display": UIPlayerLink({"playerId": d.player_id, "name": d.player_name, "country": d.player_country, "bTableElem": true}), "bSkipTD": true},
                {"display": toDateString(d.match_date, true), "className": "date"},
                {"display": toPlaytime(d.time_on_server), "className": "playtime"},
                {"display": d.gametype_name},
                {"display": d.map_name},
            ];


            if(this.cat === "time_on_server" || this.cat === "ttl"){
                row.push({"display": toPlaytime(d.record_type), "className": "playtime"});
            }else{
                row.push({"display": d.record_type});
            }

            rows.push(row);
        }

        const tableOptions = {
            "className": "t-width-1",
            "bNoSort": true,
            "headers": headers.map((h) =>{ return {"display": h}})
        };

        if(this.table === undefined){
            this.table = new TESTUITable(this.parent, tableOptions, rows)
        }else{
            this.table.updateRows(rows, tableOptions.headers);
        }
    }
}