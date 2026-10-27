
function renderServerList(parent, servers){

    if(servers.length === 0) return;
    UIHeader(parent, "Our Servers");


    const rows = [];

    for(let i = 0; i < servers.length; i++){

        const s = servers[i];

        const tableRow = document.createElement("tr");

        const url = `/matches/?s=${s.id}`;

        rows.push([
            {"display": `${s.name}`, "value": s.name.toLowerCase(), "className": "text-left", url},
            {"display": toDateString(s.first_match, TIME_ZONE, true), "value": s.first_match, "className": "date", url},
            {"display": toDateString(s.last_match, TIME_ZONE, true), "value": s.last_match,"className": "date", url},
            {"display": toPlaytime(s.playtime), "value": s.playtime,"className": "date", url},
            {"value": s.matches, url}
        ]);
    }

    new TESTUITable(parent, {
        "headers": [
            {"display": "Name"},
            {"display": "First Match"},
            {"display": "Last Match"},
            {"display": "Playtime"},
            {"display": "Matches"},
        ],
        "className": "t-width-1",
    }, rows);
}


function homeRenderMostPlayedGametypes(parent, data){

    if(data.length === 0) return;
    parent = document.querySelector(parent);
    UIHeader(parent, "Most Played Gametypes");

    const tableOptions = {
        "width": 1,
        "headers": [
            {"display":"Name"}, 
            {"display": "First"}, 
            {"display": "Last"}, 
            {"display": "Matches"}, 
            {"display": "Playtime"}
        ],
        "className": "t-width-1"
    };

    const rows = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        const url = `/matches/?g=${d.id}`;

        rows.push([
            {"display": d.name, "value": d.name.toLowerCase(), "className": "text-left", url},
            {"display": toDateString(d.first_match, TIME_ZONE), "value": d.first_match, "className": "date", url},
            {"display": toDateString(d.last_match, TIME_ZONE), "value": d.last_match, "className": "date", url},
            {"value": d.matches, url},
            {"value": d.playtime, "display": toPlaytime(d.playtime), "className": "playtime", url}
        ]);

    }

    const table = new TESTUITable(parent, tableOptions, rows);
}

function homeRenderMostPlayedMaps(parent, data, displayMode){

    if(data.length === 0) return;
    parent = document.querySelector(parent);

    UIHeader(parent, "Most Played Maps");

    let wrapper = null;
    
    if(displayMode === "default"){
        wrapper = UIDiv("new-rich-wrapper");
    }
    


    for(let i = 0; i < data.length; i++){

        const d = data[i];

        if(displayMode === "default"){
            
            const img = getMapThumbOrFullSize(d);
            
            const url = `/map/${d.id}`;
     
            wrapper.append(UIRichMapBox(d, url));

        }else{

            const url = `/map/${d.id}`;

            rows.push([
                {"display": d.name, "value": d.name.toLowerCase(), "className": "text-left", url},
                {"display": toDateString(d.first_match, TIME_ZONE), "value": d.first_match,  "className": "date", url},
                {"display": toDateString(d.last_match, TIME_ZONE), "value": d.last_match,  "className": "date", url},
                {"value": d.matches, url},
                {"display": toPlaytime(d.playtime), "value": d.playtime, "className": "playtime", url},
            ]);

        }
    }

    if(displayMode === "table"){
        const tableOptions = {
            "width": 1, 
            "headers": [
                {"display": "Name"}, 
                {"display": "First"}, 
                {"display": "Last"}, 
                {"display": "Matches"}, 
                {"display": "Playtime"}
            ],
            "className": "t-width-1"
        };
        new TESTUITable(parent, tableOptions, rows);
        return;
    }

    parent.append(wrapper);  
}

function homeRenderMostActivePlayers(parent, data){

    if(data.length === 0) return;

    parent = document.querySelector(parent);

    const wrapper = UIDiv();

    UIHeader(wrapper, "Most Active Players");

    const rows = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        const row = document.createElement("tr");

        const playerLink = UIPlayerLink({
            "playerId": d.id,
            "name": d.name,
            "country": d.country,
            "bTableElem": true
        });

        rows.push([
            {"value": d.name.toLowerCase(), "display": playerLink, "bSkipTD": true},
            {"display": toDateString(d.last_active, TIME_ZONE), "value": d.last_active, "className": "date"},
            {"value": d.total_matches},
            {"value": ignore0(d.wins)},
            {"value": d.playtime, "display": toPlaytime(d.playtime), "className": "playtime"},
        ]);

    }


    const table = new TESTUITable(wrapper, {
        "headers": [
            {"display": "Name"}, 
            {"display": "Last Active"}, 
            {"display": "Matches Played"}, 
            {"display": "Wins"}, 
            {"display": "Total Playtime"}
        ],
        "className": "t-width-1"
    }, rows);


    parent.append(wrapper);
}


class homeRenderRecentActivity{
    
    constructor(parent, data){

        this.parent = document.querySelector(parent, data);
        this.data = data;



        const gData = {"title": "Test Graph", "data": [
            {
                "name": "Total Matches", 
                "fillStyle": "red", 
                "data": []
            },
            {
                "name": "Total Playtime", 
                "fillStyle": "blue",
                 "data": []
            },
            {
                "name": "Unique Maps", 
                "fillStyle": "green",
                 "data": []
            },
             {
                "name": "Unique Servers", 
                "fillStyle": "grey",
                 "data": []
            },
            {
                "name": "Unique Gametypes", 
                "fillStyle": "yellow",
                 "data": []
            }
        ], "yAxisLabel": "test label"};

        

        const testTitles = [];

        for(let i = 0; i < this.data.length; i++){

            const dataSet = this.data[i];
            testTitles.push(dataSet.date);

            let totalPlaytime = 0;
            let totalPlayers = 0;

            const uniqueMaps = new Set();
            const uniqueServers = new Set();
            const uniqueGametypes = new Set();

            for(let x = 0; x < dataSet.entries.length; x++){

                const e = dataSet.entries[x];

                totalPlaytime += e.playtime;
                totalPlayers += e.players;
                uniqueMaps.add(e.map_name);
                uniqueServers.add(e.server_name);
                uniqueGametypes.add(e.gametype_name);
            }

            gData.data[0].data.push(dataSet.entries.length);
            gData.data[1].data.push((totalPlaytime > 0) ? totalPlaytime / 60 / 60 : 0);
            gData.data[2].data.push(uniqueMaps.size);
            gData.data[3].data.push(uniqueServers.size);
            gData.data[4].data.push(uniqueGametypes.size);
        }


        gData.dataTitles = testTitles;

        const testOptions = {"className": "new-canvas", "bNoXAxisLabels": true, "bNoMainTitle": true, "dataPointsPerPage": 20}

        new BarChartGraph(this.parent, "test-1", 690, 360, gData, testOptions);
        //new LineGraph(this.parent, "test-2", 690, 360, gData, testOptions);
    }
}