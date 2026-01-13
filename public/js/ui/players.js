
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

        this.parent.appendChild(this.table);

        this.headers = ["Name", "Last Active", "Score", "Frags", 
            "Kills", "Deaths", "Suicides", "Eff", "Matches", "Playtime"
        ];

        this.render();
    }


    createPlayerRow(player){

        const row = document.createElement("tr");

        row.appendChild(UIPlayerLink({
            "playerId": player.id,
            "name": player.name, 
            "country": player.country, 
            "bTableElem": true, 
            "className": "text-left"
        }));

        row.appendChild(UITableColumn({"content": toDateString(player.last_active, true), "className": "date"}));
        row.appendChild(UITableColumn({"content": player.score, "parse": ["ignore0"]}));
        row.appendChild(UITableColumn({"content": player.frags, "parse": ["ignore0"]}));
        row.appendChild(UITableColumn({"content": player.kills, "parse": ["ignore0"]}));
        row.appendChild(UITableColumn({"content": player.deaths, "parse": ["ignore0"]}));
        row.appendChild(UITableColumn({"content": player.suicides, "parse": ["ignore0"]}));
        row.appendChild(UITableColumn({"content": `${player.efficiency.toFixed(2)}%` }));
        row.appendChild(UITableColumn({"content": player.total_matches, "parse": ["ignore0"]}));
        row.appendChild(UITableColumn({"content": player.playtime, "parse": ["playtime"], "className": "playtime"}));

        return row;
    }

    render(){

        this.table.innerHTML = "";

        const headerRow = document.createElement("tr");

        for(let i = 0; i < this.headers.length; i++){
            headerRow.appendChild(UITableHeaderColumn({"content": this.headers[i]}));
        }

        this.table.appendChild(headerRow);

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];
            this.table.appendChild(this.createPlayerRow(p));
        }

        const url = `/players/?name=${this.name}&sortBy=${this.sortBy}&order=${this.order}&perPage=${this.perPage}&page=`;

        this.pagination = new UIPagination(this.parent, url, this.totalPlayers, this.perPage, this.page);
    }

    
}
