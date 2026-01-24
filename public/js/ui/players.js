
class PlayersSearchList{

    constructor(parent, players, name, sortBy, order, perPage, page){

        this.parent = document.querySelector(parent);
        this.players = players.players;
        this.totalPlayers = players.totalPlayers;

        if(this.totalPlayers === 0) return;

        this.name = name;
        this.sortBy = sortBy;
        this.order = order;
        this.perPage = perPage;
        this.page = page;


        this.table = document.createElement("table");
        this.table.className = "t-width-1";

        this.parent.append(this.table);

        this.headers = ["Name", "Last Active", "Score", "Frags", 
            "Kills", "Deaths", "Suicides", "Eff", "Matches", "Playtime"
        ];

        this.render();
    }


    createPlayerRow(player){

        const row = document.createElement("tr");

        row.append(UIPlayerLink({
            "playerId": player.id,
            "name": player.name, 
            "country": player.country, 
            "bTableElem": true, 
            "className": "text-left"
        }));

        row.append(UITableColumn({"content": toDateString(player.last_active, true), "className": "date"}));
        row.append(UITableColumn({"content": player.score, "parse": ["ignore0"]}));
        row.append(UITableColumn({"content": player.frags, "parse": ["ignore0"]}));
        row.append(UITableColumn({"content": player.kills, "parse": ["ignore0"]}));
        row.append(UITableColumn({"content": player.deaths, "parse": ["ignore0"]}));
        row.append(UITableColumn({"content": player.suicides, "parse": ["ignore0"]}));
        row.append(UITableColumn({"content": `${player.efficiency.toFixed(2)}%` }));
        row.append(UITableColumn({"content": player.total_matches, "parse": ["ignore0"]}));
        row.append(UITableColumn({"content": player.playtime, "parse": ["playtime"], "className": "playtime"}));

        return row;
    }

    render(){

        this.table.innerHTML = "";

        const headerRow = document.createElement("tr");

        for(let i = 0; i < this.headers.length; i++){
            headerRow.append(UITableHeaderColumn({"content": this.headers[i]}));
        }

        this.table.append(headerRow);

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];
            this.table.append(this.createPlayerRow(p));
        }

        const url = `/players/?name=${this.name}&sortBy=${this.sortBy}&order=${this.order}&perPage=${this.perPage}&page=`;

        this.pagination = new UIPagination(this.parent, url, this.totalPlayers, this.perPage, this.page);
    }
}

class PlayersSearchForm{

    constructor(parent, searchName, sortBy, order, perPage){

        this.parent = document.querySelector(parent);

        this.searchName = searchName;
        this.sortBy = sortBy;
        this.order = order;
        this.perPage = perPage;

        UIHeader(this.parent, "Player Search");
        this.wrapper = UIDiv("form");

        this.createFormElems();

        this.parent.append(this.wrapper);
    }

    changeSelected(){

        const url = `/players/?name=${this.searchName}&sortBy=${this.sortBy}&order=${this.order}&perPage=${this.perPage}`;

        window.location.href = url;
    }

    createFormElems(){

        const searchRow = UIDiv("form-row");
        

        const nameElem = UIInput("text", "name", this.searchName, "Player Name...", (newValue) =>{
            this.searchName = newValue;
            this.changeSelected();
        });

        nameElem.focus();

        searchRow.append(UILabel("Name"), nameElem);

        const sortRow = UIDiv("form-row");

        const sortByElem = new UIPlayerSortBySelect(sortRow, this.sortBy, (newValue) =>{
            this.sortBy = newValue;
            this.changeSelected();
        });

        sortRow.append(UILabel("Sort By"), sortByElem.elem.select);

        const orderRow = UIDiv("form-row");
        orderRow.append(UILabel("Order"));

        new UIOrderSelect(orderRow, this.order, (newValue) =>{
            this.order = newValue;
            this.changeSelected();
        })

        const perPageRow = UIDiv("form-row");
        perPageRow.append(UILabel("Per Page"));

        new UIPerPageSelect(perPageRow, this.perPage, "per-page", (newValue) =>{
            this.perPage = newValue;
            this.changeSelected();
        });

        this.wrapper.append(searchRow, sortRow, orderRow, perPageRow);
    }
}