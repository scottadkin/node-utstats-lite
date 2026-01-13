class UIWatchlistMatches{

    constructor(parent){

        this.parent = document.querySelector(parent);

        this.wrapper = UIDiv();

        this.savedMatches = getWatchlist("matches");

        this.matches = [];
        this.missingMatches = [];

        UIHeader(this.wrapper, `Saved Matches`);

        this.table = document.createElement("table");
        this.table.className = `hidden`;
        this.wrapper.appendChild(this.table);
        this.parent.appendChild(this.wrapper);

        this.loadMatches();
    }

    async loadMatches(){

        try{

            const req = await fetch("/json/get-matches-by-hashes/", {
                "headers": {"Content-type": "application/json"},
                "method": "POST",
                "body": JSON.stringify({"hashes": this.savedMatches})
            });
            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            this.matches = res.matches;
            this.missingMatches = res.missing;

            this.render();

        }catch(err){
            console.trace(err);
            new UINotification(this.parent, "error", `Failed To Loaded Saved Matches`, err.toString());
        }
    }


    removeMatch(hash){

        const matches = [];

        for(let i = 0; i < this.matches.length; i++){

            const m = this.matches[i];

            if(m.hash !== hash) matches.push(m);
        }

        this.matches = matches;
    }

    render(){

        if(this.matches.length === 0){

            const none = UIDiv("info");
            none.innerHTML = `No Matches Found`;
            this.wrapper.append(none);
            return;
        }

        this.table.className = "t-width-1";

        const headers = [
            "Date", "Gametype", "Map", "Players",
            "Playtime", "Result", "Remove"
        ];

        const headerRow = document.createElement("tr");

        for(let i = 0; i < headers.length; i++){

            headerRow.append(UITableHeaderColumn({"content": headers[i]}));
        }

        this.table.append(headerRow);

        for(let i = 0; i < this.matches.length; i++){

            const m = this.matches[i];
            const row = document.createElement("tr");

            const url = `/match/${m.hash}`;

            row.append(UITableColumn({
                "content": m.date, 
                "parse": ["date"], 
                "className": "date",
                url
            }));

            row.append(UITableColumn({"content": m.gametype_name, url}));
            row.append(UITableColumn({"content": m.map_name, url}));
            row.append(UITableColumn({"content": m.players, "parse": ["ignore0"], url}));
            row.append(UITableColumn({
                "content": m.playtime, 
                "parse": ["playtime"], 
                "className": 
                "playtime", url
            }));
            UIMatchScoreBox(row, m, true, true);

            const deleteElem = document.createElement("td");
            deleteElem.className = "team-red hover no-user-select";
            deleteElem.innerHTML = `Remove From Watchlist`;
            
            deleteElem.addEventListener("click", () =>{
                removeFromWatchlist("matches", m.hash);
                this.removeMatch(m.hash);
                this.table.innerHTML = ``;
                this.table.className = `hidden`;
                this.render();
            });

            row.append(deleteElem);

            this.table.append(row);
        }
    }
}


class UIWatchlistPlayers{

    constructor(parent){

        this.parent = document.querySelector(parent);
        this.wrapper = UIDiv();
        UIHeader(this.wrapper, "Saved Players");
        this.parent.append(this.wrapper);

        this.data = getWatchlist("players");

        this.players = [];
        this.missing = [];
        this.loadData();
    }


    removeHash(target){


        const players = [];

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.hash !== target) players.push(p);
        }

        this.players = players;

    }

    async loadData(){

        try{

            if(this.data.length === 0) return this.render();

            const req = await fetch("/json/get-players-by-hashes/", {
                "headers": {"Content-type": "application/json"},
                "method": "POST",
                "body": JSON.stringify({"hashes": this.data})
            });

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            this.players = res.players;
            this.missing = res.missing;

            this.render();

        }catch(err){
            console.trace(err);
            new UINotification(this.parent, "error", "Failed To Load Saved Players", err.toString());
        }
    }

    render(){

        if(this.players.length === 0){

            if(this.table !== undefined){
                this.table.className = "hidden";
                this.table.innerHTML = "";
            }
            
            const info = UIDiv("info");
            info.append(`No Players Found`);
            this.wrapper.append(info);

            return;
        }

        if(this.table === undefined){

            this.table = document.createElement("table");
            this.table.className = "t-width-1";

        }

        this.table.innerHTML = "";


        

        const headers = [
            "Name", "Last Active", "Matches Played", 
            "Playtime", "Remove"
        ];

        const headerRow = document.createElement("tr");

        for(let i = 0; i < headers.length; i++){

            headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
        }

        this.table.append(headerRow);

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            const row = document.createElement("tr");

            row.append(UIPlayerLink({"playerId": p.hash, "name": p.name, "country": p.country, "bTableElem": true}));
            row.append(UITableColumn({"content": p.last_active, "parse": ["date"], "className": "date"}));
            row.append(UITableColumn({"content": p.total_matches, "parse": ["ignore0"]}));
            row.append(UITableColumn({"content": p.playtime, "parse": ["playtime"], "className":"playtime"}));

            const remove = document.createElement("td");
            remove.className = "team-red hover no-user-select";
            remove.append("Remove From Watchlist");

            remove.addEventListener("click", () =>{
                removeFromWatchlist("players", p.hash);
                this.removeHash(p.hash);
                this.render();
            });

            row.append(remove);

            this.table.append(row);
        }

        this.wrapper.append(this.table);
    }
}