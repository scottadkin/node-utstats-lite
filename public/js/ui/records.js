class RecordsSearchForm{

    constructor(parent, mode, validMatchTypes, validLifetimeTypes, gametypeNames, selectedGametype, selectedCat){

        this.parent = document.querySelector(parent);
        this.lifetimeTypes = validLifetimeTypes;
        this.matchTypes = validMatchTypes;
        this.gametypeNames = gametypeNames;
        this.selectedGametype = selectedGametype;
        this.selectedCat = selectedCat;

        this.wrapper = document.createElement("div");
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

        const typeRow = document.createElement("div");
        typeRow.className = "form-row";

        const tLabel = document.createElement("label");
        tLabel.htmlFor = "cat";
        tLabel.innerHTML = "Record Type";
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

        const gametypeRow = document.createElement("div");
        gametypeRow.className = "form-row";
        const gLable = document.createElement("label");
        gLable.htmlFor = "g";
        gLable.innerHTML = `Gametype`;
        gametypeRow.append(gLable);

        const gSelect = document.createElement("select");
        gSelect.className = "default-select";
        gSelect.id = "g";
        gSelect.name = "g";


        for(let i = 0; i < this.gametypeNames.length; i++){

            const {id, name} = this.gametypeNames[i];

            const option = document.createElement("option");
            option.value = id;
            option.innerHTML = name;
            if(id == this.selectedGametype) option.selected = true;
            gSelect.append(option);
        }

        gametypeRow.append(gSelect);

        gSelect.addEventListener("change", (e) =>{
         
            this.selectedGametype = e.target.value;
            this.updateUrl();
        });

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

        this.table = document.createElement("table");
        this.table.className = `t-width-1`;
        this.parent.append(this.table);

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

        const headerRow = document.createElement("tr");

        for(let i = 0; i < headers.length; i++){
            headerRow.append(UITableHeaderColumn({"content": headers[i]}));
        }

        this.table.append(headerRow);


        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            const row = document.createElement("tr");

            const place = i + 1 + (this.perPage * (this.currentPage - 1));

            row.append(UITableColumn({"content": place, "parse": ["ordinal"], "className": "ordinal"}));
            row.append(UIPlayerLink({"playerId": d.player_id, "name": d.player_name, "country": d.player_country, "bTableElem": true}));
            row.append(UITableColumn({"content": d.last_active, "parse": ["date"], "className": "date"}));
            row.append(UITableColumn({"content": this.getGametypeName(d.gametype_id)}));
            row.append(UITableColumn({"content": d.playtime, "parse": ["playtime"], "className": "playtime"}));

            let valueOptions = {"content": d.record_value};

            if(this.cat === "playtime" || this.cat === "ttl"){
                valueOptions.parse = ["playtime"];
                valueOptions.className = "playtime";
            }

            row.append(UITableColumn(valueOptions));

            this.table.append(row);
        }
    }

    renderMatch(){

        const headers = [
            "Place", "Player", "Date", "Playtime", "Gametype", "Map", "Value"
        ];

        const headerRow = document.createElement("tr");

        for(let i = 0; i < headers.length; i++){

            headerRow.append(UITableHeaderColumn({"content": headers[i]}));
        }

        this.table.append(headerRow);

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            const row = document.createElement("tr");
            const place = i + 1 + (this.perPage * (this.currentPage - 1));

            row.append(UITableColumn({"content": place, "parse": ["ordinal"], "className": "ordinal"}));
            row.append(UIPlayerLink({"playerId": d.player_id, "name": d.player_name, "country": d.player_country, "bTableElem": true}));
            row.append(UITableColumn({"content": d.match_date, "parse": ["date"], "className": "date"}));
            row.append(UITableColumn({"content": d.time_on_server, "parse": ["playtime"], "className": "playtime"}));
            row.append(UITableColumn({"content": d.gametype_name}));
            row.append(UITableColumn({"content": d.map_name}));

            let valueOptions = {"content": d.record_type};

            if(this.cat === "time_on_server" || this.cat === "ttl"){
                valueOptions.parse = ["playtime"];
                valueOptions.className = "playtime";
            }
            row.append(UITableColumn(valueOptions));

            this.table.append(row);
        }
    }
}