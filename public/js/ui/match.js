
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

    const header = UIDiv("header-wrapper");
    header.innerHTML = `${data.gametype_name} on ${data.map_name}`;

    if(data.solo_winner !== 0){

        const p = getPlayer(players, data.solo_winner);
        data.solo_winner_name = p.name;
    
    }
 
    UIMatchScoreBox(wrapper, data, false, false, players);
  
    parent.appendChild(header);


    const infoElems = UIDiv("match-basic-info-wrapper-info");

    infoElems.append(UIMBInfo("Date", toDateString(data.date, false, false)));
    infoElems.append(UIMBInfo("Match Length", toPlaytime(data.playtime)));
    infoElems.append(UIMBInfo("Players", data.players));

    if(data.target_score !== 0){
        infoElems.append(UIMBInfo("Target Score", data.target_score));
    }

    if(data.time_limit !== 0){
        infoElems.append(UIMBInfo("Time Limit", data.time_limit));
    }


    infoElems.append(UIMBInfo("Gamespeed", `${data.gamespeed_real}%`));
    infoElems.append(UIMBInfo("Tournament Mode", `${(data.tournament_mode === 1) ? "True" : "False"}`));
    infoElems.append(UIMBInfo("Server",  data.server_name));
    infoElems.append(UIMBInfo("Mutators", data.mutators));

    wrapper.append(infoElems);

    const pLinks = UIDiv("perma-links");

    new UIWatchlistButton(pLinks, "matches", data.hash);

    new UICopyURLToClipboard(pLinks, "Copy Match Perma Link To Clipboard", `/match/${data.hash}`);
    wrapper.append(pLinks);
    parent.append(wrapper);

}


function createFragTableRow(p, totalTeams, bTotals){

    const row = document.createElement("tr");

    const cols = [];

    let teamColorClass = "team-none";

    if(totalTeams >= 2){
        teamColorClass = getTeamColorClass(p.team);
    }

    if(!bTotals){
        cols.push(UIPlayerLink(
            {
                "playerId": p.player_id, 
                "name": p.name, 
                "country": p.country,  
                "bTableElem": true, 
                "className": `text-left ${teamColorClass}`
            }
        ));
    }else{
        cols.push(UITableCell({"content": "Totals", "className": "team-none"}));
    }


    cols.push(UITableCell({"content": p.time_on_server, "className": "playtime", "parse": ["playtime"]}));
    cols.push(UITableCell({"content": p.score, "parse": ["ignore0"]}));
    cols.push(UITableCell({"content": p.frags, "parse": ["ignore0"]}));
    cols.push(UITableCell({"content": p.kills, "parse": ["ignore0"]}));
    cols.push(UITableCell({"content": p.deaths, "parse": ["ignore0"]}));

    let net = p.kills - p.deaths;
    if(net > 0) net = `+${net}`;
    cols.push(UITableCell({"content": net}));

    cols.push(UITableCell({"content": p.suicides, "parse": ["ignore0"]}));
    cols.push(UITableCell({"content": p.team_kills, "parse": ["ignore0"]}));
    cols.push(UITableCell({"content": p.headshots, "parse": ["ignore0"]}));
    cols.push(UITableCell({"content": `${p.efficiency.toFixed(2)}%`}));
    cols.push(UITableCell({"content": p.ttl, "className": "playtime", "parse": ["mmss"]}));


    for(let x = 0; x < cols.length; x++){

        row.appendChild(cols[x]);
    }

    return row;
}

function renderFragsTables(parent, totalTeams, playerData){

    parent = document.querySelector(parent);

    const wrapper = document.createElement("div");

    const title = document.createElement("div");
    title.className = "header-wrapper";
    title.innerHTML = "Frags Summary";
    wrapper.appendChild(title);

    const headers = [
        "Player",
        "Playtime",
        "Score",
        "Frags",
        "Kills",
        "Deaths",
        "Net",
        "Suicides",
        "Team Kills",
        "Headshots",
        "Efficiency",
        "TTL"
    ];


    const tables = [];
    const totals = [];

    if(totalTeams < 2) totalTeams = 1;

    for(let i = 0; i < totalTeams; i++){

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

        const table = document.createElement("table");
        table.className = "t-width-1";
        const headerRow = document.createElement("tr");

        for(let x = 0; x < headers.length; x++){

            const col = document.createElement("th");
            col.innerHTML = headers[x];
            headerRow.appendChild(col);
        }

        table.appendChild(headerRow);
        tables.push(table);
    }


    for(let i = 0; i < playerData.length; i++){

        const p = playerData[i];
        if(p.spectator) continue;

        const row = createFragTableRow(p, totalTeams, false);

        let team = (totalTeams < 2) ? 0 : p.team;
       
        totals[team].time_on_server += p.time_on_server;
        totals[team].score += p.score;
        totals[team].frags += p.frags;
        totals[team].kills += p.kills;
        totals[team].deaths += p.deaths;
        totals[team].suicides += p.suicides;
        totals[team].team_kills += p.team_kills;
        totals[team].headshots += p.headshots;
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

        if(totalTeams >= 2 && team !== 255){
            tables[team].appendChild(row);
        }else if(totalTeams < 2){
            tables[0].appendChild(row);
        }
    }

    if(totalTeams < 2){

        tables[0].appendChild(createFragTableRow(totals[0], totalTeams, true))

    }else{

        for(let i = 0; i < totalTeams; i++){
            tables[i].appendChild(createFragTableRow(totals[i], totalTeams, true));
        }
    }

    for(let i = 0; i < tables.length; i++){
        wrapper.appendChild(tables[i]);
    }

    parent.appendChild(wrapper);
}


function createSpreeRow(player, totalTeams){

    const row = document.createElement("tr");

    let teamColorClass = (totalTeams < 2) ? "team-none" : getTeamColorClass(player.team);

    row.appendChild(UIPlayerLink({
        "playerId": player.player_id, 
        "className": `${teamColorClass} text-left`, 
        "country": player.country, 
        "bTableElem": true, 
        "name": player.name
    }));

    for(let i = 1; i < 6; i++){
        row.appendChild(UITableCell({"content": player[`spree_${i}`], "parse": ["ignore0"]}));
    }

    row.appendChild(UITableCell({"content": player["spree_best"], "parse": ["ignore0"]}));

    return row;
}

function createMultiRow(player, totalTeams){

    const row = document.createElement("tr");

    let teamColorClass = (totalTeams < 2) ? "team-none" : getTeamColorClass(player.team);

    row.appendChild(UIPlayerLink({
        "playerId": player.player_id, 
        "className": `${teamColorClass} text-left`, 
        "country": player.country, 
        "bTableElem": true, 
        "name": player.name
    }));

    for(let i = 1; i < 5; i++){
        row.appendChild(UITableCell({"content": player[`multi_${i}`], "parse": ["ignore0"]}));
    }

    row.appendChild(UITableCell({"content": player["multi_best"], "parse": ["ignore0"]}));

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

    const wrapper = document.createElement("div");
    const title = document.createElement("div");
    title.className = "header-wrapper";
    title.innerHTML = "Special Events";

    wrapper.appendChild(title);

    const sprees = document.createElement("table");
    sprees.className = "t-width-1";

    const multis = document.createElement("table");
    multis.className = "t-width-1";

    const spreeHeaders = document.createElement("tr");
    const multiHeaders = document.createElement("tr");

    const firstBlood = document.createElement("table");

    const firstBloodRow = document.createElement("tr");
    firstBloodRow.appendChild(UITableCell({"content": "First Blood"}));

    const firstBloodPlayer = getFirstBloodPlayer(players);

    firstBloodRow.appendChild(UIPlayerLink({
        "playerId": firstBloodPlayer.player_id, 
        "name": firstBloodPlayer.name, 
        "country": firstBloodPlayer.country,
        "className": (totalTeams >= 2) ? getTeamColorClass(firstBloodPlayer.team) : "team-none",
        "bTableElem": true
    }));

    firstBlood.appendChild(firstBloodRow);
    wrapper.appendChild(firstBlood);

    const spreeHeaderTitles = [
        "Player", "Killing Spree", "Rampage", "Dominating", "Unstoppable", "Godlike", "Best Spree"
    ];

    const multiHeaderTitles = [
        "Player", "Double Kill", "Multi Kill", "Ultra Kill", "Monster Kill", "Best Multi Kill"
    ];

    for(let i = 0; i < spreeHeaderTitles.length; i++){
        spreeHeaders.appendChild(UITableHeaderColumn({"content": spreeHeaderTitles[i]}));
    }

     for(let i = 0; i < multiHeaderTitles.length; i++){
        multiHeaders.appendChild(UITableHeaderColumn({"content": multiHeaderTitles[i]}));
    }
    
    sprees.appendChild(spreeHeaders);
    multis.appendChild(multiHeaders);

    for(let i = 0; i < players.length; i++){

        const p = players[i];

        if(p.spectator) continue;

        if(p.spree_best >= 5){
            sprees.appendChild(createSpreeRow(p, totalTeams));
        }

        if(p.multi_best >= 2){
            multis.appendChild(createMultiRow(p, totalTeams));
        }
    }

 

    if(sprees.children.length > 1){
        wrapper.appendChild(sprees);
    }

    if(multis.children.length > 1){
        wrapper.appendChild(multis);
    }

    if(multis.children.length > 1 || sprees.children.length > 1){
        parent.appendChild(wrapper);
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

        if(data.dom.data.length === 0) return;

        if(totalTeams < 2) return;

        this.totalTeams = totalTeams;
        this.data = data;

        this.parent = document.querySelector(parent);


        this.generalWrapper = UIDiv();
        this.generalTitle = UIDiv("header-wrapper");
        this.generalTitle.innerHTML = `Domination Summary`;
        this.generalContent = UIDiv();
        this.generalWrapper.append(this.generalTitle, this.generalContent);
        this.parent.append(this.generalWrapper);
        this.renderGeneral();

        this.playersWrapper = document.createElement("div");

        this.mode = "percent";

        this.playersTitle = document.createElement("div");
        this.playersTitle.className = "header-wrapper";
        this.playersTitle.innerHTML = "Domination Players Summary";
        this.playersWrapper.append(this.playersTitle);

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

        const headerRow = document.createElement("tr");
            
        headerRow.append(UITableHeaderColumn({"content": "Player"}));


        for(const [pointId, pointName] of Object.entries(controlPoints)){
            headerRow.append(UITableHeaderColumn({"content": pointName}));
        }

        return headerRow;
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

        //this.generalContent.innerHTML = ``;

        const table = document.createElement("table");
        table.className = "t-width-1";

        const headers = [
            "Team", 
            "Total Captures", 
            "Total Control Time", 
            "Total Control Percent", 
            "Total Score Time*",
            "Stolen Caps*",
            "Stolen Score*",
            "Importer Score*",
            "Final UT Score"
        ];

        const hRow = document.createElement("tr");

        for(let i = 0; i < headers.length; i++){

            const col = document.createElement("th");
            col.append(headers[i]);
            hRow.append(col);
        }

        table.append(hRow);

        for(let i = 0; i < this.totalTeams; i++){

            const d = this.data.dom.detailedResult;

            const row = document.createElement("tr");
     
            row.append(UITableCell({"content": `${getTeamName(i)} Team`, "className": `${getTeamColorClass(i)} text-left`}));
            row.append(UITableCell({"content": d[`team_${i}_caps`], "parse": ["ignore0"]}));
            
            row.append(UITableCell({
                "content": d[`team_${i}_control_time`], 
                "className": "playtime", 
                "parse": "mmss"}
            ));

            row.append(UITableCell({
                "content": `${d[`team_${i}_control_percent`]}%`}
            ));

            row.append(UITableCell({
                "content": d[`team_${i}_score_time`], "className": "playtime", "parse": ["mmss"]}
            ));

            row.append(UITableCell({
                "content": d[`team_${i}_stolen_caps`], "parse": ["ignore0"]}
            ));

             row.append(UITableCell({"content": d[`team_${i}_stolen_points`].toFixed(2)}));

            row.append(UITableCell({"content": d[`team_${i}_importer_score`].toFixed(2)}));
            row.append(UITableCell({"content": d[`team_${i}_real_score`].toFixed(2)}));
            

            table.append(row);

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
        this.generalContent.append(table);

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

        for(let i = 0; i < this.totalTeams; i++){

            const table = document.createElement("table");
            table.className = "t-width-4";
            table.append(this.createHeaderRow(controlPoints));

            const totals = {};

            for(let x = 0; x < playerData.length; x++){

                const p = playerData[x];

                if(p.spectator || p.team !== i) continue;

                const dataRow = document.createElement("tr");

                dataRow.append(UIPlayerLink({
                    "playerId": p.player_id, 
                    "className": `${getTeamColorClass(p.team)} text-left`, 
                    "country": p.country, 
                    "bTableElem": true, 
                    "name": p.name
                }));

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

                    const col = UITableCell({
                        "content": content    
                    });

                    if(className !== "") col.className = className;

                    dataRow.append(col);
                }
            
                table.append(dataRow);
            }

            const totalRow = document.createElement("tr");

            totalRow.append(UITableCell({
                "content": "Combined", "className": "team-none"
            }));


            for(const pointId of Object.keys(controlPoints)){

                const {content, className, currentValue} = this.getContent(totals[pointId], true);

                const col = UITableCell({content});

                if(className !== "") col.className = className;

                totalRow.append(col);
            }

            table.append(totalRow);

            this.content.append(table);
        }
    }
}


function renderCTFSummaryType(parent, totalTeams, data, players, headers, dataKeys){

    const playtimeTypes = [
        "flag_carry_time",
        "flag_carry_time_max",
        "flag_carry_time_avg",
        "flag_carry_time_min"
    ];

    for(let i = 0; i < totalTeams; i++){

        const table = document.createElement("table");
        table.className = "t-width-1";
        
        const headerRow = document.createElement("tr");

        for(let x = 0; x < headers.length; x++){
            headerRow.appendChild(UITableHeaderColumn({"content": headers[x]}));
        }

        table.appendChild(headerRow);

        const totals = {};
        
        for(let z = 0; z < dataKeys.length; z++){
            totals[dataKeys[z]] = 0;
        }

        for(let x = 0; x < data.playerData.length; x++){

            const p = data.playerData[x];

            if(p.spectator) continue;

            const row = document.createElement("tr");

            const player = players?.[p.player_id] ?? {"name": "Not Found", "country": "xx", "team": 255};

            if(player.team !== i) continue;

            row.appendChild(UIPlayerLink({
                "playerId": p.player_id,
                "className": getTeamColorClass(i), 
                "country": player.country, "bTableElem": "true", "name": player.name
            }));

            

            for(let z = 0; z < dataKeys.length; z++){

                totals[dataKeys[z]] += p[dataKeys[z]];

                if(playtimeTypes.indexOf(dataKeys[z]) === -1){
                    row.appendChild(UITableCell({"content":  p[dataKeys[z]], "parse": "ignore0"}));
                }else{
                    row.appendChild(UITableCell({"content":  p[dataKeys[z]], "className": "playtime", "parse": ["playtime"]}));
                }
            }

            table.appendChild(row);
        }

        const totalsRow = document.createElement("tr");

        totalsRow.appendChild(UITableCell({"content":  "Totals", "className": "team-none"}));

        for(let z = 0; z < dataKeys.length; z++){

            if(playtimeTypes.indexOf(dataKeys[z]) === -1){
                totalsRow.appendChild(UITableCell({"content":  totals[dataKeys[z]], "parse": "ignore0"}));
            }else{
                totalsRow.appendChild(UITableCell({"content":  totals[dataKeys[z]], "className": "playtime", "parse": ["playtime"]}));
            }
        }

        table.appendChild(totalsRow);

        parent.appendChild(table);
    }
}

function renderGeneralCTFTab(parent, totalTeams, data, players){

    parent.innerHTML = "";

    const headers = [
        "Player", "Taken", "Pickup", "Drop", "Assist", "Cover", 
        "Seal", "Capture", "Kill", "Return", "Carry Time"
    ];

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

    renderCTFSummaryType(parent, totalTeams, data, players, headers, dataKeys);
}


function renderReturnCTFTab(parent, totalTeams, data, players){

    parent.innerHTML = "";

    const headers = [
        "Player", "Return", "Return Base", "Return Mid", 
        "Return Enemy Base", "Return Close Save"
    ];

    const dataKeys = [
        "flag_return",
        "flag_return_base",
        "flag_return_mid",
        "flag_return_enemy_base",
        "flag_return_save"
    ];

    renderCTFSummaryType(parent, totalTeams, data, players, headers, dataKeys);
}

function renderCarryTimeCTFTab(parent, totalTeams, data, players){

    parent.innerHTML = "";

    const headers = [
        "Player", "Times Held", 
        "Total Carry Time",
        "Max Carry Time", 
        "Avg Carry Time",
        "Min Carry Time",
    ];

    const dataKeys = [
        "times_held",
        "flag_carry_time",
        "flag_carry_time_max",
        "flag_carry_time_avg",
        "flag_carry_time_min"
    ];

    renderCTFSummaryType(parent, totalTeams, data, players, headers, dataKeys);
}


function renderCTFSummary(parent, totalTeams, data, players){

    parent = document.querySelector(parent);

    if(data.playerData.length === 0) return;

    const wrapper = document.createElement("div");

    const title = document.createElement("div");
    title.className = "header-wrapper";
    title.innerHTML = "Capture The Flag Summary";
    wrapper.appendChild(title);

    const tabs = new UITabs(wrapper, [
        {"display": "General", "value": "general"},
        {"display": "Returns", "value": "returns"},
        {"display": "Carry Time", "value": "carry time"}
    ]);


    const content = document.createElement("div");
    wrapper.appendChild(content);

    tabs.wrapper.addEventListener("tabChanged", (e) =>{

        switch(e.detail.newTab){
            
            case "general": {
                renderGeneralCTFTab(content, totalTeams, data, players);
            } break;
            case "returns": {
                renderReturnCTFTab(content, totalTeams, data, players);
            } break;
            case "carry time": {
                renderCarryTimeCTFTab(content, totalTeams, data, players);
            }break;
            default: {
                content.innerHTML = "";
            }
        }
    });
    
    renderGeneralCTFTab(content, totalTeams, data, players);


    parent.appendChild(wrapper);
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

        this.title = UIDiv("header-wrapper");
        this.title.innerHTML = "Capture The Flag Caps";
        this.wrapper.append(this.title);

        this.createTabs();

        this.content = document.createElement("div");
        this.content.className = "ctf-cap";

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

        this.capWrapper = document.createElement("div");
 
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

    renderCovers(end, covers, carryPlayer){

        const elems = [];

        for(let x = 0; x < covers.length; x++){

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
                }), 
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
                elems.push(...this.renderCovers(end, covers, p));
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
            "width": 1,
            "headers": [
                "Taken", "Taken By", "Drops", "Covers", 
                "Kills", "Suicides", "Capped By", 
                "Cap", "Travel Time", "Score"
            ]
        };

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
                
                UIMMSS(c.taken_timestamp), 
                UIPlayerLink({
                    "playerId": c.taken_player, 
                    "name": UISpan(grabPlayer.name, getTeamFont(grabPlayer.team)), 
                    "country": grabPlayer.country
                }), 
                ignore0(c.total_drops),
                ignore0(c.total_covers),
                kills,
                suicides,
                UIPlayerLink({
                    "playerId": c.cap_player, 
                    "name": UISpan(capPlayer.name, getTeamFont(capPlayer.team)), 
                    "country": capPlayer.country
                }), 
                UIMMSS(c.cap_timestamp),
                {"content": c.cap_time, "parse": ["playtime2"], "className": "playtime"},
                scores
            ]);
        }

        const table = new UITable(this.content, tableOptions, data);

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

        this.wrapper = document.createElement("div");
        this.wrapper.className = `scroll-x t-width-1 center`;

        const title = document.createElement("div");
        title.className = "header-wrapper";
        title.innerHTML = `Weapons Summary`;
        this.parent.appendChild(title);
        this.currentMode = "kills";

        this.createTabs();

        this.table = document.createElement("table");
        this.wrapper.append(this.table);
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

    renderStatType(){

        if(this.currentMode === "totals") return;

       // this.table.style.cssText = ``;

        const headerRow = document.createElement("tr");

        headerRow.appendChild(UITableHeaderColumn({"content": "Player"}));

        for(const [weaponId, weaponName] of Object.entries(this.weaponStats.names)){

            if(weaponName === "All") continue;
            const col = document.createElement("th");
            const weaponImage = this.getImage(weaponName);
             col.className = "tiny-font white team-none";

            if(weaponImage !== "blank"){

                const img = document.createElement("img");
                img.src = `/images/weapons/${weaponImage}.png`;
                img.className = "weapon-icon"; 
                img.title = weaponName;
                col.appendChild(img);
                
            }else{
               
                col.appendChild(document.createTextNode(weaponName.toUpperCase()));
            }
            
            headerRow.appendChild(col);
        }

        this.table.appendChild(headerRow);

        
        for(const [playerId, player] of Object.entries(this.playerData)){

            const row = document.createElement("tr");

            if(player.bSpectator) continue;

            row.appendChild(UIPlayerLink({
                "playerId": playerId, 
                "name": player.name, 
                "country": player.country, 
                "bTableElem": true,
                "className": (this.totalTeams < 2) ? "" : getTeamColorClass(player.team)
            }));

            for(const [weaponId, weaponName] of Object.entries(this.weaponStats.names)){

                if(weaponName === "All") continue;
                row.appendChild(UITableCell({"content": this.getPlayerWeaponStat(this.currentMode, playerId, weaponId), "parse": ["ignore0"]}));
            }

            this.table.appendChild(row);
        }       
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

        this.table.className = `t-width-1`;
        const headerRow = document.createElement("tr");

        headerRow.appendChild(UITableHeaderColumn({"content": "Weapon"}));
        headerRow.appendChild(UITableHeaderColumn({"content": "Team Kills"}));
        headerRow.appendChild(UITableHeaderColumn({"content": "Suicides"}));
        headerRow.appendChild(UITableHeaderColumn({"content": "Deaths"}));
        headerRow.appendChild(UITableHeaderColumn({"content": "Kills"}));
        headerRow.appendChild(UITableHeaderColumn({"content": "KPM"}));

        this.table.appendChild(headerRow);

        for(const [weaponId, weaponName] of Object.entries(this.weaponStats.names)){

            if(weaponName === "All") continue;

            const row = document.createElement("tr");
            row.appendChild(UITableCell({"content": weaponName, "className": "text-left"}));


            const wStats = this.getWeaponTotalStats(weaponId);

            row.appendChild(UITableCell({"content": wStats.teamKills, "parse": ["ignore0"]}));
            row.appendChild(UITableCell({"content": wStats.suicides, "parse": ["ignore0"]}));
            row.appendChild(UITableCell({"content": wStats.deaths, "parse": ["ignore0"]}));
            row.appendChild(UITableCell({"content": wStats.kills, "parse": ["ignore0"]}));
            row.appendChild(UITableCell({"content": wStats.kpm.toFixed(2)}));
            this.table.appendChild(row);
        }

    }

    render(){

        this.table.innerHTML = ``;
        this.table.className = "";

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

        this.table = document.createElement("table");
        this.table.className = "t-width-1";
        this.parent.appendChild(this.table);
        this.render();
    }

    createTabs(){

        const options = [];

        for(const [id, name] of Object.entries(this.weaponNames)){
            if(id == 0) continue;
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

    render(){

        this.table.innerHTML = ``;
        const headerRow = document.createElement("tr");

        const headers = ["Player", "Kills", "Deaths", "Shots", "Hits", "Accuracy", "Damage"];

        for(let i = 0; i < headers.length; i++){
            headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
        }

        this.table.appendChild(headerRow);

        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            if(d.weapon_id !== this.currentWeapon) continue;

            const row = document.createElement("tr");

            const player = getPlayer(this.players, d.player_id);

            row.appendChild(UIPlayerLink({
                "playerId": d.player_id, 
                "name": player.name, 
                "country": player.country, 
                "bTableElem": true,
                "className": (this.totalTeams >= 2) ? getTeamColorClass(player.team) : "team-none"
            }));


            row.appendChild(UITableCell({"content": d.kills, "parse": ["ignore0"]}));
            row.appendChild(UITableCell({"content": d.deaths, "parse": ["ignore0"]}));
            row.appendChild(UITableCell({"content": d.shots, "parse": ["ignore0"]}));
            row.appendChild(UITableCell({"content": d.hits, "parse": ["ignore0"]}));
            row.appendChild(UITableCell({"content": `${d.accuracy.toFixed(2)}%` }));
            row.appendChild(UITableCell({"content": d.damage, "parse": ["ignore0"]}));

            this.table.appendChild(row);
        }
    }
}


function renderMatchPings(parent, players, totalTeams){

    const parentElem = document.querySelector(parent);
    UIHeader(parent, "Player Ping Summary");
    
    const table = document.createElement("table");

    const headerRow = document.createElement("tr");
    headerRow.appendChild(UITableHeaderColumn({"content": "Player"}));
    headerRow.appendChild(UITableHeaderColumn({"content": "Min"}));
    headerRow.appendChild(UITableHeaderColumn({"content": "Average"}));
    headerRow.appendChild(UITableHeaderColumn({"content": "Max"}));

    table.appendChild(headerRow);

    for(let i = 0; i < players.length; i++){

        const p = players[i];
        if(p.spectator) continue;

        const row = document.createElement("tr");
        row.appendChild(UIPlayerLink({
            "playerId": p.player_id,
            "name": p.name, 
            "country": p.country, 
            "bTableElem": true,
            "className": (totalTeams >= 2) ? getTeamColorClass(p.team) : "team-none"
        }));

        row.appendChild(UITableCell({"content":p.ping_min}));
        row.appendChild(UITableCell({"content":p.ping_avg}));
        row.appendChild(UITableCell({"content":p.ping_max}));

        table.appendChild(row);
    }

    parentElem.appendChild(table);
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
            "player": {"title": "Player"},
            "body": {"title": "Body Armour"},
            "pads": {"title": "Thigh Pads"},
            "shp": {"title": "Super Health Pack"},
            "invis": {"title": "Invisibility"},
            "belt": {"title": "Shield Belt"},
            "amp": {"title": "Damage Amp"},
            "boots": {"title": "Jump Boots"},
        };

        if(!this.bAnyData()) return;

        this.table = document.createElement("table");
        this.table.className = "t-width-1";
        UIHeader(parent, "Items Summary");
        this.parent.appendChild(this.table);

        
        
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

        this.table.innerHTML = "";


        const headerRow = document.createElement("tr");

        for(const [columnName, info] of Object.entries(this.headers)){

            headerRow.appendChild(UITableHeaderColumn({"content": info.title}));
        }

        this.table.appendChild(headerRow);


        for(let i = 0; i < this.playerData.length; i++){

            const p = this.playerData[i];

            if(!this.bPlayerAnyData(p)) continue;

            const row = document.createElement("tr");

            row.appendChild(UIPlayerLink({
                "playerId": p.player_id, 
                "name": p.name, 
                "country": p.country, 
                "bTableElem": true, 
                "className": (this.totalTeams < 2) ? "team-none" : getTeamColorClass(p.team)
            }));

            for(const columnName of Object.keys(this.headers)){

                if(columnName === "player") continue;

                row.appendChild(UITableCell({
                    "content": p[`item_${columnName}`], 
                    "parse": ["ignore0"]
                }));
            }

            this.table.appendChild(row);
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

        this.table = document.createElement("table");
        this.table.className = "t-width-1";

        this.parent.appendChild(this.table);

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

        const row = document.createElement("tr");

        row.appendChild(UIPlayerLink({
            "playerId": player.player_id, 
            "name": player.name, 
            "country": player.country, 
            "bTableElem": true,
            "className": (this.totalTeams < 2) ? "team-none" : getTeamColorClass(player.team)
        }));


        row.appendChild(UITableCell({
            "content": player.damage.fallDamage,
            "parse": ["ignore0"]
        }));

        row.appendChild(UITableCell({
            "content": player.damage.drownDamage,
            "parse": ["ignore0"]
        }));

        row.appendChild(UITableCell({
            "content": player.damage.selfDamage,
            "parse": ["ignore0"]
        }));

        row.appendChild(UITableCell({
            "content": player.damage.damageTaken,
            "parse": ["ignore0"]
        }));

        row.appendChild(UITableCell({
            "content": player.damage.damageDelt,
            "parse": ["ignore0"]
        }));

        if(this.bAnyTeamDamage()){

            row.appendChild(UITableCell({
                "content": player.damage.teamDamageTaken,
                "parse": ["ignore0"]
            }));

            row.appendChild(UITableCell({
                "content": player.damage.teamDamageDelt,
                "parse": ["ignore0"]
            }));
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

        const headerRow = document.createElement("tr");

        const headers = [
            "Player",
            "Fall Damage",
            "Drown Damage",
            "Self Damage",
            "Damage Taken",
            "Damage Delt"
        ];

        if(this.bAnyTeamDamage()){
            headers.push("Team Damage Taken");
            headers.push("Team Damage Delt");
        }

        for(let i = 0; i < headers.length; i++){
            headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
        }

        this.table.appendChild(headerRow);


        for(let i = 0; i < this.players.length; i++){

            const p = this.players[i];

            if(p.spectator || p.damage === undefined) continue;

            this.table.appendChild(this.createRow(p));
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

        this.wrapper = document.createElement("div");
        this.wrapper.className = "graph-wrapper";
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
    elem.append("Copy To Clipboard");

    function resetAll(){

        for(let i = 0; i < copyElems.length; i++){
            copyElems[i].className = "json-api-link-clipboard";
            copyElems[i].innerHTML = "Copy To Clipboard";
            
        }
    }
    
    elem.addEventListener("click", async () =>{

        try{

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


            const req = await fetch(url);
            const res = await req.json();

            data = JSON.stringify(res);
            await navigator.clipboard.writeText(data);

            elem.className = `${cssClass} team-green`;
            elem.innerHTML = "Copied";

        }catch(err){

            elem.className = `${cssClass} team-red`;
            elem.innerHTML = "Failed To Copy Data";
            console.trace(err);
        }finally{
            bLoadingData = false;
        }
    });

    return elem;
}

function matchAPILink(title, url, content, copyElem){

    const elem = UIDiv("json-api-link");

    const titleLink = UIA(title, url, "_blank");
    titleLink.className = "json-api-link-title";

    const contentWrapper = UIDiv("json-api-link-content");
    contentWrapper.append(...content);
    
    elem.append(titleLink, contentWrapper, copyElem);
    return elem;
}

class MatchJSONApiInfo{

    constructor(parent, matchHash){

        this.parent = document.querySelector(parent);
        this.matchHash = matchHash;

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
            copyElem,
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


        const examples = UIDiv("info");
        examples.append(UIA("JSON API Examples", `/jsonexamples/?mode=match`,"_blank"));
        this.wrapper.append(examples);
    }
}

