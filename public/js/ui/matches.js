
function renderMatchesPagination(parent, server, gametype, map, totalMatches, perPage, currentPage, displayMode){

    new UIPagination(parent, `/matches/?s=${server}&g=${gametype}&m=${map}&display=${displayMode}&page=`, totalMatches, perPage, currentPage);
}

function renderMatchesTable(parent, data, bMapsPage){

    parent = document.querySelector(parent);

    const matches = data.data;

    if(matches.length === 0) return;

    if(bMapsPage === undefined) bMapsPage = false;

    const wrapper = document.createElement("div");
    wrapper.className = "center text-center";

    const table = document.createElement("table");
    table.className = "t-width-1";

    const headers = [
        "Gametype", "Server", "Date", "Players", "Playtime", "Result"
    ];

    if(!bMapsPage) headers.unshift("Map");

    const headerRow = document.createElement("tr");

    for(let i = 0; i < headers.length; i++){

        headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
    }

    table.appendChild(headerRow);


    for(let i = 0; i < matches.length; i++){

        const m = matches[i];
        
        const row = document.createElement("tr");

        const url = `/match/${m.id}`;

        if(!bMapsPage){
            row.appendChild(UITableColumn({"content": m.map_name, "className": "text-left", url}));
        }
        row.appendChild(UITableColumn({"content": m.gametype_name, "className": "font-small", url}));
        row.appendChild(UITableColumn({"content": m.server_name, "className": "font-small", url}));
        row.appendChild(UITableColumn({"content": m.date, "parse": ["date"], "className": "playtime", url}));
        row.appendChild(UITableColumn({"content": m.players, "parse": ["ignore0"], url}));
        row.appendChild(UITableColumn({"content": m.playtime, "parse": ["playtime"], "className": "playtime", url}));

        const a = document.createElement("td");
        UIMatchScoreBox(a, m, true, false);
        row.appendChild(a);
        table.appendChild(row);
    }


    wrapper.appendChild(table);


    parent.appendChild(wrapper); 
}

class MatchRichViewBox{

    constructor(parent, data){

        this.parent = parent;
        this.data = data;

        this.wrapper = document.createElement("a");
        this.wrapper.href = `/match/${data.id}`;
        this.wrapper.className = "rich-wrapper";
        this.parent.appendChild(this.wrapper);

        this.createElems()
        
    }

    createInfoElems(){

        const d = this.data;

        const info = document.createElement("div");
        info.className = "rich-info";

        const gametype = document.createElement("div");
        gametype.className = "white";

        gametype.appendChild(document.createTextNode(d.gametype_name));
        info.appendChild(gametype);

        info.appendChild(document.createTextNode(toDateString(d.date, true)));

        const players = document.createElement("div");
        players.className = "white";
        players.innerHTML = `${d.players} Player${(d.players === 1) ? "" : "s"}`;
        info.appendChild(players);

        info.appendChild(document.createTextNode(toPlaytime(d.playtime)));

        this.wrapper.appendChild(info);
    }

    createElems(){

        const title = document.createElement("div");
        title.className = "rich-title";
        title.appendChild(document.createTextNode(this.data.map_name));
        this.wrapper.appendChild(title);

        const image = document.createElement("img");
        image.className = "rich-image";
        image.alt = "map-sshot";
        image.src = `/images/maps/${this.data.map_image}`;

        this.wrapper.appendChild(image);
        this.createInfoElems();
        UIMatchScoreBox(this.wrapper, this.data, false, false);
    }
}

class MatchesRichView{

    constructor(parent, matches){

        this.parent = document.querySelector(parent);
        this.matches = matches;

        this.wrapper = document.createElement("div");
        this.wrapper.className = "rich-outter t-width-1";

        this.parent.appendChild(this.wrapper);


        this.createElems();

    }


    createElems(){

        this.elems = [];

        for(let i = 0; i < this.matches.data.length; i++){

            const d = this.matches.data[i];

            this.elems.push(new MatchRichViewBox(this.wrapper, d));
        }
    }
}