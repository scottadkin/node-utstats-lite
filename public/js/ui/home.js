function renderWelcomeMessage(parent, title, message){

    if(title === "" && message === "&#34;&#34;") return;

    const wrapper = document.createElement("div");

    UIHeader(parent, title);
    parent = document.querySelector(parent);


    const messageElem = document.createElement("div");
    messageElem.className = "welcome-message";

    if(message.length > 0){
        messageElem.innerHTML = decodeHTML(message);
        messageElem.innerHTML = messageElem.innerHTML.slice(1, -1);
    }else{
        messageElem.innerHTML = "";
    }
    



    wrapper.append(messageElem);
    parent.appendChild(wrapper);
}


function UISocial(parent, url, icon){

    const elem = document.createElement("a");
    elem.href = url;
    elem.target = "_blank";
    
    
    const img = document.createElement("img");
    img.src = `./images/${icon}`;
    img.className = "social-media-icon";
    img.alt = "social-icon";

    elem.appendChild(img);

    parent.appendChild(elem);
 
}

function renderSocials(parent, settings){

    const keys = [
        "Discord Link",
        "Twitch Link",
        "Youtube Link",
    ];

    let bFoundLink = "";

    for(let i = 0; i < keys.length; i++){

        if(settings[keys[i]] !== ""){
            bFoundLink = true;
            break;
        }
    }

    if(!bFoundLink) return;

    const wrapper = document.createElement("div");
    wrapper.className = "text-center";
    UIHeader(parent, "Find Us On Social Media");

    parent = document.querySelector(parent);

    if(settings["Discord Link"] !== ""){
        UISocial(wrapper, settings["Discord Link"], "discordicon.svg");
    }


    if(settings["Twitch Link"] !== ""){
        UISocial(wrapper, settings["Twitch Link"], "twitchicon.svg");
    }

    if(settings["Youtube Link"] !== ""){
        UISocial(wrapper, settings["Youtube Link"], "youtubeicon.svg");
    }

    if(settings["External Site"] !== ""){

        UIHeader(wrapper, "Find Us On Our Website");

        const link = document.createElement("a");
        link.href = settings["External Site"];
        link.className = "bold"
        link.append(settings["External Site"]);

        new UIInfo(wrapper, [`We also have another website you may like to visit `, link]);
       // UISocial(wrapper, settings["External Site"], "red.png");
    }

    parent.appendChild(wrapper);
}

function renderServerList(parent, servers){

    if(servers.length === 0) return;
    UIHeader(parent, "Our Servers");


    const rows = [];

    for(let i = 0; i < servers.length; i++){

        const s = servers[i];

        const tableRow = document.createElement("tr");

        const url = `/matches/?s=${s.id}`;

        rows.push([
            {"display": s.name, "value": s.name.toLowerCase(), "className": "text-left", url},
            {"display": toDateString(s.first_match, true), "value": s.first_match, "className": "date", url},
            {"display": toDateString(s.last_match, true), "value": s.last_match,"className": "date", url},
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


function homeRenderRecentMatches(parent, data, displayMode){

    parent = document.querySelector(parent);

    if(data.total === 0) return;

    const wrapper = UIDiv();
    wrapper.id = "home-recent-matches";
    wrapper.className = "text-center";
    UIHeader(wrapper, "Recent Matches");

    parent.append(wrapper);

    if(displayMode === "default"){

        new MatchesRichView("#home-recent-matches", data);
    }else{

        const tableOptions = {
            "headers": [
                {"display": "Map"},
                {"display": "Gametype"},
                {"display": "Server"},
                {"display": "Date"},
                {"display": "Players"},
                {"display": "Playtime"},
                {"display": "Result"},
            ]
        };


        renderMatchesTable(parent, data, false, false);
    }
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
            {"display": toDateString(d.first_match), "value": d.first_match, "className": "date", url},
            {"display": toDateString(d.last_match), "value": d.last_match, "className": "date", url},
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
        wrapper = UIDiv("rich-outter");
    }
    const rows = [];

    for(let i = 0; i < data.length; i++){

        const d = data[i];

        if(displayMode === "default"){
            wrapper.append(UIMapRichBox(d));

        }else{

            const url = `/map/${d.id}`;

            rows.push([
                {"display": d.name, "value": d.name.toLowerCase(), "className": "text-left", url},
                {"display": toDateString(d.first_match), "value": d.first_match,  "className": "date", url},
                {"display": toDateString(d.last_match), "value": d.last_match,  "className": "date", url},
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
            {"display": toDateString(d.last_active), "value": d.last_active, "className": "date"},
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