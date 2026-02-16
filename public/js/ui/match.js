
function renderBasicInfo(parent, data, players){

    parent = document.querySelector(parent);

    const wrapper = document.createElement("div");
    wrapper.className = "match-basic-info-wrapper";

    const header = document.createElement("div");
    header.className= "header-wrapper";
    header.innerHTML = data.map_name;

    const content = document.createElement("div");

    if(data.solo_winner !== 0){

        const p = getPlayer(players, data.solo_winner);
        data.solo_winner_name = p.name;
    
    }
 
    UIMatchScoreBox(content, data, false, false, players);
  
    parent.appendChild(header);

    const info = document.createElement("div");

    info.className = "match-basic-info-wrapper-info";
    info.append(`${toDateString(data.date, false, false)}`, UIBr());
    info.append(data.gametype_name, UISpan(" on ", "dull"), data.map_name, UIBr());
    info.append(`${data.players} ${plural(data.players, "Player")}`, UIBr());
    info.append(UISpan("Match Length", "dull"), ` ${toPlaytime(data.playtime)}`, UIBr());
    info.append(UISpan("Server", "dull"), ` ${data.server_name}`, UIBr());
    info.append(UISpan("Mutators ", "dull"), UISpan(data.mutators, "font-small"), UIBr());

    if(data.target_score !== 0){
        info.append(UISpan("Target Score ", "dull"), data.target_score, UIBr());
    }
    if(data.time_limit !== 0){
        info.append(
            UISpan("Time Limit ", "dull"), 
            `${data.time_limit} ${plural(data.time_limit, "Minute")}`, 
            UIBr()
        );
    }

    content.appendChild(info);

    new UIWatchlistButton(info, "matches", data.hash);

    new UICopyURLToClipboard(info, "Copy Match Perma Link To Clipboard", `/match/${data.hash}`);

    wrapper.appendChild(content);

    parent.appendChild(wrapper);

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
        cols.push(UITableColumn({"content": "Totals", "className": "team-none"}));
    }


    cols.push(UITableColumn({"content": p.time_on_server, "className": "playtime", "parse": ["playtime"]}));
    cols.push(UITableColumn({"content": p.score, "parse": ["ignore0"]}));
    cols.push(UITableColumn({"content": p.frags, "parse": ["ignore0"]}));
    cols.push(UITableColumn({"content": p.kills, "parse": ["ignore0"]}));
    cols.push(UITableColumn({"content": p.deaths, "parse": ["ignore0"]}));

    let net = p.kills - p.deaths;
    if(net > 0) net = `+${net}`;
    cols.push(UITableColumn({"content": net}));

    cols.push(UITableColumn({"content": p.suicides, "parse": ["ignore0"]}));
    cols.push(UITableColumn({"content": p.team_kills, "parse": ["ignore0"]}));
    cols.push(UITableColumn({"content": p.headshots, "parse": ["ignore0"]}));
    cols.push(UITableColumn({"content": `${p.efficiency.toFixed(2)}%`}));
    cols.push(UITableColumn({"content": p.ttl, "className": "playtime", "parse": ["mmss"]}));


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
        row.appendChild(UITableColumn({"content": player[`spree_${i}`], "parse": ["ignore0"]}));
    }

    row.appendChild(UITableColumn({"content": player["spree_best"], "parse": ["ignore0"]}));

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
        row.appendChild(UITableColumn({"content": player[`multi_${i}`], "parse": ["ignore0"]}));
    }

    row.appendChild(UITableColumn({"content": player["multi_best"], "parse": ["ignore0"]}));

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
    firstBloodRow.appendChild(UITableColumn({"content": "First Blood"}));

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

        this.wrapper = document.createElement("div");

        this.mode = "percent";

        this.title = document.createElement("div");
        this.title.className = "header-wrapper";
        this.title.innerHTML = "Domination Summary";
        this.wrapper.append(this.title);

        this.createTabs();

        this.info = UIDiv("info");
        this.content = UIDiv();
        this.wrapper.append(this.info, this.content);
        this.render();

        this.parent.append(this.wrapper);

        
    }

    createTabs(){

        const tabOptions = [
            {"display": "Control Percent", "value": "percent"},
            {"display": "Control Time", "value": "time"},
            {"display": "Total Caps", "value": "caps"},
            {"display": "Shortest Time Held", "value": "short-time"},
            {"display": "Longest Time Held", "value": "long-time"},
            {"display": "Total Points", "value": "total-points"},
            {"display": "Max Points", "value": "max-points"},
            {"display": "Stolen Points", "value": "stolen-points"},
            {"display": "Stolen Caps", "value": "stolen-caps"},
        ];




        this.tabs = new UITabs(this.wrapper, tabOptions, this.mode);

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

            const lines = [`- Recreated from stats log, Usually less than +-1% of real UT score.`];
         
            this.info.append(UIB("Estimated Points Calculated From Stat Log"), UIBr(), ...lines);

        }else if(this.mode === "stolen-points"){

            const lines = [
                `- Recreated from stats log, Usually less than +-1% of real UT score.`,
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
                `- Recreated from stats log, Usually less than +-1% of real UT score.`,
                UIBr(),
                `- This is the total amount of times a player got a stolen point capture.`
            ];
         
            this.info.append(UIB("Estimated Points Calculated From Stat Log"), UIBr(), ...lines);

        }
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

                    const col = UITableColumn({
                        "content": content    
                    });

                    if(className !== "") col.className = className;

                    dataRow.append(col);
                }
            
                table.append(dataRow);
            }

            const totalRow = document.createElement("tr");

            totalRow.append(UITableColumn({
                "content": "Combined", "className": "team-none"
            }));


            for(const pointId of Object.keys(controlPoints)){

                const {content, className, currentValue} = this.getContent(totals[pointId], true);

                const col = UITableColumn({content});

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
                    row.appendChild(UITableColumn({"content":  p[dataKeys[z]], "parse": "ignore0"}));
                }else{
                    row.appendChild(UITableColumn({"content":  p[dataKeys[z]], "className": "playtime", "parse": ["playtime"]}));
                }
            }

            table.appendChild(row);
        }

        const totalsRow = document.createElement("tr");

        totalsRow.appendChild(UITableColumn({"content":  "Totals", "className": "team-none"}));

        for(let z = 0; z < dataKeys.length; z++){

            if(playtimeTypes.indexOf(dataKeys[z]) === -1){
                totalsRow.appendChild(UITableColumn({"content":  totals[dataKeys[z]], "parse": "ignore0"}));
            }else{
                totalsRow.appendChild(UITableColumn({"content":  totals[dataKeys[z]], "className": "playtime", "parse": ["playtime"]}));
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

    constructor(parent, totalTeams, data, players){

        if(data.playerData.length === 0) return;

        this.parent = document.querySelector(parent);
        this.totalTeams = totalTeams;
        this.caps = data.caps;
        this.players = players;

        this.currentCap = 1;
        this.currentScores = [0,0];

        this.wrapper = document.createElement("div");

        this.title = document.createElement("div");
        this.title.className = "header-wrapper";
        this.title.innerHTML = "Capture The Flag Caps";
        this.wrapper.appendChild(this.title);

        this.content = document.createElement("div");
        this.content.className = "ctf-caps";

        this.wrapper.appendChild(this.content);

        this.createButtonWrapper();
       
        this.createCapWrapper();

        this.parent.appendChild(this.wrapper);

        this.render();
    }

    createButtonWrapper(){

        this.buttonsWrapper = document.createElement("div");
        this.buttonsWrapper.className = "ctf-cap-buttons";

        this.content.appendChild(this.buttonsWrapper);

        this.pageInfo = document.createElement("div");
        this.buttonsWrapper.appendChild(this.pageInfo);


        const buttons = document.createElement("div");
        buttons.className = "duo";

        this.buttonsWrapper.appendChild(buttons);

        const previous = document.createElement("button");
        previous.innerHTML = "Previous Cap";
        previous.className = "big-button";
        buttons.appendChild(previous);

        previous.addEventListener("click", () =>{

            if(this.currentCap < 2) return;
            this.currentCap--;
            this.render();
        });

        const next = document.createElement("button");
        next.innerHTML = "Next Cap";
        next.className = "big-button";

        next.addEventListener("click", () =>{
            if(this.currentCap > this.caps.length - 1) return;
            this.currentCap++;
            this.render();
        })

        buttons.appendChild(next);
    }

    createCapWrapper(){

        this.capWrapper = document.createElement("div");
        this.capWrapper.className = "ctf-cap"; //set team color to current team cap

        this.teamScores = document.createElement("div");
        this.teamScores.className = "basic-team-scores duo";

        this.redScore = document.createElement("div");
        this.redScore.className = "team-red basic-team-score text-center";
        //this.redScore.innerHTML = this.currentScores[0];
        this.teamScores.appendChild(this.redScore);

        this.blueScore = document.createElement("div");
        this.blueScore.className = "team-blue basic-team-score text-center";
        //this.blueScore.innerHTML = this.currentScores[1];
        this.teamScores.appendChild(this.blueScore);

        this.cappedBy = document.createElement("div");
        this.cappedBy.className = "padding-1";

        this.capWrapper.appendChild(this.teamScores);
        this.capWrapper.appendChild(this.cappedBy);

        this.capInfo = document.createElement("div");
        this.capInfo.className = "cap-info text-center";
        this.capWrapper.appendChild(this.capInfo);
        this.wrapper.appendChild(this.capWrapper);

        this.killsElem = document.createElement("div");
        this.suicidesElem = document.createElement("div");

        this.capWrapper.appendChild(this.killsElem);
        this.capWrapper.appendChild(this.suicidesElem);

        

    }

    renderButtons(){

        this.pageInfo.className = `font-small padding-1`;
        this.pageInfo.innerHTML = `Viewing Cap ${this.currentCap} of ${this.caps.length}`;     
    }

    renderCarryTimes(capInfo){

        if(capInfo.carryTimes.length <= 1) return;

        this.capInfo.appendChild(document.createElement("br"));
        let carriedByString = "Carried By: ";

        for(let i = 0; i < capInfo.carryTimes.length; i++){

            const c = capInfo.carryTimes[i];

            const p = getPlayer(this.players, c.player_id);
            carriedByString += `${p.name} ${toPlaytime(c.carry_time, true)}`;

            if(i < capInfo.carryTimes.length - 1){
                carriedByString += `, `;
            }
        }

        this.capInfo.appendChild(document.createTextNode(carriedByString));
    
    }


    renderCovers(capInfo){

        if(capInfo.covers.length === 0) return;

        let string = "Covered By: ";

        this.capInfo.appendChild(document.createElement("br"));


        let players = 0;

        for(const [playerId, covers] of Object.entries(capInfo.covers)){

            if(players > 0) string += `, `;

            const player = getPlayer(this.players, playerId);

            string += `${player.name} (${covers.length})` 

            players++;
        }

        this.capInfo.appendChild(document.createTextNode(string));
    }

    renderDrops(capInfo){

        if(capInfo.total_drops === 0) return;

        this.capInfo.appendChild(document.createElement("br"));

        const text = `Dropped ${capInfo.total_drops} time${(capInfo.total_drops === 1) ? "" : "s"} for a total of ${capInfo.drop_time} Seconds`;
        this.capInfo.appendChild(document.createTextNode(text));
    }

    renderTeamFrags(capInfo){

        let className = `solo`;

        if(this.totalTeams === 2) className = "duo";
        if(this.totalTeams === 3) className = "trio";
        if(this.totalTeams === 4) className = "quad";

        this.killsElem.className = `${className} text-center`;
        this.suicidesElem.className = `${className} text-center`;
        this.killsElem.innerHTML = ``;
        this.suicidesElem.innerHTML = ``;

        const kills = [];
        const suicides = [];

        for(let i = 0; i < this.totalTeams; i++){

            if(i === 0){
                kills.push(capInfo.red_kills);
                suicides.push(capInfo.red_suicides);
            }

            if(i === 1){
                kills.push(capInfo.blue_kills);
                suicides.push(capInfo.red_suicides);
            }

            if(i === 2){
                kills.push(capInfo.green_kills);
                suicides.push(capInfo.red_suicides);
            }

            if(i === 3){
                kills.push(capInfo.yellow_kills);
                suicides.push(capInfo.red_suicides);
            }
        }
        
        for(let i = 0; i < this.totalTeams; i++){

            const currentKills = document.createElement("div");
            currentKills.className = `${getTeamColorClass(i)} ctf-cap-frags`;
            currentKills.innerHTML = `${kills[i]} Kill${(kills[i] === 1) ? "" : "s"}`;
            this.killsElem.appendChild(currentKills);

            const currentSuicides = document.createElement("div");
            currentSuicides.className = `${getTeamColorClass(i)} ctf-cap-frags`;
            currentSuicides.innerHTML = `${suicides[i]} Suicide${(suicides[i] === 1) ? "" : "s"}`;
            this.suicidesElem.appendChild(currentSuicides);
        }

        
    }

    renderCap(){


        const currentScores = [0,0];

        for(let i = 0; i < this.currentCap; i++){

            const c = this.caps[i];

            currentScores[c.capping_team]++;
        }

        this.redScore.innerHTML = currentScores[0];
        this.blueScore.innerHTML = currentScores[1];

        const capInfo = this.caps[this.currentCap - 1];

        //this.cappedBy = "Capped by test";
        this.cappedBy.className = `${getTeamColorClass(capInfo.capping_team)} text-center padding-1 margin-top-2 margin-bottom-2`;

        const capPlayer = getPlayer(this.players, capInfo.cap_player);

        const capPlayerElem = UIPlayerLink({"playerId": capInfo.cap_player, "name": capPlayer.name, "country": capPlayer.country});

        const textNode = document.createTextNode(` Capped the ${getTeamName(capInfo.flag_team)} Flag`);
        const capTime = document.createElement("span");
        capTime.className = "yellow-font";
        capTime.appendChild(document.createTextNode(` ${toPlaytime(capInfo.cap_time, true)}`))
        this.cappedBy.innerHTML = "";
        this.cappedBy.appendChild(capPlayerElem);
        this.cappedBy.appendChild(textNode);
        this.cappedBy.appendChild(capTime);

        
        const grabPlayer = getPlayer(this.players, capInfo.taken_player);

        this.capInfo.innerHTML = "";

        let capString = `Taken By: ${grabPlayer.name} @ ${MMSS(capInfo.taken_timestamp)}`;
        capString += `, Capped By: ${capPlayer.name} @ ${MMSS(capInfo.cap_timestamp)}\n`;

        this.capInfo.appendChild(document.createTextNode(capString));

        
        this.renderCarryTimes(capInfo);
        this.renderCovers(capInfo);
        this.renderDrops(capInfo);
        this.renderTeamFrags(capInfo);
    }

    render(){
        this.renderButtons();
        this.renderCap();
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
                row.appendChild(UITableColumn({"content": this.getPlayerWeaponStat(this.currentMode, playerId, weaponId), "parse": ["ignore0"]}));
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
            row.appendChild(UITableColumn({"content": weaponName, "className": "text-left"}));


            const wStats = this.getWeaponTotalStats(weaponId);

            row.appendChild(UITableColumn({"content": wStats.teamKills, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": wStats.suicides, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": wStats.deaths, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": wStats.kills, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": wStats.kpm.toFixed(2)}));
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


            row.appendChild(UITableColumn({"content": d.kills, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": d.deaths, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": d.shots, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": d.hits, "parse": ["ignore0"]}));
            row.appendChild(UITableColumn({"content": `${d.accuracy.toFixed(2)}%` }));
            row.appendChild(UITableColumn({"content": d.damage, "parse": ["ignore0"]}));

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

        row.appendChild(UITableColumn({"content":p.ping_min}));
        row.appendChild(UITableColumn({"content":p.ping_avg}));
        row.appendChild(UITableColumn({"content":p.ping_max}));

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

                row.appendChild(UITableColumn({
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

                row.appendChild(UITableColumn({
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


        row.appendChild(UITableColumn({
            "content": player.damage.fallDamage,
            "parse": ["ignore0"]
        }));

        row.appendChild(UITableColumn({
            "content": player.damage.drownDamage,
            "parse": ["ignore0"]
        }));

        row.appendChild(UITableColumn({
            "content": player.damage.selfDamage,
            "parse": ["ignore0"]
        }));

        row.appendChild(UITableColumn({
            "content": player.damage.damageTaken,
            "parse": ["ignore0"]
        }));

        row.appendChild(UITableColumn({
            "content": player.damage.damageDelt,
            "parse": ["ignore0"]
        }));

        if(this.bAnyTeamDamage()){

            row.appendChild(UITableColumn({
                "content": player.damage.teamDamageTaken,
                "parse": ["ignore0"]
            }));

            row.appendChild(UITableColumn({
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
