
function createObjectStatRow(s, urlBase, idKey, objectName){

    const url = `${urlBase}${s[idKey]}`;
    
    return [
        {url, "display": s[objectName], "value": s[objectName].toLowerCase(), "className": "text-left"},
        {url,"value": s.matches},
        {url,"display": toPlaytime(s.playtime), "value": s.playtime, "className": "playtime"},
        {url,"display": toDateString(s.first_match, TIME_ZONE, true),"value": s.first_match, "className": "date"},
        {url,"display": toDateString(s.last_match, TIME_ZONE, true),"value": s.last_match, "className": "date"}
    ];
}

class SeasonPage{

    constructor(basicInfo, objectStats, bSkipSeasonLinks, pageSettings, 
        pageLayout, socialSettings, welcomeMessageSettings, recentMatches,
        mostActivePlayers
    ){

        this.parent = document.querySelector("#root");
        this.wrapper = UIDiv();
        this.basicInfo = basicInfo;
        this.objectStats = objectStats;
        this.bSkipSeasonLinks = bSkipSeasonLinks;

        this.pageLayout = pageLayout;
        this.pageSettings = pageSettings;
        this.socialSettings = socialSettings;
        this.welcomeMessageSettings = welcomeMessageSettings;
        this.recentMatches = recentMatches;
        this.mostActivePlayers = mostActivePlayers;

        console.log(this.pageLayout);
        console.log(this.pageSettings);

        this.renderElems();
    }

    addComponent(elems, settingName, layoutName, createCallback){

        if(this.pageSettings[settingName]){

            const content = createCallback();
            const compIndex = getPageComponentIndex(this.pageLayout, layoutName);

            if(compIndex === null) throw new Error(`failed to get ${layoutName} component index`);

            if(content !== null){
                elems[compIndex] = content;
            }
        }
    }

    renderElems(){

        const elems = [];

        this.addComponent(elems, "Display Welcome Message", "Welcome Message", () =>{
            return this.createWelcomeMessage();
        });
      
        this.addComponent(elems, "Display Season Info", "Season Info", () =>{
            return this.createSeasonInfo();
        });
      

        this.addComponent(elems, "Display Recent Matches", "Recent Matches", () =>{
            return this.createRecentMatches();
        });

        this.addComponent(elems, "Display Social Media", "Social Media", () =>{
            return this.createSocials();
        });

        this.addComponent(elems, "Display Servers", "Servers", () =>{

            return this.createServerList();
        });

        this.addComponent(elems, "Display Most Played Gametypes", "Most Played Gametypes", () =>{

            return this.createGametypeList();
        })


        this.addComponent(elems, "Display Most Played Maps", "Most Played Maps", () =>{
            return this.createMapsList();
        })


        this.addComponent(elems, "Display Most Active Players", "Most Active Players", () =>{

            return this.createMostActivePlayers();
        });

        for(let i = 0; i < elems.length; i++){

            if(elems[i] === undefined) continue;

            this.wrapper.append(elems[i]);
        }

        this.parent.append(this.wrapper);
    }

    createWelcomeMessage(){

        const title = this.welcomeMessageSettings["Welcome Title"];
        const message = this.welcomeMessageSettings["Welcome Message"];

        if(title === "" || message === "&#34;&#34;") return null;

        const wrapper = UIDiv();

        UIHeader(wrapper, title)
        const messageElem = UIDiv("welcome-message");

        if(message.length > 0){
            messageElem.innerHTML = message;
        }else{
            messageElem.innerHTML = "";
        }

        wrapper.append(messageElem);
        return wrapper;
    }


    createSeasonInfo(){

        const infoContent = [];

        if(this.basicInfo.start_date !== null && this.basicInfo.end_date !== null){

            infoContent.push(
                `Start Date ${toDateString(this.basicInfo.start_date, TIME_ZONE, true)}`,
                UIBr(),
                `End Date ${toDateString(this.basicInfo.end_date, TIME_ZONE, true)}`,
                UIBr()
            );

        }else{

            infoContent.push(`These are the all time totals, any match played you can find here, so seasons filtering is active.`);

        }

        const info = new UIInfo(null, infoContent);

        const elems = info.createElems();

        const wrapper = UIDiv();

        UIHeader(wrapper, this.basicInfo.name);
        wrapper.append(elems);

        return wrapper;
    }

    createRecentMatches(){

        const displayMode = this.pageSettings["Recent Matches Display Mode"];

        if(this.recentMatches.data.total === 0) return;

        const wrapper = UIDiv();
        wrapper.id = "home-recent-matches";
        UIHeader(wrapper, "Recent Matches");

        if(displayMode === "default"){
            new MatchesRichView(wrapper, this.recentMatches, this.basicInfo.id, this.bSkipSeasonLinks);
        }else{
            renderMatchesTable(wrapper, this.recentMatches, false, false, this.basicInfo.id, this.bSkipSeasonLinks);
        }

        return wrapper;
    }

    createSocials(){

        const settings = this.socialSettings;

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

        const wrapper = UIDiv("text-center");
        UIHeader(wrapper, "Find Us On Social Media");


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

        }

        return wrapper;
    }

    createServerList(){
        return this.createObjectList("Servers", "servers", "server_id", "sid")
    }


    createGametypeList(){
        return this.createObjectList("Gametypes", "gametypes", "gametype_id", "gid");
    }

    createObjectList(title, objectStatsKey, objectKey, urlKey){

        const tableOptions = {
            "className": "t-width-1",
            "headers": ["Name", "Total Matches", "Total Playtime", "First Match", "Last Match"].map((h) =>{
                return {"display": h}
            })
        };

        const wrapper = UIDiv();
        const rows = [];

        let urlBase = `/matches/?${urlKey}=`;

        if(!this.bSkipSeasonLinks){
            urlBase = `/season/${this.basicInfo.id}${urlBase}`;
        }

        for(let i = 0; i < this.objectStats[objectStatsKey].length; i++){

            const g = this.objectStats[objectStatsKey][i];

            rows.push(createObjectStatRow(g, urlBase, objectKey, "object_name"));
        }


        new UIHeader(wrapper, title);
        new TESTUITable(wrapper, tableOptions, rows);

        return wrapper;
    }

    createMapsList(){

        const wrapper = UIDiv();

        new UIHeader(wrapper, "Most Played Maps");
        
        if(this.pageSettings["Most Played Maps Display Mode"] === "default"){

            const testMaps = UIDiv(`new-rich-wrapper`);

            const maps = this.objectStats.maps;

            for(let i = 0; i < maps.length; i++){

                const m = maps[i];

                const url = (this.bSkipSeasonLinks) ? 
                `/map/${m.map_id}` : 
                `/season/${this.basicInfo.id}/map/${m.map_id}`;

                testMaps.append(UIRichMapBox(m, url));
            }

            wrapper.append(testMaps);
            return wrapper;

        }else{


            return this.createObjectList("Most Played Maps", "maps", "map_id", "mid");

        }
    }

    createMostActivePlayers(){

        if(this.mostActivePlayers.length === 0) return;

        const wrapper = UIDiv();

        UIHeader(wrapper, "Most Active Players");

        const rows = [];

        for(let i = 0; i < this.mostActivePlayers.length; i++){

            const d = this.mostActivePlayers[i];

            const playerLink = UIPlayerLink({
                "playerId": d.id,
                "name": d.name,
                "country": d.country,
                "bTableElem": true,
                "seasonId": this.seasonId,
                "bSkipSeasonLinks": this.bSkipSeasonLinks
            });

            rows.push([
                {"value": d.name.toLowerCase(), "display": playerLink, "bSkipTD": true},
                {"display": toDateString(d.last_active, TIME_ZONE, true), "value": d.last_active, "className": "date"},
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
            "className": "t-width-1",
            "bNoSort": true
        }, rows);

        return wrapper;
    }
    

 
}


function UISeasonStat(label, value){

    const elem = UIDiv("season-stat");
    const labelElem = UIDiv("season-stat-label");
    labelElem.append(label);

    const valueElem = UIDiv("season-stat-value");
    valueElem.append(value);

    elem.append(labelElem, valueElem);
    return elem;
}

function UISeasonInfo(parent, data){

    const wrapper = UIDiv("season-info");
    parent.append(wrapper);


    const ssw = UIDiv("season-stat-wrapper");
    wrapper.append(ssw);

    const test = UIDiv("season-name");
    test.append(data.name);

    ssw.append(test);
    ssw.append(UISeasonStat("Start Date", toDateString(data.start_date, TIME_ZONE, true)));
    ssw.append(UISeasonStat("End Date", toDateString(data.end_date, TIME_ZONE, true)));
    ssw.append(UISeasonStat("Total Matches", data.total_matches));

    ssw.append(UISeasonStat(`Total Players`, data.total_players));
    ssw.append(UISeasonStat(`Total Playtime`, toPlaytime(data.total_playtime)));
}

class SeasonsPage{

    constructor(data, mostPlayedMaps){

        this.parent = document.querySelector("#root");

        this.wrapper = UIDiv();

        UIHeader(this.wrapper, "Seasons");

        this.data = data;
        
        this.mostPlayedMaps = mostPlayedMaps;
  

        this.parent.append(this.wrapper);

        this.renderTestRichView();
        //this.renderBasicList();
    }

    renderTestRichView(){

        //this.wrapper.innerHTML = ``;

        const now = new Date();

        const nowISO = now.toISOString();


        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            const bActive = nowISO >= d.start_date && nowISO < d.end_date;

            const link = document.createElement("a");
            link.href = `/season/${d.id}/`;

            
            UISeasonInfo(link, d, bActive);
            this.wrapper.append(link);
        }
    }

    renderBasicList(){


        const tableOptions = {
            "className": "t-width-1",
            "headers": [
                {"display": "Name"},
                {"display": "Start Date"},
                {"display": "End Date"},
                {"display": "Total Matches"},
                {"display": "Total Players"},
                {"display": "Total Playtime"},
            ]
        };


        const rows = this.data.map((d) =>{

            const a = document.createElement("a");
            a.href = `/season/${d.id}`;
            a.append(d.name);
            return [
                {"display": a, "value": d.name, "className": "text-left"},
                {"value": d.start_date, "display": toDateString(d.start_date, TIME_ZONE, true), "className": "date"},
                {"value": d.end_date, "display": toDateString(d.end_date, TIME_ZONE, true), "className": "date"},
                {"value": d.total_matches},
                {"value": d.total_players},
                {"value": toPlaytime(d.total_playtime), "className": "playtime"},
            ]
        });

        new TESTUITable(this.wrapper, tableOptions, rows);
    }
}

function UISocial(parent, url, icon){

    const elem = document.createElement("a");
    elem.href = url;
    elem.target = "_blank";
    
    const img = document.createElement("img");
    img.src = `/images/${icon}`;
    img.className = "social-media-icon";
    img.alt = "social-icon";

    elem.append(img);
    parent.append(elem);
 
}