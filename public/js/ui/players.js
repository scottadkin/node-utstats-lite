
class PlayersSearchList{

    constructor(parent, players, name, sortBy, order, perPage, page){

        this.parent = parent;
        this.players = players.players;
        this.totalPlayers = players.totalPlayers;

        //if(this.totalPlayers === 0) return;

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


        if(this.totalPlayers === 0){

            const row = document.createElement("tr");
            const col = UITableColumn({"content": "No players matching your search terms"});
            col.colSpan = 10;
            row.append(col);
            this.table.append(row);
            return;
        }

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];
            this.table.append(this.createPlayerRow(p));
        }
    }
}

class PlayersSearchForm{

    constructor(parent, searchName, sortBy, order, perPage, page){

        this.parent = document.querySelector(parent);

        this.searchName = searchName;
        this.sortBy = sortBy;
        this.order = order;
        this.perPage = perPage;
        this.page = page;

        this.data = {"players": [], "totalPlayers": 0};

        UIHeader(this.parent, "Player Search");
        this.wrapper = UIDiv("form");


        this.content = UIDiv();

        this.createFormElems();

        this.loadData();

        this.parent.append(this.wrapper);
        this.parent.append(this.content);

    }

    async loadData(){

        try{

            let slug = `?name=${this.searchName}&sortBy=${this.sortBy}`;
            slug += `&order=${this.order}&perPage=${this.perPage}&page=${this.page}`;
            const req = await fetch(`/json/player-search/${slug}`);

            const res = await req.json();
         
            if(res.error !== undefined) throw new Error(res.error);

            this.data = res;
       
            this.render();

        }catch(err){
            console.trace(err);
            new UINotification(this.parent, "error", "Failed To Load Players", err.toString());
        }
    }

    changeSelected(){

        const url = `/players/?name=${this.searchName}&sortBy=${this.sortBy}&order=${this.order}&perPage=${this.perPage}`;

        history.pushState(null, "", url);

        this.loadData();
        
    }

    createFormElems(){

        const searchRow = UIDiv("form-row");
        

        const nameElem = UIInput("text", "name", this.searchName, "Player Name...", (newValue) =>{
            this.searchName = newValue;
            this.page = 1;
            this.changeSelected();
        });

        nameElem.focus();

        searchRow.append(UILabel("Name"), nameElem);

        const sortRow = UIDiv("form-row");

        const sortByElem = new UIPlayerSortBySelect(sortRow, this.sortBy, (newValue) =>{
            this.sortBy = newValue;
            this.page = 1;
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

    render(){

        this.content.innerHTML = ``;

        this.list = new PlayersSearchList(
            this.content, this.data, 
            this.searchName, this.sortBy, 
            this.order, this.perPage, this.page
        );

        this.pagination = new UIPagination(this.content, (newPage) =>{
            this.page = newPage;
            this.changeSelected();
        }, this.data.totalPlayers, this.perPage, this.page);
    }
}