
function UIMBInfo(name, value){

    const wrapper = UIDiv("mb-info");

    const nElem = UIDiv();
    const vElem = UIDiv();
    nElem.append(name);
    vElem.append(value);

    wrapper.append(nElem, vElem);

    return wrapper;

}

function renderBasicInfo(parent, data, players){

    parent = document.querySelector(parent);

    const wrapper = UIDiv("match-basic-info-wrapper center");

    UIHeader(parent, `${data.gametype_name} on ${data.map_name}`);

    if(data.solo_winner !== 0){

        const p = getPlayer(players, data.solo_winner);
        data.solo_winner_name = p.name;
    
    }
 
    UIMatchScoreBox(wrapper, data, false, false, players);

    const infoElems = UIDiv("match-basic-info-wrapper-info");

    infoElems.append(
        UIMBInfo("Date", toDateString(data.date, TIME_ZONE, false, false)),
        UIMBInfo("Match Length", toPlaytime(data.playtime)),
        UIMBInfo("Players", data.players)
    );

    if(data.target_score !== 0){
        infoElems.append(UIMBInfo("Target Score", data.target_score));
    }

    if(data.time_limit !== 0){
        infoElems.append(UIMBInfo("Time Limit", data.time_limit));
    }


    infoElems.append(
        UIMBInfo("Gamespeed", `${data.gamespeed_real}%`),
        UIMBInfo("Tournament Mode", `${(data.tournament_mode === 1) ? "True" : "False"}`),
        UIMBInfo("Server",  data.server_name),
        UIMBInfo("Mutators", data.mutators)
    );

    wrapper.append(infoElems);

    const pLinks = UIDiv("perma-links");

    new UIWatchlistButton(pLinks, "matches", data.hash);

    new UICopyURLToClipboard(pLinks, "Copy Match Perma Link To Clipboard", `/match/${data.hash}`);
    wrapper.append(pLinks);
    parent.append(wrapper);

}


function createAverageCompareTD(averageValue, value, bForceDecPlaces){


    averageValue = parseFloat(averageValue);
    value = parseFloat(value);

    const icon = UIAveragesCompareIcon(averageValue, value);

    if(averageValue < value){
        icon.title = `Above player's average of ${averageValue.toFixed(2)}`;
    }else if(averageValue > value){

        icon.title = `Below player's average of ${averageValue.toFixed(2)}`;
    }else{
        icon.title = "Matches player's average";
    }


    if(bForceDecPlaces) value = value.toFixed(2);
    

    const elem = document.createElement("td");

    elem.append(value, icon);
    return elem;
}

class MatchFragsSummary{

    constructor(parent, totalTeams, playerData, playerAverages){

        this.parent = document.querySelector(parent);
        this.totalTeams = totalTeams;
        this.playerData = playerData
        this.playerAverages = playerAverages;

        this.wrapper = UIDiv();
        UIHeader(this.wrapper, "Frags Summary");
        

        this.tables = [];
        this.parent.append(this.wrapper);

        this.createTabs();

        this.content = UIDiv();
        this.wrapper.append(this.content);

        this.render();
    }

    createTabs(){

        this.mode = "normal";

        const options = [
            {"display": "Final Score", "value": "normal"},
            {"display": "Events Per Minute", "value": "epm"},
        ];


        this.tabs = new UITabs(this.wrapper, options, this.mode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{

            this.mode = e.detail.newTab;
            console.log(this.mode);
            this.render();
        });
    }

    getAverages(playerId){


        return this.playerAverages?.[playerId] ?? null;

    }

    renderNormalTables(){

        const tables = [];
        const totals = [];

        if(this.totalTeams < 2) this.totalTeams = 1;

        for(let i = 0; i < this.totalTeams; i++){

            totals[i] = {
                "time_on_server": 0,
                "score": 0,
                "frags": 0,
                "kills": 0,
                "deaths": 0,
                "net": 0,
                "suicides": 0,
                "team_kills": 0,
                "headshots": 0,
                "efficiency": 0,
                "ttl": 0,
                "totalTTL": 0,
                "players": 0
            };

            tables.push([]);
        }


        for(let i = 0; i < this.playerData.length; i++){

            const p = this.playerData[i];

            if(p.spectator) continue;
            if(this.totalTeams >= 2 && p.team === 255) continue;

            const avg = this.getAverages(p.player_id);

            const row = this.createFragTableRow(p, false, avg);

            let team = (this.totalTeams < 2) ? 0 : p.team;

            totals[team].kills += p.kills;
            totals[team].deaths += p.deaths;
            totals[team].suicides += p.suicides;
            totals[team].team_kills += p.team_kills;
            totals[team].players++;
            totals[team].totalTTL += p.ttl;

            if(totals[team].players > 0 && totals[team].totalTTL > 0){
                totals[team].ttl = totals[team].totalTTL / totals[team].players;
            }

            if(totals[team].kills > 0){

                if(totals[team].deaths === 0){
                    totals[team].efficiency = 100;
                }else{

                    const events = totals[team].kills + totals[team].deaths + totals[team].suicides + totals[team].team_kills;

                    totals[team].efficiency = (totals[team].kills / (events)) * 100;
                }
            }else{
                totals[team].efficiency = 0;
            }

            if(this.totalTeams >= 2 && team !== 255){
                tables[team].push(row);
            }else if(this.totalTeams < 2){
                tables[0].push(row);
            }
        }

        for(let i = 0; i < tables.length; i++){

            const tableOptions = {
                "className": "t-width-1", 
                "sortBy": 2,
                "bAscOrder": false,
                "headers": [
                    {"display": "Player"},
                    {"display": "Playtime"},
                    {"display": "Score"},
                    {"display": "Frags"},
                    {"display": "Kills"},
                    {"display": "Deaths"},
                    {"display": "Net"},
                    {"display": "Suicides"},
                    {"display": "Team Kills"},
                    {"display": "Headshots"},
                    {"display": "Efficiency"},
                    {"display": "TTL"}
                ],
                "footer": [
                    {"display": "Total|Max|Avg"},
                    {"display": "SUM", "dataType": "FLOAT", "callback": (v) =>{ return MMSS(v)}},
                    {"display": "SUM", "dataType": "INT", "callback": (v) => ignore0(v)},
                    {"display": "SUM", "dataType": "INT", "callback": (v) => ignore0(v)},
                    {"display": "SUM", "dataType": "INT", "callback": (v) => ignore0(v)},
                    {"display": "SUM", "dataType": "INT",  "callback": (v) => ignore0(v)},
                    {"display": "SUM", "dataType": "INT", "callback": (v) => { return (v > 0) ?  `+${v}`: v}},
                    {"display": "SUM", "dataType": "INT", "callback": (v) => ignore0(v)},
                    {"display": "SUM", "dataType": "INT", "callback": (v) => ignore0(v)},
                    {"display": "SUM", "dataType": "INT", "callback": (v) => ignore0(v)},
                    {"display": `${totals[i].efficiency.toFixed(2)}%`},
                    {"display": totals[i].ttl, "callback": (v) =>{ return MMSS(v)}},
                ]
            };

            new TESTUITable(this.content, tableOptions, tables[i])
         
        }
    }


    createFragTableRow(p, bTotals, averages){


        let net = p.kills - p.deaths;
        if(net > 0) net = `+${net}`;

        let teamColorClass = "team-none";

        if(this.totalTeams >= 2){
            teamColorClass = getTeamColorClass(p.team);
        }
     
        const row =  [
                {
                    "value": p.time_on_server, 
                    "display": MMSS(p.time_on_server), 
                    "className": `${teamColorClass} playtime`
                },
                {"value": p.score, "display": createAverageCompareTD(averages.avg_score, p.score), "bSkipTD": true},
                {"value": p.frags, "display": createAverageCompareTD(averages.avg_frags, p.frags), "bSkipTD": true }, 
                {"value": p.kills, "display": createAverageCompareTD(averages.avg_kills, p.kills), "bSkipTD": true },
                {"value": p.deaths, "display": createAverageCompareTD(averages.avg_deaths, p.deaths), "bSkipTD": true },
                {"display": net, "value": p.kills - p.deaths},
                {"value": p.suicides, "display": createAverageCompareTD(averages.avg_suicides, p.suicides), "bSkipTD": true},
                {"value": p.team_kills, "display": createAverageCompareTD(averages.avg_team_kills, p.team_kills), "bSkipTD": true},
                {"value": p.headshots, "display": createAverageCompareTD(averages.avg_headshots, p.headshots), "bSkipTD": true},
                {"value": p.efficiency, "display": `${p.efficiency.toFixed(2)}%` },
                {"value": p.ttl, "display": MMSS(p.ttl), "className": "playtime"}
            ]
        ;

        if(!bTotals){

            row.unshift({"value": p.name.toLowerCase(), "display": UIPlayerLink(
                {
                    "playerId": p.player_id, 
                    "name": p.name, 
                    "country": p.country,  
                    "bTableElem": true, 
                    "className": `text-left ${teamColorClass}`
                }
            ), "bSkipTD": true});
            
        }else{
            row.unshift({"display": "Totals", "className": "team-none"});
        }

        return row;
    }

    renderEPMTables(){

        const tables = [];

        const columnNames = ["score", "frags", "kills", "deaths", "suicides", "team_kills", "headshots"];

        if(this.totalTeams < 2) this.totalTeams = 1;

        const tableOptions = {
            "className": "t-width-1",
            "sortBy": 1,
            "bAscOrder": false,
            "headers": [
                {"display": "Player"},
                {"display": "Score"},
                {"display": "Frags"},
                {"display": "Kills"},
                {"display": "Deaths"},
                {"display": "Suicides"},
                {"display": "Team Kills"},
                {"display": "Headshots"}
            ],
            "footer": [
                {"display": "Totals"},
                {"display": "SUM", "dataType": "float"},
                {"display": "SUM", "dataType": "float"},
                {"display": "SUM", "dataType": "float"},
                {"display": "SUM", "dataType": "float"},
                {"display": "SUM", "dataType": "float"},
                {"display": "SUM", "dataType": "float"},
                {"display": "SUM", "dataType": "float"},
            ]
        };

        for(let i = 0; i < this.totalTeams; i++){

            tables.push([]);
        }


        for(let i = 0; i < this.playerData.length; i++){

            const p = this.playerData[i];
            if(p.bSpectator) continue;

            let team = (this.totalTeams === 1) ? 0 : p.team;

            if(this.totalTeams > 1 && team === 255) continue;

            const stats = this.getAverages(p.player_id);

            if(stats === null){
                console.warn(`Failed to get player averages`);
                continue;
            }

            const mins = (p.time_on_server > 0) ? p.time_on_server / 60 : 9999;
            
            const currentRow = [
                {
                    "bSkipTD": true,
                    "display": UIPlayerLink({
                        "bTableElem": true,
                        "playerId": p.player_id,
                        "name": p.name,
                        "country": p.country,
                        "className": getTeamColorClass(p.team)
                    }), 
                    "value": p.name.toLowerCase()
                }
             
            ];

            for(let x = 0; x < columnNames.length; x++){

                const c = columnNames[x];
                const matchValue = (p[c] > 0) ? p[c] / mins : 0;
                const lifetimeValue = stats[`epm_${c}`];

                let diff = matchValue - lifetimeValue;

                if(diff > 0){
                    diff = `+${diff.toFixed(2)}`;
                }else{
                    diff = diff.toFixed(2);
                }

               // this.createAverageCompareTD(matchValue, lifetimeValue);

                currentRow.push({
                    "display": createAverageCompareTD(lifetimeValue, matchValue, true),
                    "bSkipTD": true,
                    //"display": (matchValue > 0) ? `${(matchValue).toFixed(2)} ${lifetimeValue} ${diff}` : "",
                    "value": (matchValue > 0) ? matchValue : 0
                });
            }
            
            tables[team].push(currentRow);
        }

        for(let i = 0; i < tables.length; i++){

            new TESTUITable(this.content, tableOptions, tables[i]);
        }

    }

    render(){

        this.content.innerHTML = ``;

        if(this.mode === "normal"){
            this.renderNormalTables();
        }else if(this.mode === "epm"){
            this.renderEPMTables();
        }
    }
}

function createSpreeRow(player, totalTeams){

    const row = [];
    const teamColorClass = (totalTeams < 2) ? "team-none" : getTeamColorClass(player.team);

    row.push(
        {
            "bSkipTD": true,
            "value": player.name.toLowerCase(),
            "display": UIPlayerLink({
                "playerId": player.player_id, 
                "className": `${teamColorClass} text-left`, 
                "country": player.country, 
                "bTableElem": true, 
                "name": player.name
            })
        }
    );


    for(let i = 1; i < 6; i++){

        const s = player[`spree_${i}`];
        row.push({"display": ignore0(s), "value": s});
    }

    row.push({"display": ignore0(player["spree_best"]), "value": player["spree_best"]});

    return row;
}

function createMultiRow(player, totalTeams){

    const teamColorClass = (totalTeams < 2) ? "team-none" : getTeamColorClass(player.team);

    const row = [   
        {
            "bSkipTD": true,
            "value": player.name.toLowerCase(),
            "display": UIPlayerLink({
                "playerId": player.player_id, 
                "className": `${teamColorClass} text-left`, 
                "country": player.country, 
                "bTableElem": true, 
                "name": player.name
            })}
    ];

    for(let i = 1; i < 5; i++){

        const m = player[`multi_${i}`];

        row.push({"display": ignore0(m), "value": m});
    }

    row.push({"display": ignore0(player["multi_best"]), "value": player["multi_best"]});

    return row;
}

function getFirstBloodPlayer(players){

    for(let i = 0; i < players.length; i++){

        const p = players[i];
        if(p.spectator) continue;
        if(p.first_blood) return p;
    }

    return {"name": "Not Found", "country": "xx"};
}

function renderSpecialEvents(parent, totalTeams, players){

    parent = document.querySelector(parent);

    const wrapper = UIDiv();
    const title = UIHeader(wrapper, "Special Events");

    const sprees = [];

    const spreeTableOptions = {
        "className": "t-width-1",
        "headers": [
            {"display": "Player"}, 
            {"display": "Killing Spree"}, 
            {"display": "Rampage"}, 
            {"display": "Dominating"}, 
            {"display": "Unstoppable"}, 
            {"display": "Godlike"}, 
            {"display": "Best Spree"}
        ],
        "footer": [
            {"display": "Total | Best"},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "MAX", "dataType": "INT", "callback": ignore0}
        ]
    };

    const multis = [];

    const multiTableOptions = {
        "className": "t-width-1",
        "headers": [
            {"display": "Player"}, 
            {"display": "Double Kill"}, 
            {"display":"Multi Kill"}, 
            {"display":"Ultra Kill"},
            {"display": "Monster Kill"},
            {"display":"Best Multi Kill"}
        ],
        "footer": [
            {"display": "Total | Best"},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "MAX", "dataType": "INT", "callback": ignore0}
        ]
    };

    const firstBlood = document.createElement("table");

    const firstBloodRow = document.createElement("tr");
    firstBloodRow.append(UITableCell({"content": "First Blood"}));

    const firstBloodPlayer = getFirstBloodPlayer(players);

    firstBloodRow.append(UIPlayerLink({
        "playerId": firstBloodPlayer.player_id, 
        "name": firstBloodPlayer.name, 
        "country": firstBloodPlayer.country,
        "className": (totalTeams >= 2) ? getTeamColorClass(firstBloodPlayer.team) : "team-none",
        "bTableElem": true
    }));

    firstBlood.append(firstBloodRow);
    wrapper.append(firstBlood);

    for(let i = 0; i < players.length; i++){

        const p = players[i];

        if(p.spectator) continue;

        if(p.spree_best >= 5){
            sprees.push(createSpreeRow(p, totalTeams));
        }

        if(p.multi_best >= 2){
            multis.push(createMultiRow(p, totalTeams));
        }
    }

 
    if(sprees.length > 1){
        new TESTUITable(wrapper, spreeTableOptions, sprees);
    }

    if(multis.length > 1){
        new TESTUITable(wrapper, multiTableOptions, multis);
    }

    if(multis.length > 1 || sprees.length > 1){
        parent.append(wrapper);
    }
}


function getPlayerDomPointCaps(playerId, pointId, capData){

    for(let i = 0; i < capData.length; i++){

        if(capData[i].player_id === playerId && capData[i].point_id == pointId){
            return capData[i];
        }
    }

    return null;
}


class MatchDominationSummary{

    constructor(parent, totalTeams, data){

        if(data.dom === null || data.dom.data.length === 0) return;

        if(totalTeams < 2) return;

        this.totalTeams = totalTeams;
        this.data = data;

        this.parent = document.querySelector(parent);

        this.generalWrapper = UIDiv();
        UIHeader(this.generalWrapper, "Domination Summary");
        this.generalContent = UIDiv();
        this.generalWrapper.append(this.generalContent);
        this.parent.append(this.generalWrapper);
        this.renderGeneral();

        this.playersWrapper = UIDiv();
        this.mode = "percent";
        UIHeader(this.playersWrapper, "Domination Players Summary");


        this.createTabs();

        this.info = UIDiv("info");
        this.content = UIDiv();
        this.playersWrapper.append(this.info, this.content);
        this.render();

        this.parent.append(this.playersWrapper);

        
    }

    createTabs(){

        const tabOptions = [
            {"display": "Control Percent", "value": "percent"},
            {"display": "Control Time", "value": "time"},
            {"display": "Total Caps", "value": "caps"},
            {"display": "Shortest Time Held", "value": "short-time"},
            {"display": "Longest Time Held", "value": "long-time"},
            {"display": "Total Points*", "value": "total-points"},
            {"display": "Max Points*", "value": "max-points"},
            {"display": "Stolen Points*", "value": "stolen-points"},
            {"display": "Stolen Caps*", "value": "stolen-caps"},
        ];

        this.tabs = new UITabs(this.playersWrapper, tabOptions, this.mode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{
            this.mode = e.detail.newTab;
            this.render();
        });
    }


    createHeaderRow(controlPoints){

        //const headerRow = document.createElement("tr");
            
       // headerRow.append(UITableHeaderColumn({"content": "Player"}));

        const found = [];
        for(const [pointId, pointName] of Object.entries(controlPoints)){
            //headerRow.append(UITableHeaderColumn({"content": pointName}));
            found.push({"display": pointName});
        }

        //return headerRow;
        return found;
    }


    getContent(caps, bTotals){

        let className = "";
        let content = "";
        let currentValue = 0;

        if(caps === null) return {className, content, currentValue}

        if(this.mode === "percent"){

            currentValue = (bTotals) ? caps : caps.control_percent;
            content = `${currentValue.toFixed(2)}%`;

        }else if(this.mode === "time"){

            currentValue = (bTotals) ? caps : caps.total_control_time;
            content= `${toPlaytime(currentValue, true)}`;
            className = "playtime";

        }else if(this.mode === "caps"){

            currentValue = (bTotals) ? ignore0(caps) : caps.total_caps;
            content= currentValue;

        }else if(this.mode === "long-time"){

            currentValue = (bTotals) ? caps : caps.longest_control_time;
            content = `${toPlaytime(currentValue, true)}`;
            className = "playtime";

        }else if(this.mode === "short-time"){

            currentValue = (bTotals) ? caps : caps.shortest_control_time;
            content = `${toPlaytime(currentValue, true)}`;
            className = "playtime";

        }else if(this.mode === "total-points"){

            currentValue = (bTotals) ? caps : caps.control_point_score;
            content = currentValue.toFixed(2);
     
        }else if(this.mode === "max-points"){

            currentValue = (bTotals) ? caps : caps.max_control_point_score;
            content = currentValue.toFixed(2);
     
        }else if(this.mode === "stolen-points"){

            currentValue = (bTotals) ? caps : caps.stolen_points;
            content = currentValue.toFixed(2);

        }else if(this.mode === "stolen-caps"){
            currentValue = (bTotals) ? caps : caps.stolen_caps;
            content = ignore0(currentValue);
        }

        return {className, content, currentValue}
    }


    updateInfo(){

        this.info.innerHTML = ``;

        if(this.mode === "percent"){

            this.info.append("Total control percent, based on first touch timestamp for each Control Point to match end.");

        }else if(this.mode === "time"){

            this.info.append("Total time each player had control of each control point.");

        }else if(this.mode === "caps"){
            this.info.append("Total times a player captured the control point.");

        }else if(this.mode === "short-time"){

            this.info.append("The shortest amount of time a player had control of the point for a single capture.");

        }else if(this.mode === "long-time"){

            this.info.append("The longest amount of time a player had control of the point for a single capture.");

        }else if(this.mode === "total-points" || this.mode === "max-points"){

            const lines = [`- Recreated from stats log, Usually less than +-0.5% of real UT score.`];

            if(this.mode === "max-points") lines.push(UIBr(), `The most amount of points gotten from a single control point capture.`);
         
            this.info.append(UIB("Estimated Points Calculated From Stat Log"), UIBr(), ...lines);

        }else if(this.mode === "stolen-points"){

            const lines = [
                `- Recreated from stats log, Usually less than +-0.5% of real UT score.`,
                UIBr(),
                `- Domination Timer runs every `,UIB("1 second * gamespeed(Hardcore games have an additional * 1.1 on top)"),`.`,
                UIBr(),
                `- Control Point Timers run every `,UIB("1 second(not affected by gamespeed)"),` after being touched, on the second call being set to bScoreReady.`,
    
                UIBr(),
                `- A stolen point is when you capture a control point already in a scoring state from another team.`,
                UIBr(),
                `- Control Points are mistakenly set to `, UIB("bScoreReady=False"), 
                ` 1 second after being touched instead of straight away.`,
                UIBr(),
                `- This can give the newly captured player points if the Domination Timer is called before the Control Point's.`
            ];
         
            this.info.append(UIB("Estimated Points Calculated From Stat Log"), UIBr(), ...lines);

        }else if(this.mode === "stolen-caps"){

            const lines = [
                `- Recreated from stats log, Usually less than +-0.5% of real UT score.`,
                UIBr(),
                `- This is the total amount of times a player got a stolen point capture.`
            ];
         
            this.info.append(UIB("Estimated Points Calculated From Stat Log"), UIBr(), ...lines);

        }
    }

    renderGeneral(){

        const tableOptions = {
            "className": "t-width-1",
            "headers": [
                {"display": "Team"}, 
                {"display": "Total Captures"}, 
                {"display": "Total Control Time"}, 
                {"display": "Total Control Percent"}, 
                {"display": "Total Score Time*"},
                {"display": "Stolen Caps*"},
                {"display": "Stolen Score*"},
                {"display": "Importer Score*"},
                {"display": "Final UT Score"}
            ],
            "footer": [
                {"display": "Totals"},
                {"display": "SUM", "dataType": "INT"},
                {"display": "SUM", "dataType": "FLOAT", "callback": MMSS},
                {"display": "SUM", "dataType": "FLOAT","callback": (v) => parseFloat(v).toFixed(2)},
                {"display": "SUM","dataType": "FLOAT", "callback": MMSS},
                {"display": "SUM","dataType": "INT"},
                {"display": "SUM", "dataType": "FLOAT", "callback": (v) => parseFloat(v).toFixed(2)},
                {"display": "SUM", "dataType": "FLOAT","callback": (v) => parseFloat(v).toFixed(2)},
                {"display": "SUM", "dataType": "FLOAT","callback": (v) => parseFloat(v).toFixed(2)},
            ]
        };

        const rows = [];

        for(let i = 0; i < this.totalTeams; i++){

            const d = this.data.dom.detailedResult;

            rows.push([
                {
                    "value": `${getTeamName(i)} Team`, 
                    "className": `${getTeamColorClass(i)} text-left`
                },
                {
                    "value": d[`team_${i}_caps`], 
                    "callback": ignore0
                },
                {
                    "value": d[`team_${i}_control_time`], 
                    "display": MMSS(d[`team_${i}_control_time`]),
                    "className": "playtime"
                },
                {
                    "value": `${d[`team_${i}_control_percent`]}%`
                },
                {
                    "value": d[`team_${i}_score_time`], "className": 
                    "playtime",
                    "display": MMSS(d[`team_${i}_score_time`]),
                },
                {
                    "value": d[`team_${i}_stolen_caps`], "callback": ignore0
                },
                {
                    "value": d[`team_${i}_stolen_points`].toFixed(2)
                },
                {
                    "value": d[`team_${i}_importer_score`].toFixed(2)
                },
                {
                    "value": d[`team_${i}_real_score`].toFixed(2)
                }
            ]);

        }

        const info = UIDiv("info");

        info.append(
            UIB(`* indicates calculated from stats log.`), 
            UIBr(),
            `With the multiple bugs in both Domination's and the Control Points, 
            calculating scores from the limited stats log data doesn't always perfectly match UT's.`,
            UIBr(),
            `The calculated scores are usually within a +-0.5% error range`
        );

        const canvas = document.createElement("canvas");

        const testTabs = [
            {"name": "Real Team Scores", "title": "Real Team Scores"},
            {"name": "Importer Team Scores", "title": "Importer Team Scores"},
            {"name": "Importer VS UT", "title": "Totals Of All Teams"},
        ];

        const labels = [];
        
        const d1 = [];
        const d2 = [];
        const totals = [];

        for(let i = 0; i < this.data.basic.total_teams; i++){

            let currentName = `${getTeamName(i)} Team`;
            
            const currentReal = {
                "name": currentName,
                "values": []
            };

            const currentFake = {
                "name": currentName,
                "values": []
            };

            const currentTotals = {"name": (i === 0) ? "Real Scores" : "Importer Scores", "values": []};

            for(let x = 0; x < this.data.dom.scoreHistory.length; x++){
  
                const d = this.data.dom.scoreHistory[x];

                if(i === 0) labels.push(MMSS(d.timestamp - this.data.basic.match_start));

                currentReal.values.push(parseFloat(d[`real_team_${i}_score`].toFixed(2)));
                currentFake.values.push(parseFloat(d[`importer_team_${i}_score`].toFixed(2)));

                //only need 2 to compare log and ut scores
                if(i > 1) continue;
                currentTotals.values.push(parseFloat(d[`${(i === 0) ? "real" : "importer" }_total_score`].toFixed(2)));
            }

            d1.push(currentReal);
            d2.push(currentFake);
            if(i > 1) continue;
            totals.push(currentTotals);
        }

        const testData = {
            "data":[
                d1, d2, totals
            ],
            "labelsPrefix": [
                "Total Scores @ ", "Total Scores @ ", "Total Scores @ "
            ],
            "labels": [labels, labels, labels]
        };

        new Graph(canvas, new AbortController(), 1920, 1080, testTabs, false, testData);

 
        this.generalContent.append(info);
        //new UITable(this.generalContent, tableOptions, rows);
        new TESTUITable(this.generalContent, tableOptions, rows)

        const graphWrapper = UIDiv("graph-wrapper");
        graphWrapper.append(canvas);
        this.generalContent.append(graphWrapper);

    }

    render(){


        this.content.innerHTML = ``;
    
        this.updateInfo();
        const playerData = this.data.playerData;
        const controlPoints = this.data.dom.controlPoints;
        const domData = this.data.dom.data;

        const higherBetter = ["long-time", "max-points"];
        const totalKeys = ["percent", "time", "caps", "total-points", "stolen-points", "stolen-caps"];

        const headerRowOptions = this.createHeaderRow(controlPoints);

        for(let i = 0; i < this.totalTeams; i++){

            const tableOptions = {
                "className": "t-width-1",
                "headers": [{"display": "Player"},...headerRowOptions],
                "footer": [{"display": "Combined"}]
            };


            const rows = [];

            const totals = {};

            for(let x = 0; x < playerData.length; x++){

                const p = playerData[x];

                if(p.spectator || p.team !== i) continue;

                const row = [];

                row.push(
                    {
                    "value": p.name.toLowerCase(), 
                    "bSkipTD": true,
                        "display": UIPlayerLink({
                            "playerId": p.player_id, 
                            "className": `${getTeamColorClass(p.team)} text-left`, 
                            "country": p.country, 
                            "bTableElem": true, 
                            "name": p.name
                        })
                    }
                );

                for(const pointId of Object.keys(controlPoints)){

                    const caps = getPlayerDomPointCaps(p.player_id, pointId, domData);

                    
                    if(totals[pointId] === undefined){
                        totals[pointId] = 0;
                    }

                    const {content, className, currentValue} = this.getContent(caps, false);

                    if(currentValue > 0){

                        if(higherBetter.indexOf(this.mode) !== -1 && totals[pointId] < currentValue){
                            
                            totals[pointId] = currentValue;
                        }

                        if(this.mode === "short-time"){

                            if(totals[pointId] === 0){
                                totals[pointId] = currentValue;
                            }else{

                                if(totals[pointId] > currentValue){
                                    totals[pointId] = currentValue;
                                }
                            }
                             
                            
                        }

                        if(totalKeys.indexOf(this.mode) !== -1){
                            totals[pointId] += currentValue;
                        }
                    }
                    
                    const col = {"display": content, "value": currentValue};

                    if(className !== ""){
                        col.className = className;
                    }

                    row.push(col);
                }
            
                rows.push(row);
            }



            for(const pointId of Object.keys(controlPoints)){

                const {content, className, currentValue} = this.getContent(totals[pointId], true);

                const col = UITableCell({content});

                if(className !== "") col.className = className;

                tableOptions.footer.push({"display": content, "value": currentValue});
            }


            new TESTUITable(this.content, tableOptions, rows)

        }
    }
}


class MatchCTFSummary{

    constructor(parent, totalTeams, data, players, playerAverages){

        if(data.playerData.length === 0) return;

        this.totalTeams = totalTeams;
        this.players = players;
        this.playerAverages = playerAverages;
        this.data = data;

        this.parent = document.querySelector(parent);

        this.wrapper = UIDiv();

        UIHeader(this.wrapper, "Capture The Flag Summary");

        this.createTabs();
        this.content = UIDiv();
        this.wrapper.append(this.content);

        this.parent.append(this.wrapper);

        this.mode = "general";

        

        this.render();

    }

    createTabs(){

        this.tabs = new UITabs(this.wrapper, [
            {"display": "General", "value": "general"},
            {"display": "Returns", "value": "returns"},
            {"display": "Carry Time", "value": "carry time"}
        ]);


        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{

            this.mode = e.detail.newTab;
            this.render();
        });

    }

    bPlayerHaveAnyMatchingCTFEvents(player, targetKeys){

        for(let i = 0; i < targetKeys.length; i++){

            if(player[targetKeys[i]] !== 0 && targetKeys[i] !== "flag_carry_time_min") return true;
        }

        return false;
    }

    renderCTFSummaryType(headers, dataKeys){

        const playtimeTypes = [
            "flag_carry_time",
            "flag_carry_time_max",
            "flag_carry_time_avg",
            "flag_carry_time_min"
        ];

        const tableOptions = {
            headers, 
            "className": "t-width-1",
            "footer": [
                {"display": "Totals"},
            ]
        }

        const recordsInfo = {};

        for(let i = 0; i < dataKeys.length; i++){

            const current = {"display": "SUM", "dataType": "FLOAT"};

            if(playtimeTypes.indexOf(dataKeys[i]) !== -1){
                current.callback = (v) => { return toPlaytime(v, true)};
                current.className = "playtime";
            }else{
                current.callback = ignore0;
            }
            tableOptions.footer.push(current);
        }

        
        for(let i = 0; i < this.totalTeams; i++){

            const totals = {};
            
            for(let z = 0; z < dataKeys.length; z++){
                totals[dataKeys[z]] = 0;
            }

            const rows = [];

            for(let x = 0; x < this.data.playerData.length; x++){

                const p = this.data.playerData[x];

                if(p.spectator) continue;

                const row = []

                const player = this.players?.[p.player_id] ?? {"name": "Not Found", "country": "xx", "team": 255};

                if(player.team !== i) continue;
                

                //skip players with no matching events
                if(!this.bPlayerHaveAnyMatchingCTFEvents(p, dataKeys)) continue;

                const avg = this.playerAverages[p.player_id] ?? {};

                row.push({
                    "value": player.name.toLowerCase(), 
                    "display": UIPlayerLink({
                        "playerId": p.player_id,
                        "className": getTeamColorClass(i), 
                        "country": player.country, "bTableElem": "true", "name": player.name
                    }),
                    "bSkipTD": true
                });

                for(let z = 0; z < dataKeys.length; z++){

                    totals[dataKeys[z]] += p[dataKeys[z]];

                    const value = (dataKeys[z] !== "times_held") ? p[dataKeys[z]] : p.flag_taken + p.flag_pickup;

                    let avgValue = 0;

                    if(dataKeys[z] !== "times_held" && playtimeTypes.indexOf(dataKeys[z]) === -1){

                        avgValue =  avg[`avg_${dataKeys[z]}`] ?? 0;

                        if(avgValue > 0 && avgValue >= avg[`max_${dataKeys[z]}`]){

                            if(recordsInfo[p.player_id] === undefined){
                                recordsInfo[p.player_id] = {
                                    "name": player.name,
                                    "records": []
                                };
                            }
                            recordsInfo[p.player_id].records.push({"key": dataKeys[z], "value": avg[`max_${dataKeys[z]}`]});
                        }

                    }else{
                        avgValue = (avg?.[`avg_flag_taken`] ?? 0) + (avg?.[`avg_flag_pickup`] ?? 0);
                    }

                    if(playtimeTypes.indexOf(dataKeys[z]) === -1){
                        row.push({"value": p[dataKeys[z]], "bSkipTD": true, "display": createAverageCompareTD(avgValue, value)});
                    }else{
                        row.push({"value": p[dataKeys[z]], "display": toPlaytime(p[dataKeys[z]], true), "className": "playtime"});
                    }
                }

                rows.push(row);
            }
            
            new TESTUITable(this.content, tableOptions, rows);
        }
        
        //UIHeader(this.content, "Player CTF Personal Bests")

        const test = UIDiv("personal-bests");

        for(const [playerId, playerData] of Object.entries(recordsInfo)){

            const {name, records} = playerData;
            const player = getPlayer(this.players, playerId);


            const div = UIDiv(getTeamColorClass(player.team));

            div.append(UIPlayerLink({
                "name": UIB(name),
                "country": player.country,
                "playerId": playerId,
            }), " got their map personal best for ");

            for(let i = 0; i < records.length; i++){

                const  {value, key} = records[i];
                
                div.append(" ", headers[dataKeys.indexOf(key) + 1].display, " (", UIB(value),")");
                if(i === records.length - 1){
                    div.append(UIBr())
                }else if(i === records.length - 2){
                    div.append(", and ");
                }else{
                    div.append(", ")
                }
            }
            

            test.append(div);
        }

        for(let i = 0; i < recordsInfo.length; i++){

            const {name, value, key} = recordsInfo[i];

            test.append(UIB(name), " matched their personal best for ", UIB(key), " with ", UIB(value), UIBr());
        }

        this.content.append(test);
    }

    renderGeneralCTFTab(){

        let headers = [
            "Player", "Taken", "Pickup", "Drop", "Assist", "Cover", 
            "Seal", "Capture", "Kill", "Return", "Carry Time"
        ];

        headers = headers.map((h) =>{ return {"display": h}} );

        const dataKeys = [
            "flag_taken",
            "flag_pickup",
            "flag_drop",
            "flag_assist",
            "flag_cover",
            "flag_seal",
            "flag_cap",
            "flag_kill",
            "flag_return",
            "flag_carry_time",
        ];

        this.renderCTFSummaryType(headers, dataKeys);
    }


    renderReturnCTFTab(){


        let headers = [
            "Player", "Return", "Return Base", "Return Mid", 
            "Return Enemy Base", "Return Close Save"
        ];

        headers = headers.map((h) =>{ return {"display": h}} );

        const dataKeys = [
            "flag_return",
            "flag_return_base",
            "flag_return_mid",
            "flag_return_enemy_base",
            "flag_return_save"
        ];

        this.renderCTFSummaryType(headers, dataKeys);
    }

    renderCarryTimeCTFTab(){


        let headers = [
            "Player", "Times Held", 
            "Total Carry Time",
            "Max Carry Time", 
            "Avg Carry Time",
            "Min Carry Time",
        ];

        headers = headers.map((h) =>{ return {"display": h}} );

        const dataKeys = [
            "times_held",
            "flag_carry_time",
            "flag_carry_time_max",
            "flag_carry_time_avg",
            "flag_carry_time_min"
        ];

        this.renderCTFSummaryType(headers, dataKeys);
    }


    render(){

        this.content.innerHTML = ``;

        switch(this.mode){        
            case "general": {
                this.renderGeneralCTFTab();
            } break;
            case "returns": {
                this.renderReturnCTFTab();
            } break;
            case "carry time": {
                this.renderCarryTimeCTFTab();
            }break;       
        }
    }
}

class CTFCaps{


    constructor(parent, totalTeams, data, players, startTimestamp){

        if(data.playerData.length === 0) return;

        this.parent = document.querySelector(parent);
        this.totalTeams = totalTeams;
        this.caps = data.caps;

        this.matchStart = startTimestamp;
        this.players = players;

        this.currentCap = 1;
        this.currentScores = [0,0];
        this.mode = "basic";

        this.wrapper = UIDiv();


        this.title = UIHeader(this.wrapper, "Capture The Flag Caps");
       
        this.createTabs();

        this.content = UIDiv("ctf-cap");

        this.createButtonWrapper();
        this.wrapper.append(this.content);

        this.parent.append(this.wrapper);

        this.render();
    }


    createTabs(){

        const options = [
            {"display": "Basic", "value": "basic"},
            {"display": "Detailed", "value": "detailed"},
        ];

        this.tabs = new UITabs(this.wrapper, options, this.mode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{
            this.mode = e.detail.newTab;
            this.render();
        })
    }


    MMSSElem(value){

        const elem = UIDiv("ctf-event-timestamp");
        value = MMSS(value);
        elem.append(value);

        return elem;
    }

    createButtonWrapper(){

        this.buttonsWrapper = new UIPreviousNextButtons(
            this.wrapper, {
                "previousText": "Previous Cap",
                "nextText": "Next Cap",
                "itemName": "Cap"
            }, (newPage) =>{
                this.currentCap = newPage;
                this.render();
            }, (newPage) =>{
                this.currentCap = newPage;
                this.render();
            },
            this.caps.length
        );

    }

    createCapWrapper(){

        this.capWrapper = UIDiv();
 
        this.teamScores = UIDiv("ctf-cap-team-scores duo");

        this.redScore = UIDiv("team-red text-center");
        this.blueScore = UIDiv("team-blue text-center");
        
        this.teamScores.append(this.redScore, this.blueScore);

        this.capWrapper.append(this.teamScores);

        this.capInfo = UIDiv("cap-info text-center");
        this.capWrapper.append(this.capInfo);
        this.content.append(this.capWrapper);

        this.killsElem = UIDiv();
        this.suicidesElem = UIDiv();

        this.capWrapper.append(this.killsElem, this.suicidesElem);

    }


    toSortedCovers(capInfo){

        const covers = [];

        for(const [id, timestamps] of Object.entries(capInfo.covers)){

            for(let i = 0; i < timestamps.length; i++){

                covers.push({"id": id, "timestamp": timestamps[i]});
            }
        }

        return covers.sort((a,b) =>{
            return a.timestamp - b.timestamp;
        });
    }

    addEventElem(mmss, content){

        const wrapper = UIDiv("ctf-event");

        const time = UIDiv("ctf-event-mmss");
        time.append(MMSS(mmss));

        const data = UIDiv("ctf-event-data");
        data.append(...content);

        wrapper.append(
            time
        , data);
        return wrapper;
    }

    renderCovers(start, end, covers, carryPlayer){

        const elems = [];

        for(let x = 0; x < covers.length; x++){

            if(covers[x].timestamp < start) continue;
            if(covers[x].timestamp > end) continue;

            const coverPlayer = getPlayer(this.players, covers[x].id);

            elems.push(this.addEventElem(covers[x].timestamp,[
                UIPlayerLink({
                    "name": UISpan(coverPlayer.name, getTeamFont(coverPlayer.team)), 
                    "playerId": covers[x].id, 
                    "country": coverPlayer.country
                }), 
                " Covered ",
                UIPlayerLink({
                    "name": UISpan(carryPlayer.name, getTeamFont(carryPlayer.team)), 
                    "playerId": carryPlayer.id, 
                    "country": carryPlayer.country
                })
            ]));
        }

        return elems;
    }


    renderEvents(capInfo){

        const elems = [];

        const covers = this.toSortedCovers(capInfo);
        
        const flagTeam = getTeamName(capInfo.flag_team);

        let lastDropTime = 0;
        //last player that had the flag
        let lastPlayer = null;
        let lastCarryTime = 0;


        for(let i = 0; i < capInfo.carryTimes.length; i++){

            const c = capInfo.carryTimes[i];

            const p = getPlayer(this.players, c.player_id);

            let currentPlayerTeamFont = getTeamFont(p.team);

            const start = c.start_timestamp;

            let lastPlayerTeamFont = "font-color-1";

            if(lastPlayer !== null){
                lastPlayerTeamFont = getTeamFont(lastPlayer.team);
            }

            if(i > 0){

                elems.push(this.addEventElem(lastDropTime, [
                    UIPlayerLink({
                        "playerId": lastPlayer.id, 
                        "name": UISpan(lastPlayer.name, lastPlayerTeamFont), 
                        "country": lastPlayer.country
                    }),
                    ` Dropped The `,
                    UISpan(`${getTeamName(capInfo.flag_team)} Flag `, getTeamFont(capInfo.flag_team)),
                    UISpan(`(Carry Time ${toPlaytime(lastCarryTime, true)})`, "monospace"),
                ]));
            }

            let takenString = ` Picked Up The `;
            if(i === 0) takenString = ` Grabbed The `;

            elems.push(this.addEventElem(start, 
                [
                    UIPlayerLink({
                        "playerId":c.player_id, 
                        "country":p.country, 
                        "name": UISpan(p.name, currentPlayerTeamFont)
                    }), 
                    takenString,
                    UISpan(`${flagTeam} Flag`, getTeamFont(capInfo.flag_team))
                ]
            ));


            const end = c.end_timestamp;

            if(covers.length > 0){
                elems.push(...this.renderCovers(start, end, covers, p));
            }

            lastPlayer = p;

            lastCarryTime = c.carry_time;
            lastDropTime = end;
        }

        const capPlayer = getPlayer(this.players, capInfo.cap_player);

        elems.push(this.addEventElem(capInfo.cap_timestamp, [
            UIPlayerLink({
                "playerId": capInfo.cap_player,
                "name": UISpan(capPlayer.name, getTeamFont(capPlayer.team)),
                "country": capPlayer.country
            }), 
            ` Captured The `,
            UISpan(`${flagTeam} Flag `, getTeamFont(capInfo.flag_team)),
            UISpan(`(Carry Time ${toPlaytime(lastCarryTime, true)})`, "monospace")
        ]));

        const elem = this.createCapElem("Events", elems);

        this.capInfo.append(elem);
    
    }

    getCapStatByPlayerTotal(mode, data, targetTeam){

        const totals = {};

        let playerIdKey = "";
        let playerTeamKey = "";

        if(mode === "suicides"){

            playerIdKey = "playerId";
            playerTeamKey = "playerTeam";

        }else if(mode === "kills"){

            playerIdKey = "killerId";
            playerTeamKey = "killerTeam";
        }

        for(let i = 0; i < data.length; i++){

            const d = data[i];

            const playerId = d[playerIdKey];
            const playerTeam = d[playerTeamKey];

            if(playerTeam != targetTeam) continue;

            if(totals[playerId] === undefined){
                totals[playerId] = 0;
            }

            totals[playerId]++;
        }

        const finalData = [];

        for(const [playerId, playerTotal] of Object.entries(totals)){

            finalData.push({playerId, "total": parseInt(playerTotal)});
        }

        finalData.sort((a, b) =>{

            return b.total - a.total;
        });

        return finalData;
    }


    createFragElems(mode, capInfo, targetTeam){

        const fontColor = getTeamFont(targetTeam);
        const totals = this.getCapStatByPlayerTotal(mode, capInfo[mode], targetTeam);

        const elems = [];

        for(let i = 0; i < totals.length; i++){

            const t = totals[i];

            const player = getPlayer(this.players, t.playerId);

            elems.push(UIPlayerLink({
                "playerId": t.playerId, 
                "country": player.country, 
                "name": UISpan(player.name, fontColor)
            }));

            elems.push(UISpan(`(${t.total})`, "monospace"));

            if(i < totals.length - 1){
                elems.push(", ");
            }
        }

        return elems;
    }

    renderTeamFrags(capInfo){
  
        const elems = [];

        for(let i = 0; i < this.totalTeams; i++){

            const teamName = getTeamName(i);
            
            const suicides = capInfo[`${teamName.toLowerCase()}_suicides`] ?? 0;

            const killElems = this.createFragElems("kills", capInfo, i);
         
            elems.push(this.createLabelValueRow(`${teamName} Kills`, killElems));

            if(suicides === 0) continue;
    
            const suicideElems = this.createFragElems("suicides", capInfo, i);
            elems.push(this.createLabelValueRow(`${teamName} Suicides`, suicideElems));
        
        }

        this.capInfo.append(this.createCapElem("Frags", elems));
    }


    createCapElem(title, elems){

        const wrapper = UIDiv("ctf-cap-wrapper");
        const titleElem = UIDiv("ctf-cap-title");
        titleElem.append(title);

        const contentElem = UIDiv("ctf-cap-value");
        contentElem.append(...elems);

        wrapper.append(titleElem, contentElem);

        return wrapper;
    }

    createLabelValueRow(name, content){

        const elem = UIDiv("ctf-summary-row");

        const label = UIDiv("ctf-summary-label");
        label.append(name);

        const data = UIDiv("ctf-summary-data")
        data.append(...content);

        elem.append(label, data);
        return elem;
    }

    renderDetailedSummary(capInfo){

        const wrapper = UIDiv("ctf-cap-wrapper");
        const content = UIDiv("ctf-cap-value");
        const titleElem = UIDiv("ctf-cap-title");

        titleElem.append(`${getTeamName(capInfo.capping_team)} Team Captured The ${getTeamName(capInfo.flag_team)} Flag`);
        wrapper.append(titleElem, content);
        const grabPlayer = getPlayer(this.players, capInfo.taken_player);

        content.append(this.createLabelValueRow(`Flag Taken By `, [
            UIPlayerLink({
                "playerId": capInfo.taken_player, 
                "name": UISpan(grabPlayer.name, getTeamFont(grabPlayer.team)), 
                "country": grabPlayer.country
            }),
            " at ",
            UIMMSS(capInfo.taken_timestamp)
        ]));

        const capPlayer = getPlayer(this.players, capInfo.cap_player);
    
        content.append(this.createLabelValueRow(`Flag Captured By `, [
            UIPlayerLink({
                "playerId": capInfo.cap_player, 
                "name": UISpan(capPlayer.name, getTeamFont(capPlayer.team)), 
                "country": capPlayer.country
            }),
            " at ",
            UIMMSS(capInfo.cap_timestamp)
        ]));

        content.append(this.createLabelValueRow(`Capture Time`, [UISpan(toPlaytime(capInfo.cap_time, true), "monospace")]));

         if(capInfo.total_drops > 0){

            content.append(this.createLabelValueRow(`Carry Time`, [UISpan(toPlaytime(capInfo.carry_time, true), "monospace")]));

            content.append(this.createLabelValueRow(`Time Dropped`, [UISpan(toPlaytime(capInfo.drop_time, true), "monospace")]));

            content.append(this.createLabelValueRow(`Flag Drops`, [capInfo.total_drops]));

        }
        

        if(capInfo.total_covers > 0){

            const coverElems = [];

            const totalCoverPlayers = Object.keys(capInfo.covers).length;
            let currentIndex = 0;
            
            for(const [playerId, cover] of Object.entries(capInfo.covers)){

                const player = getPlayer(this.players, playerId);

                coverElems.push(UIPlayerLink({
                    "playerId": playerId, 
                    "name": UISpan(player.name, getTeamFont(player.team)), 
                    "country": player.country
                }), UISpan(`(${cover.length})`, "monospace"));

                if(currentIndex < totalCoverPlayers - 1){
                    coverElems.push(", ");
                }
                currentIndex++;
            }

            content.append(this.createLabelValueRow("Covers", coverElems));
        }

        const usedCarryIds = [];
        const carryElems = [];

        for(let i = 0; i < capInfo.carryTimes.length; i++){

            const c = capInfo.carryTimes[i];

            if(usedCarryIds.indexOf(c.player_id) !== -1) continue

            const p = getPlayer(this.players, c.player_id);

            carryElems.push(UIPlayerLink({
                "playerId": c.player_id, 
                "name": UISpan(p.name, getTeamFont(p.team)), 
                "country": p.country
            }));

            if(usedCarryIds.length < capInfo.unique_carriers - 1){

                carryElems.push(", ");
            }

            usedCarryIds.push(c.player_id);

        }

        content.append(this.createLabelValueRow("Unique Flag Carriers", carryElems));

        return wrapper;

    }

    renderDetailedCap(){

        const currentScores = [0,0];

        for(let i = 0; i < this.currentCap; i++){

            const c = this.caps[i];
            currentScores[c.capping_team]++;
        }
        
        this.redScore.innerHTML = currentScores[0];
        this.blueScore.innerHTML = currentScores[1];

        const capInfo = this.caps[this.currentCap - 1];

        const capTime = UISpan();

        capTime.append(
            UIB(`${toPlaytime(capInfo.cap_time, true)}`), 
            MMSS(capInfo.taken_timestamp),
            "    " , 
            MMSS(capInfo.cap_timestamp)
        );

        this.capInfo.innerHTML = "";

        this.capInfo.append(this.renderDetailedSummary(capInfo));
        this.renderTeamFrags(capInfo);
        this.renderEvents(capInfo);
        
    }

    updateButtonsWrapper(){

        if(this.mode !== "detailed"){
            this.buttonsWrapper.className = "hidden";
        }else{
            this.buttonsWrapper.className = "previous-next-buttons";
        }
    }


    renderBasicCaps(){

        const tableOptions = {
            "className": "t-width-1",
            "headers": [
                "Taken", "Taken By", "Drops", "Covers", 
                "Kills", "Suicides", "Capped By", 
                "Cap", "Travel Time", "Score"
            ]
        };


        tableOptions.headers = tableOptions.headers.map((h) =>{
            return {"display": h};
        });

        const data = [];

        let teamScores = [0,0];

        for(let i = 0; i < this.caps.length; i++){

            const c = this.caps[i];

            const grabPlayer = getPlayer(this.players, c.taken_player);
            const capPlayer = getPlayer(this.players, c.cap_player);

            if(c.capping_team < 2){
                teamScores[c.capping_team]++;
            }

            const scores = UIBasicTeamScore(teamScores[0], teamScores[1]);
            const kills = UIBasicTeamScore(c.red_kills, c.blue_kills);
            const suicides = UIBasicTeamScore(c.red_suicides, c.blue_suicides);

            data.push([
                
                {
                    "display": UIMMSS(c.taken_timestamp), 
                    "value": c.taken_timestamp
                }, 
                {
                    "display": UIPlayerLink({
                        "playerId": c.taken_player, 
                        "name": UISpan(grabPlayer.name, getTeamFont(grabPlayer.team)), 
                        "country": grabPlayer.country,
                    }), 
                    "value": grabPlayer.name.toLowerCase()
                }, 
                {"display": ignore0(c.total_drops), "value": c.total_drops},
                {"display": ignore0(c.total_covers), "value": c.total_covers},
                {"display": kills, "value": c.red_kills + c.blue_kills},
                {"display": suicides, "value": c.red_suicides + c.blue_suicides},
                {
                    "display": UIPlayerLink({
                        "playerId": c.cap_player, 
                        "name": UISpan(capPlayer.name, getTeamFont(capPlayer.team)), 
                        "country": capPlayer.country
                    }), 
                    "value": capPlayer.name.toLowerCase()
                }, 
                {"display": UIMMSS(c.cap_timestamp), "value": c.cap_timestamp},
                {"display": toPlaytime(c.cap_time, true), "value": c.cap_time, "className": "playtime"},
                {"display": scores, "value":teamScores[0] + teamScores[1]}
            ]);
        }

        const table = new TESTUITable(this.content, tableOptions, data);

    }

    render(){

        this.content.innerHTML = "";
        this.updateButtonsWrapper();

        if(this.mode === "detailed"){

            this.content.className = "ctf-cap";
            this.createCapWrapper();
            this.renderDetailedCap();

        }else if(this.mode === "basic"){

            this.content.className = "";
            this.renderBasicCaps();
        }
    }
}


class MatchWeaponSummary{

    constructor(parent, weaponStats, playerData, totalTeams, matchLength){

        this.parent = document.querySelector(parent);
        this.weaponStats = weaponStats;
        this.playerData = playerData;
        this.totalTeams = totalTeams;
        this.matchLength = matchLength;

        this.wrapper = UIDiv(`scroll-x t-width-1 center`);

        UIHeader(this.parent, "Weapons Summary");
        this.currentMode = "kills";

        this.createTabs();


        this.table = new TESTUITable(this.wrapper, {"className": "t-width-1"}, []);

        this.parent.append(this.wrapper);

        this.render();

       
    }

    createTabs(){

        const options = [
            {"display": "Kills", "value": "kills"},
            {"display": "Deaths", "value": "deaths"},
            {"display": "Suicides", "value": "suicides"},
            {"display": "Totals", "value": "totals"},
        ];


        this.tabs = new UITabs(this.parent, options, this.currentMode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{

            this.currentMode = e.detail.newTab;
            this.render();
        });
    }

    getImage(targetImage){

        if(this.weaponStats.images[targetImage] !== undefined) return this.weaponStats.images[targetImage];
        return "blank";

    }


    getPlayerWeaponStat(type, playerId, weaponId){

        playerId = parseInt(playerId);
        weaponId = parseInt(weaponId);

        for(let i = 0; i < this.weaponStats.data.length; i++){

            const w = this.weaponStats.data[i];

            if(w.player_id !== playerId) continue;
            if(w.weapon_id !== weaponId) continue;
        
            return w[type];

        }

        return 0;
    }


    bAnyEventData(playerId){

        const data = {"bAllZero": true};
        for(const [weaponId, weaponName] of Object.entries(this.weaponStats.names)){

            if(weaponName === "All") continue;

            const statValue = this.getPlayerWeaponStat(this.currentMode, playerId, weaponId);

            if(statValue !== 0) return true;
        }

        return false;
    }

    renderStatType(){

        if(this.currentMode === "totals") return;

        const headers = [{"display": "Player"}];
        const footers = [{"display": "Totals"}];

        for(const [weaponId, weaponName] of Object.entries(this.weaponStats.names)){

            if(weaponName === "All") continue;

            const weaponImage = this.getImage(weaponName);

            if(weaponImage !== "blank"){

                const img = document.createElement("img");
                img.src = `/images/weapons/${weaponImage}.png`;
                img.className = "weapon-icon"; 
                img.title = weaponName;
   
                headers.push({"display": img, "className": "team-none"});
                
            }else{
               headers.push({"display": weaponName.toUpperCase(), "className":"tiny-font white team-none" });
            }      

            footers.push({"display": "SUM", "dataType": "INT", "callback": ignore0});
        }
        
        const rows = [];

        for(const [playerId, player] of Object.entries(this.playerData)){

            if(player.bSpectator) continue;


            if(!this.bAnyEventData(playerId)) continue;

            const row = [];

            row.push({
                "display": UIPlayerLink({
                    "playerId": playerId, 
                    "name": player.name, 
                    "country": player.country, 
                    "bTableElem": true,
                    "className": (this.totalTeams < 2) ? "" : getTeamColorClass(player.team)
                }), 
                "value": player.name.toLowerCase(),
                "bSkipTD": true
            });

            for(const [weaponId, weaponName] of Object.entries(this.weaponStats.names)){

                if(weaponName === "All") continue;
                const statValue = this.getPlayerWeaponStat(this.currentMode, playerId, weaponId);
                row.push({"display": ignore0(statValue), "value": statValue, "parse": ["ignore0"]});
            }

            rows.push(row);
        }    

        this.table.updateRows(rows, headers, footers);   
    }

    getWeaponTotalStats(weaponId){

        weaponId = parseInt(weaponId);

        const totals = {
            "teamKills": 0,
            "suicides": 0,
            "deaths": 0,
            "kills": 0,
            "kpm": 0
        };

        for(let i = 0; i < this.weaponStats.data.length; i++){

            const w = this.weaponStats.data[i];

            if(w.weapon_id !== weaponId) continue;

            totals.teamKills += w.team_kills;
            totals.suicides += w.suicides;
            totals.deaths += w.deaths;
            totals.kills += w.kills;
        }

        if(totals.kills > 0 && this.matchLength > 0){
            totals.kpm = totals.kills / (this.matchLength / 60);
        }

        return totals;
    }

    renderTotals(){

        if(this.currentMode !== "totals") return;

        const headers = ["Weapon", "Team Kills", "Suicides", "Deaths", "Kills", "KPM"].map((h) =>{
            return {"display": h}
        });

        const footer = [
            {"display": "Totals"},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "SUM", "dataType": "FLOAT", "callback": (v) => `${parseFloat(v).toFixed(2)}`},
        ];

        const rows = [];

        for(const [weaponId, weaponName] of Object.entries(this.weaponStats.names)){

            if(weaponName === "All") continue;

            const wStats = this.getWeaponTotalStats(weaponId);

            const row = [
                {"display": weaponName, "value": weaponName.toLowerCase(), "className": "text-left team-none"},
                {"display": ignore0(wStats.teamKills), "value": wStats.teamKills},
                {"display": ignore0(wStats.suicides), "value": wStats.suicides},
                {"display": ignore0(wStats.deaths), "value": wStats.deaths},
                {"display": ignore0(wStats.kills), "value": wStats.kills},
                {"display": wStats.kpm.toFixed(2), "value": wStats.kpm}
            ];


            rows.push(row);
        }

        this.table.updateRows(rows, headers, footer);

    }

    render(){

        this.renderStatType();
        this.renderTotals();
   
    }
}

class MatchClassicWeaponStats{

    constructor(parent, data, weaponNames, players, totalTeams){

        if(data.length === 0) return;

        this.parent = document.querySelector(parent);
        this.data = data;
        this.weaponNames = weaponNames;
        this.players = players;
        this.totalTeams = totalTeams;

        this.currentWeapon = 0;

        UIHeader(parent, "Classic Weapon Stats");

        this.createTabs();

        this.render();
    }

    createTabs(){

        const options = [];

        for(const [id, name] of Object.entries(this.weaponNames)){

            if(id == 0) continue;

            const testTotals = this.getWeaponTotals(parseInt(id));


            const totalValue = Object.values(testTotals).reduce((total, currentValue) => { return total + Math.abs(currentValue)});

            if(totalValue === 0) continue;
            options.push({"display": name, "value": parseInt(id)});
        }

        options.sort((a, b) =>{
            a = a.display.toLowerCase();
            b = b.display.toLowerCase();

            if(a < b) return -1;
            if(a > b) return 1;
            return 0;
        });

        let selected = options?.[0].value ?? 0;
        this.currentWeapon = parseInt(selected);

        this.tabs = new UITabs(this.parent, options, this.currentWeapon);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{
            this.currentWeapon = parseInt(e.detail.newTab);
            this.render();
        });
    }


    getWeaponTotals(weaponId){

        const totals = {
            "kills": 0,
            "deaths": 0,
            "shots": 0,
            "hits": 0,
            "damage": 0,
            "accuracy": 0 
        };

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(d.weapon_id !== weaponId) continue;

            totals.kills += d.kills;
            totals.deaths += d.deaths;
            totals.shots += d.shots;
            totals.hits += d.hits;
            totals.damage += d.damage;
        }


        if(totals.shots > 0 && totals.hits > 0){
            totals.accuracy = (totals.hits / totals.shots) * 100;
        }

        return totals;
    }

    render(){

    
        const headers = ["Player", "Kills", "Deaths", "Shots", "Hits", "Accuracy", "Damage"];

        const tableOptions = {
            "className": "t-width-1",
            "headers": headers.map((h) =>{ return{"display": h}})
        };

        const footer = [
            {"display": "Total | AVG"},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": `${this.getWeaponTotals(this.currentWeapon).accuracy.toFixed(2)}%`},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
        ];


        const rows = [];

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(d.weapon_id !== this.currentWeapon) continue;

            const player = getPlayer(this.players, d.player_id);

            const row = [
                {
                    "bSkipTD": true,
                    "display": UIPlayerLink({
                        "playerId": d.player_id, 
                        "name": player.name, 
                        "country": player.country, 
                        "bTableElem": true,
                        "className": (this.totalTeams >= 2) ? getTeamColorClass(player.team) : "team-none",
                    }),
                    "value": player.name.toLowerCase()
                },
                {"display": ignore0(d.kills), "value": d.kills},
                {"display": ignore0(d.deaths), "value": d.deaths},
                {"display": ignore0(d.shots), "value": d.shots},
                {"display": ignore0(d.hits), "value": d.hits},
                {"display": `${d.accuracy.toFixed(2)}%`, "value": d.accuracy},
                {"display": ignore0(d.damage), "value": d.accuracy},
            ];
            rows.push(row);
        }

        if(this.table === undefined){
            tableOptions.footer = footer;
            this.table = new TESTUITable(this.parent, tableOptions, rows);
        }else{

            this.table.updateRows(rows, tableOptions.headers, footer);
        }
    }
}


function renderMatchPings(parent, players, totalTeams){

    const parentElem = document.querySelector(parent);
    UIHeader(parent, "Player Ping Summary");

    const headers = ["Player", "Min", "Average", "Max"].map((h) =>{ return {"display": h}})
    const footer = [
        {"display": "Average"},
        {"display": "AVG", "dataType": "FLOAT"},
        {"display": "AVG", "dataType": "FLOAT"},
        {"display": "AVG", "dataType": "FLOAT"}
    ];

    const rows = [];

    for(let i = 0; i < players.length; i++){

        const p = players[i];
        if(p.spectator) continue;

        const row = [
            {
                "bSkipTD": true, 
                "display": UIPlayerLink({
                    "playerId": p.player_id,
                    "name": p.name, 
                    "country": p.country, 
                    "bTableElem": true,
                    "className": (totalTeams >= 2) ? getTeamColorClass(p.team) : "team-none"
                }),
                "value": p.name.toLowerCase()
            },
            {"value":p.ping_min},
            {"value":p.ping_avg},
            {"value":p.ping_max}
        ];

        rows.push(row);
    }

    new TESTUITable(parentElem, {"className": "t-width-2", headers, footer}, rows);
}


class MatchKillsMatchUp{

    constructor(parent, kills, players, totalTeams){

        this.parent = document.querySelector(parent);

        UIHeader(parent, "Kills Match Up");

        this.table = document.createElement("table");
        this.createPlayers(players);

        this.kills = kills;
        this.totalTeams = totalTeams;

        this.parent.appendChild(this.table);

        this.render();
    }

    createPlayers(players){

        this.players = [];

        for(const [playerId, player] of Object.entries(players)){
            if(player.bSpectator) continue;
            player.id = parseInt(playerId);
            this.players.push({...player});
        }

        this.players.sort((a, b) =>{

            if(a.team < b.team) return -1;
            if(a.team > b.team) return 1;

            let aN = a.name.toLowerCase();
            let bN = b.name.toLowerCase();

            if(aN < bN) return -1;
            if(aN > bN) return 1;
            return 0;
        });
    }


    getTotalKills(killer, victim){

        let totalKills = 0;

        for(let i = 0; i < this.kills.length; i++){

            const k = this.kills[i];

            if(k.killer_id === killer && k.victim_id === victim) totalKills++;
        }


        return totalKills;
    }


    render(){

        this.table.innerHTML = "";

        const headerRow = document.createElement("tr");

        headerRow.appendChild(UITableHeaderColumn({"content": ""}));

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            headerRow.appendChild(UIPlayerLink({
                "playerId": p.id, 
                "name": ` ${p.name}`, 
                "country": p.country,
                "bTableElem": true, 
                "bHeaderElem": true, 
                "className": `vertical-text white text-left ${(this.totalTeams >= 2) ? getTeamColorClass(p.team) : "team-none"}`
            }));
    
        }
        this.table.appendChild(headerRow);


        for(let i = this.players.length - 1; i >= 0; i--){

            const p = this.players[i];

            const row = document.createElement("tr");

            row.appendChild(UIPlayerLink({
                "playerId": p.id, 
                "name": p.name, 
                "country": p.country,
                "className": `text-left ${(this.totalTeams >= 2) ? getTeamColorClass(p.team) : "team-none"}`,
                "bTableElem": true
            }));

            for(let x = 0; x < this.players.length; x++){

                row.appendChild(UITableCell({
                    "content": this.getTotalKills(p.id, this.players[x].id), 
                    "parse": ["ignore0"],
                    "className": (p.id === this.players[x].id) ? "team-none" : ""
                }));
            }

            this.table.appendChild(row);
        }
    }
}

class MatchItemsSummary{

    constructor(parent, playerData, totalTeams){

        this.parent = document.querySelector(parent);
        this.playerData = playerData;
        this.totalTeams = totalTeams;

        this.headers = {
            "player": {"display": "Player"},
            "body": {"display": "Body Armour"},
            "pads": {"display": "Thigh Pads"},
            "shp": {"display": "Super Health Pack"},
            "invis": {"display": "Invisibility"},
            "belt": {"display": "Shield Belt"},
            "amp": {"display": "Damage Amp"},
            "boots": {"display": "Jump Boots"},
        };

        if(!this.bAnyData()) return;

        UIHeader(parent, "Items Summary");
     
        
        this.render();
    }

    bAnyData(){

        for(let i = 0; i < this.playerData.length; i++){

            const p = this.playerData[i];

            if(this.bPlayerAnyData(p)) return true;
        }

        return false;
    }

    bPlayerAnyData(player){

        const keys = Object.keys(this.headers);

        keys.splice(0, 1);

        for(let i = 0; i < keys.length; i++){

            if(player[`item_${keys[i]}`] > 0) return true;
        }

        return false;
    }

    render(){

        const headers = Object.values(this.headers);

        const rows = [];

        for(let i = 0; i < this.playerData.length; i++){

            const p = this.playerData[i];

            if(!this.bPlayerAnyData(p)) continue;

            const row = [
                {
                    "bSkipTD": true, 
                    "value": p.name.toLowerCase(), 
                    "display": UIPlayerLink({
                        "playerId": p.player_id, 
                        "name": p.name, 
                        "country": p.country, 
                        "bTableElem": true, 
                        "className": (this.totalTeams < 2) ? "team-none" : getTeamColorClass(p.team)
                    })
                }
            ];

            for(const columnName of Object.keys(this.headers)){

                if(columnName === "player") continue;

                row.push({
                    "value": p[`item_${columnName}`], 
                    "display": ignore0(p[`item_${columnName}`])
                });
            }

            rows.push(row);
        }

        if(this.table === undefined){

            const footer = [
                {"display": "Total"}
            ];

            for(let i = 1; i <headers.length; i++){
                footer.push({"display": "SUM", "callback": ignore0, "dataType": "INT"});
            }

            this.table = new TESTUITable(this.parent, {"className": "t-width-1", headers, footer}, rows);
        }else{

            this.table.updateRows(rows);
        }
    }
}


class MatchDamageSummary{

    constructor(parent, playerData, totalTeams){

        this.parent = document.querySelector(parent);
        this.players = playerData;
        this.totalTeams = totalTeams;

        if(!this.bAnyData()) return;

        UIHeader(parent, "Damage Summary");

        this.render();
    }

    bAnyData(){

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];
            if(p.damage !== undefined) return true;
        }

        return false;
    }

    createRow(player){

       const damageTypes = ["fallDamage", "drownDamage", "selfDamage", "damageTaken", "damageDelt"];
       const teamDamageTypes = ["teamDamageTaken", "teamDamageDelt"];

       const row = [
        {
            "bSkipTD": true, 
            "value": player.name.toLowerCase(),
            "display": UIPlayerLink({
                "playerId": player.player_id, 
                "name": player.name, 
                "country": player.country, 
                "bTableElem": true,
                "className": (this.totalTeams < 2) ? "team-none" : getTeamColorClass(player.team)
            })
        }];

        for(let i = 0; i < damageTypes.length; i++){

            const t = damageTypes[i];
            row.push({"display": ignore0(player.damage[t]), "value": player.damage[t]});
        }


        if(this.bAnyTeamDamage()){

            for(let i = 0; i < teamDamageTypes.length; i++){

                const t = teamDamageTypes[i];
                row.push({"display": ignore0(player.damage[t]), "value": player.damage[t]});
            }

        }

        return row;
    }


    bAnyTeamDamage(){

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.damage === undefined) continue;

            if(p.damage.teamDamageDelt > 0 || p.damage.teamDamageTaken > 0) return true;
        }

        return false;
    }

    render(){

        const headers = [
            "Player",
            "Fall Damage",
            "Drown Damage",
            "Self Damage",
            "Damage Taken",
            "Damage Delt"
        ];

        const footer = [
            {"display": "Total"},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
            {"display": "SUM", "dataType": "INT", "callback": ignore0},
        ];

        if(this.bAnyTeamDamage()){
            headers.push("Team Damage Taken","Team Damage Delt");

            footer.push(
                {"display": "SUM", "dataType": "INT", "callback": ignore0},
                {"display": "SUM", "dataType": "INT", "callback": ignore0}
            );
        }

        const rows = [];

        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.spectator || p.damage === undefined) continue;

            rows.push(this.createRow(p));
        }

        if(this.table === undefined){

            this.table = new TESTUITable(
                this.parent, 
                {"className": "t-width-1", footer, "headers": headers.map((h) =>{ return {"display": h}})}, 
                rows);
        }else{
            this.table.updateRows(rows,null, footer);
        }
    }
}


class MatchKillsGraph{

    constructor(parent, matchInfo, playerData){

        this.parent = document.querySelector(parent);
        this.matchInfo = matchInfo;
        this.players = playerData;
        this.timeframe = 15;
        this.data = {"kills": {}, "teamKills": {}};

        this.wrapper = UIDiv("graph-wrapper");
        UIHeader(this.wrapper, "Match Frags Graph");
        this.parent.append(this.wrapper);
        this.loadData();
    }

    async loadData(){

        try{

            let urlParts = `?id=${this.matchInfo.id}`;
            urlParts += `&start=${this.matchInfo.match_start}`;
            urlParts += `&timeframe=${this.timeframe}`;

            const req = await fetch(`/json/match-kills-graph/${urlParts}`);

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            this.data = res;

            this.createGraph();

        }catch(err){
            console.trace(err);
            new UINotification(this.parent, "error", "Failed To Load Match Kills Graph Data", err.toString());
        }
    }

    updatePlayerValue(players, playerId, totalEvents){

        playerId = parseInt(playerId);

        for(let i = 0; i < players.length; i++){

            const p = players[i];

            if(p.playerId === playerId){

                const previousValue = p.values[p.values.length - 1];

                p.values.push(previousValue + totalEvents);
                return;
            }
        }    
    }

    appendPreviousData(players){

        for(let i = 0; i < players.length; i++){

            const p = players[i];

            p.values.push(p.values[p.values.length - 1]);
        }
    }

    createGraphData(type, bFetchDeaths){

        const data = [];

        for(const p of Object.values(this.players)){

            data.push({"name": p.name, "playerId": p.id, "values": [0]});
        }

        let events = [];

        if(type === "kills"){

            events = this.data.kills[(bFetchDeaths) ? "deaths" : "kills"];

        }else if(type === "teamKills"){
            events = this.data.teamKills[(bFetchDeaths) ? "deaths" : "kills"];
        }

        for(let i = 0; i < this.totalDataPoints; i++){

            if(events[i] === undefined){
                //no new data at this point, append the previous data again for each player to values
                this.appendPreviousData(data);
                continue;
            }else{

                for(const playerId of Object.keys(this.players)){

                    this.updatePlayerValue(data, playerId, events[i]?.[playerId] ?? 0);
                    
                }

            }
        }
        return data;
    }


    createLabels(){

        const labels = [];

        labels.push("Match Start");
        for(let i = 0; i < this.totalDataPoints; i++){

            labels.push(MMSS((1 + i) * this.timeframe));
        }

        return labels;
    }

    createGraph(){
        

        this.canvas = document.createElement("canvas");
        this.wrapper.append(this.canvas);

        const abortController = new AbortController();

        const tabs = [
            {"name": "Kills", "title": "Player Kills"}, 
            {"name": "Deaths", "title": "Player Deaths By Enemy"},
            {"name": "Team Kills", "title": "Player Team Kills"}, 
            {"name": "Team Deaths", "title": "Player Deaths By Team Kills"},
        ];

        
        this.totalDataPoints = Math.ceil(this.matchInfo.playtime / this.timeframe);

        this.createGraphData();

        const labels = this.createLabels();

        const data = {
            "data": [
                this.createGraphData("kills", false), 
                this.createGraphData("kills", true),
                this.createGraphData("teamKills", false),
                this.createGraphData("teamKills", true)
            ],
            "labels": [
                [...labels],
                [...labels],          
                [...labels],          
                [...labels]          
            ],
            "labelsPrefix": [
                "Player Kills @ ", 
                "Player Deaths @ ",
                "Player Team Kills @ ",
                "Player Team Deaths @ ",
            ]
        };

        this.graph = new Graph(
            this.canvas, 
            abortController, 
            1920, 
            1080, 
            tabs,
            true,
            data, 
            0
        );
    }
}



function matchJSONCopyToClipboard(url, copyElems){

    const cssClass = "json-api-link-clipboard";

    let bLoadingData = false;
    let data = null;

    const elem = UIDiv(cssClass);
    elem.append("Copy JSON To Clipboard");
    let abortController = new AbortController();

    function resetAll(){

        for(let i = 0; i < copyElems.length; i++){

            const e = copyElems[i];
                e.elem.className = "json-api-link-clipboard";
                e.elem.innerHTML = "Copy JSON to Clipboard";
                e.abortDownload();
           
            
        }
    }
    
    elem.addEventListener("click", async () =>{
        

        try{

            if(!abortController){
                abortController = new AbortController();
            }else{
                abortController.abort("Cancelled");
            }

            if(bLoadingData){
                console.log(`already loading data`);
                return;
            }

            resetAll();


            //dont want to fetch every time we click
            if(data !== null){
                elem.className = `${cssClass} team-green`;
                elem.innerHTML = "Copied";
                return;
            }


            bLoadingData = true;

            elem.className = `${cssClass} team-yellow`;
            elem.innerHTML = `Fetching Data`;

            const req = await fetch(url, {"signal": abortController.signal});
            const res = await req.json();

            data = JSON.stringify(res);
            await navigator.clipboard.writeText(data);

            elem.className = `${cssClass} team-green`;
            elem.innerHTML = "Copied";

        }catch(err){

            if(err.name !== "AbortError"){
                elem.className = `${cssClass} team-red`;
                elem.innerHTML = "Failed to Copy Data";
                console.trace(err);
            }

            abortController = new AbortController();
        }finally{
            bLoadingData = false;
        }
    });

    return {
        elem,
        bLoadingData,
        "abortDownload": () =>{
            abortController.abort();
            abortController = new AbortController();
        }
    };
}

function matchAPILink(title, url, content, copyElem, displayUrl){

    const elem = UIDiv("json-api-link");

    const titleLink = UIA(title, url, "_blank");
    titleLink.className = "json-api-link-title";

    const contentWrapper = UIDiv("json-api-link-content");
    contentWrapper.append(...content);

    const linkElem = UIDiv();
    linkElem.className = "json-api-link-clipboard";
    linkElem.addEventListener("click", async () =>{

        try{
            await navigator.clipboard.writeText(displayUrl);
        }catch(err){
            console.trace(err);
        }
    });
    linkElem.append("Copy URL to Clipboard");
    
    elem.append(titleLink, contentWrapper, linkElem, copyElem);
    return elem;
}

class MatchJSONApiInfo{

    constructor(parent, matchHash, bCTF){

        this.parent = document.querySelector(parent);
        this.matchHash = matchHash;
        this.bCTF = bCTF;

        this.wrapper = UIDiv("json-api-links-wrapper");
        UIHeader(this.parent, "Match JSON API Links");
        this.parent.append(this.wrapper);

        this.lastCopiedDataURL = null;

        this.copyElems = [];

        this.render();
    }

    createElem(urlBase, displayUrlBase, command, title, info){

        const url = `${urlBase}${command}?id=${this.matchHash}`
        const displayUrl = `${displayUrlBase}${command}?id=${this.matchHash}`
        info.push(UIBr());
        info.push(UIA(displayUrl, url, "_blank"));

        const copyElem = matchJSONCopyToClipboard(url, this.copyElems);

        const elem = matchAPILink(
            title, 
            url,
            info,
            copyElem.elem,
            displayUrl
        );
        
        this.wrapper.append(elem);

        this.copyElems.push(copyElem);
        
    }

    render(){
        
        const urlBase = `/api/json/match/`;
        const displayBase = `${window.location.host}${urlBase}`;

    
        this.createElem(
            urlBase,
            displayBase,
            "basic",
            "Basic Match Info",    
            [ 
                `Fetch basic data such as server, gametype, map names, playtime, total players, total teams, match date, hash, and match result.`,
            ]
        );

        this.createElem(
            urlBase,
            displayBase,
            "detailed",
            "Detailed Match Info",    
            [ 
               `Same as Basic Match Info, but includes more info such as mutators, 
                gamespeed, real gamespeed, bTournamentMode, bHardcore, time limit, target score, 
                match start, and match end timestamps. `
            ]
        );

        if(this.bCTF){
            this.createElem(
                urlBase,
                displayBase,
                "ctf-ladder",
                "CTF Comp/Ladder",
                [ 
                    `Basic Match info and player data that can be used for write ups.`,
                ]
                
            );

            this.createElem(
                urlBase,
                displayBase,
                "ctf",
                "CTF Data",
                [ 
                    `Returns flag captures, team ctf totals and player ctf totals.`,
                ]
                
            );
        }
        
        this.createElem(
            urlBase,
            displayBase,
            "players-basic",
            "Players Basic",
            [
                `Returns player list with name, country, permaHash, score, frags, kills, and match result.`
            ]
        );

        this.createElem(
            urlBase,
            displayBase,
            "players-full",
            "Players Full",
            [
                `Returns player list with full stats for frags, special events, weapon stats, item stats, damage stats, and ctf/domination if applicable.`
            ]
        );

        this.createElem(
            urlBase,
            displayBase,
            "kills-basic",
            "Basic Kills",
            [
                `Returns player list with full stats for frags, special events, weapon stats, item stats, damage stats, and ctf/domination if applicable.`
            ]
        );

        this.createElem(
            urlBase,
            displayBase,
            "kills-detailed",
            "Detailed Kills",
            [
                `Returns an array of every kill and team kill event but includes the weapons the killer and victim had at the time.`,
                UIBr(), 
                `Returns a killsMatchUp object that list every killer -> victim stats.`,
                UIBr(), 
                `Players totals(same as kills-basic).`
             ]
        );


        new UIInfo(this.wrapper, [UIA("JSON API Examples", `/jsonexamples/?mode=match`,"_blank")]);
    }
}

class MatchPlayerWeaponDamage{

    constructor(parent, matchId, players, weaponNames){

        this.parent = document.querySelector(parent);
        this.matchId = matchId;
        this.weaponNames = weaponNames;
        this.players = players;
        this.selectedWeapon = 0;

        this.wrapper = new UISection(this.parent, "Player Weapon Damage");
        
        this.loadData();
    }


    bAnyData(weaponId){

        for(let i = 0; i < this.weaponData.length; i++){

            const id = this.weaponData[i].weapon_id;

            if(id == weaponId) return true;
        }

        return false;
    }
    createTabs(){

        const options = [];

        for(const [id, name] of Object.entries(this.weaponNames)){

            if(this.bAnyData(id) || id == 0){
                options.push({"value": id, "display": name});
            }
        }

        if(options.length >= 0){
            this.selectedWeapon = options[0].value;
        }

        this.tabs = new UITabs(this.wrapper.elem, options, this.selectedWeapon);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{

            this.selectedWeapon = parseInt(e.detail.newTab);
        
            this.render();
        });
    }

    async loadData(){

        try{

            const req = await fetch(`/json/match-test-weapon-damage/?id=${this.matchId}`);

            const res = await req.json();

            this.weaponData = res;
            this.createTabs();

        }catch(err){
            console.trace(err);
        }finally{

            this.render();
        }
    }

    render(){


        if(this.weaponData.length === 0){
            this.wrapper.elem.className = "hidden";
            return;
        }

        const footer =  [
                {"display": "Total"},
                {"display": "SUM", "dataType": "INT"}
            ];

        const tableOptions = {
            "className": "t-width-4",
            "sortBy": 1,
            "bAscOrder": false,
            "headers": [
                {"display": "Player"},
                //{"display": "Weapon"},
                {"display": "Damage"},
            ],
            footer
        };

        const rows = [];

        for(let i = 0; i < this.weaponData.length; i++){

            const d = this.weaponData[i];

            if(d.weapon_id != this.selectedWeapon) continue;

            const player = this.players[d.player_id] ?? {"name": "Not Found", "team": 255};
            const weapon = this.weaponNames[d.weapon_id] ?? "Not Found";

            rows.push([
                {
                    "display": UIPlayerLink({
                        "playerId": player.id, 
                        "name": player.name, 
                        "country": player.country, 
                        "bTableElem": true,
                        "className": getTeamColorClass(player.team),
                    }),
                    "value": player.name.toLowerCase(), 
                    
                    "bSkipTD": true
                },
             //   {"display": weapon, "value": weapon.toLowerCase()},
                {"display": ignore0(d.damage), "value": d.damage}

            ]);
            
        }


        if(this.table === undefined){
            this.table = new TESTUITable(this.wrapper.elem, tableOptions, rows);
        }else{

            this.table.updateRows(rows, tableOptions.headers, footer, 1);
        }
    }
}



class MatchPlayerPersonalBests{

    constructor(parent, type, playersMatchData, playerAverages, totalTeams){

        this.parent = document.querySelector(parent);

        if(!this.bValidType(type)) throw new Error(`Not a valid type for matchPlayerPersonalBests`); 

        this.type = type;
        this.playersMatchData = playersMatchData;
        this.playerAverages = playerAverages;
        this.totalTeams = totalTeams;

        this.wrapper = UIDiv("margin-bottom-1");
        this.content = UIDiv();
        UIHeader(this.wrapper, "Player Match Records");
        this.wrapper.append(this.content);
        this.parent.append(this.wrapper);

        

        this.setDataTargets();

        this.render();

    }


    setDataTargets(){

        //h higher is better
        //l higher is worse

        this.dataTargets = {
            "frags": {
                "max_playtime": { "display": "Longest Playtime", "type": "h", "matchColumn": "time_on_server"},
                "max_score": { "display": "Highest Score", "type": "h"},
                "max_frags": { "display": "Most Frags", "type": "h"},
                "max_kills": { "display": "Most Kills", "type": "h"},
                "max_deaths": { "display": "Most Deaths", "type": "l"},
                "max_suicides": { "display": "Most Suicides", "type": "l"},
                "max_team_kills": { "display": "Most Team Kills", "type": "l"},
                "max_spree_1": { "display": "Most Killing Sprees", "type": "h"},
                "max_spree_2": { "display": "Most Rampages", "type": "h"},
                "max_spree_3": { "display": "Most Dominatings", "type": "h"},
                "max_spree_4": { "display": "Most Unstoppables", "type": "h"},
                "max_spree_5": { "display": "Most Godlikes", "type": "h"},
                "max_spree_best": { "display": "Best Single Killing Spree", "type": "h"},
                "max_multi_1": { "display": "Most Double Kills", "type": "h"},
                "max_multi_2": { "display": "Most Multi Kills", "type": "h"},
                "max_multi_3": { "display": "Most Ultra Kills", "type": "h"},
                "max_multi_4": { "display": "Most Monster Kills", "type": "h"},
                "max_multi_best": { "display": "Best Single Multi Kill", "type": "h"},
                "max_headshots": { "display": "Most Headshots", "type": "h"},
                "max_item_amps": { "display": "Most UDamage Pickups", "type": "h"},
                "max_item_belt": { "display": "Most Shield Belt Pickups", "type": "h"},
                "max_item_boots": { "display": "Most Jump Boots Pickups", "type": "h"},
                "max_item_body": { "display": "Most Body Armor Pickups", "type": "h"},
                "max_item_pads": { "display": "Most Thigh Pads Pickups", "type": "h"},
                "max_item_invis": { "display": "Most Invisibility Pickups", "type": "h"},
                "max_item_shp": { "display": "Most Super Health Pickups", "type": "h"},
                "max_dom_caps": { "display": "Most Domination Caps", "type": "h"},
            }
        };

    }

    bValidType(type){

        const valid = ["frags", "ctf"];
        
        return valid.indexOf(type) !== -1;
    }


    checkAgainstRecords(matchData, playerAverages){

        const pbs = [];

        const reg = /^max_(.+)$/i;

        for(const [maxColumn, info] of Object.entries(this.dataTargets[this.type])){

            const {display, type, matchColumn} = info;


            if(matchColumn !== undefined){

                if(type === "h"){

                    if(matchData[matchColumn] >= playerAverages[maxColumn]){
                        pbs.push({"display": display, "value": matchData[matchColumn], "bBad": false});
                    }

                }else if(type === "l"){

                    if(matchData[matchColumn] >= playerAverages[maxColumn]){
                        pbs.push({"display": display, "value": matchData[matchColumn], "bBad": true});
                    }
                }

                
                continue;
            }

            const regResult = reg.exec(maxColumn);

            if(regResult === null){
                console.warn(`checkAgainstPB regResult failed`);
                continue;
            }

            const targetColumn = regResult[1];

            if(matchData[targetColumn] === 0) continue;

            if(type === "h"){

                if(matchData[targetColumn] >= playerAverages[maxColumn]){
                    pbs.push({"display": display, "value": matchData[targetColumn], "bBad": false});
                }

            }else if(type === "l"){
                
                if(matchData[targetColumn] >= playerAverages[maxColumn]){
                    pbs.push({"display": display, "value": matchData[targetColumn], "bBad": true});
                }
            }else{
                console.log("SIGH");
            }
        }


        return pbs;
    }


    renderPlayerRecords(matchData, records){

        const wrapper = UIDiv(`player-record-wrapper`);

        const nameDiv = UIDiv(`player-record-name ${getTeamColorClass((this.totalTeams > 1) ? matchData.team: 255)}`);

        nameDiv.append(UICountryFlag(matchData.country));

        const a = UIA(matchData.name, `/match/${matchData.player_id}`);
        nameDiv.append(a);


        wrapper.append(nameDiv);

        const list = UIDiv("record-list");

        for(let i = 0; i < records.length; i++){

            const r = records[i];

            
            let displayValue = r.value;

            if(r.display === "Longest Playtime"){
                displayValue = MMSS(r.value);
            }

            const elem = UIDiv(`${(r.bBad) ? "record-bad" : "record-good"}`);

            const titleElem = UIDiv("record-title");
            const valueElem = UIDiv("record-value");

            titleElem.append(r.display);
            valueElem.append(displayValue);

            elem.append(titleElem, valueElem);

 
            list.append(elem);
         

        }

        wrapper.append(list);

        this.content.append(wrapper);


    }

    render(){

        this.content.className = "players-records";
        this.content.innerHTML = ``;


       

        for(let i = 0; i < this.playersMatchData.length; i++){

            const md = this.playersMatchData[i];
            if(md.bSpectator || md.time_on_server === 0) continue;
            const pa = this.playerAverages[md.player_id] ?? null;

            if(pa === null){
                console.warn(`Failed to find player averages/best`);
                continue;
            }

            const records = this.checkAgainstRecords(md, pa);

            if(records.length === 0) continue;


            this.renderPlayerRecords(md, records);


        }

    }
}