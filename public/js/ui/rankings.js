class RankingsSearchForm{

    constructor(parent, mode, data, names, selectedId, selectedTimeRange, selectedPerPage, currentPage, minMatchesSetting){

        this.parent = document.querySelector(parent);
        this.mode = mode;
        this.data = data.data;
        this.totalResults = data.totalResults;
        this.names = names;
        this.selectedId = selectedId;
        this.selectedTimeRange = selectedTimeRange;
        this.selectedPerPage = selectedPerPage;
        this.currentPage = currentPage;
        this.minMatchesSetting = minMatchesSetting;

        this.createTabs();

        this.wrapper = document.createElement("form");
        this.wrapper.className = "form";
        this.wrapper.action = `/rankings/?mode=${mode}`;
        this.wrapper.method = "GET";

        this.parent.append(this.wrapper);

        this.createForm();

        this.table = document.createElement("table");
        this.table.className = `t-width-1`;

        this.parent.append(this.table);

        this.render();
    }

    createTabs(){

        const options = [
            {"display": "Gametypes", "value": "gametype"},
            {"display": "Maps", "value": "map"},
        ];

        this.tabs = new UITabs(this.parent, options, this.mode);
        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{
            window.location.replace(`/rankings/?mode=${e.detail.newTab}`);// = "#";
        });
    }


    createDropDownRow(type, display, options, selected){

        const row = document.createElement("div");
        row.className = `form-row`;
        const label = document.createElement("label");
        label.htmlFor = type;
        label.innerHTML = display;
        row.append(label);

        const select = document.createElement("select");
        select.className = "default-select";
        select.name = type;
        select.id = type;
        
        for(let i = 0; i < options.length; i++){

            const {name, value} = options[i];

            const option = document.createElement("option");
            option.append(document.createTextNode(name));
            if(value == selected) option.selected = true;
            option.value = value;
            select.append(option);
        }

        row.append(select);

        select.addEventListener("change", (e) =>{
            this.selectedId = e.target.value;
            this.changeURL();
        });

        this.wrapper.append(row);
    }


    changeURL(){

        window.location.href = `?mode=${this.mode}&id=${this.selectedId}&tf=${this.selectedTimeRange}&pp=${this.selectedPerPage}&p=1`

    }

    createForm(){

        const nameOptions = [];
        
        for(const [id, name] of Object.entries(this.names)){
            nameOptions.push({name, "value": id});
        }

        nameOptions.sort((a, b) =>{
            a = a.name.toLowerCase();
            b = b.name.toLowerCase();
            if(a < b) return -1;
            if(a > b) return 1;
            return 0;
        });


        this.createDropDownRow("id", "Name", nameOptions, this.selectedId);

        const row = UIDiv("form-row");
        row.id = "last-active-row";
        row.append(UILabel("Active In Previous", "tf"));
        const la = new UILastActiveSelect(row, this.selectedTimeRange, "tf");
        row.append(la.elem.select);

        la.elem.select.addEventListener("change", (e) =>{
            this.selectedTimeRange = e.target.value;
            this.changeURL();
        });

        this.wrapper.append(row);

        const perPageRow = UIDiv("form-row");
        perPageRow.append(UILabel("Results Per Page", "pp"));

        const pp = new UIPerPageSelect(perPageRow, this.selectedPerPage, "pp");

        pp.elem.select.addEventListener("change", (e) =>{
            this.selectedPerPage = e.target.value;
            this.changeURL();
        });

        perPageRow.append(pp.elem.select);

        this.wrapper.append(perPageRow);

        const info = UIDiv("info-basic");
        info.append(`A player needs to play a minimum of ${this.minMatchesSetting} ${plural(this.minMatchesSetting, "match")} to be eligible for a ranking score.`);

        this.wrapper.append(info);
    }

    render(){

        if(this.data.length === 0){

            const noData = UIDiv("info");
            noData.append(`There has not been enough matches played yet for there to be any rankings.`);
            this.table.className = "hidden";
            this.parent.append(noData);
            return;
        }

        const headers = ["Place", "Player", "Last Active", "Playtime", "Matches", "Score"];

        const headerRow = document.createElement("tr");

        for(let i = 0; i < headers.length; i++){
            headerRow.append(UITableHeaderColumn({"content": headers[i]}));
        }

        this.table.append(headerRow);

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            const row = document.createElement("tr");

            row.append(UITableColumn({
                "content": (this.selectedPerPage * (this.currentPage - 1)) + i + 1,
                "parse": ["ordinal"], 
                "className": "ordinal"
            }));

            row.append(UIPlayerLink({"playerId": d.player_id, "country": d.country, "name": d.name, "bTableElem": true}));
            row.append(UITableColumn({"content": d.last_active, "parse": ["date"], "className": "date"}));
            row.append(UITableColumn({"content": d.playtime, "parse": ["playtime"], "className": "playtime"}));
            row.append(UITableColumn({"content": d.matches}));
            row.append(UITableColumn({"content": d.score.toFixed(2)}));

            this.table.append(row);
        }

        new UIPagination(
            this.parent, 
            `?mode=${this.mode}&id=${this.selectedId}&tf=${this.selectedTimeRange}&pp=${this.selectedPerPage}&p=`, 
            this.totalResults, 
            this.selectedPerPage, 
            this.currentPage
        );
    }
}