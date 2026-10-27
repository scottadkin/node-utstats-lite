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