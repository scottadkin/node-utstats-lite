
function mapObjectStats(s){
    return [
        {"display": s.object_name, "value": s.object_name.toLowerCase(), "className": "text-left"},
        {"value": s.matches},
        {"display": toPlaytime(s.playtime), "value": s.playtime, "className": "playtime"},
        {"display": toDateString(s.first_match, TIME_ZONE, true),"value": s.first_match, "className": "date"},
        {"display": toDateString(s.last_match, TIME_ZONE, true),"value": s.last_match, "className": "date"}
    ];
}

class SeasonPage{

    constructor(basicInfo, objectStats){

        this.parent = document.querySelector("#root");
        this.wrapper = UIDiv();
        this.basicInfo = basicInfo;
        this.objectStats = objectStats;


        UIHeader(this.wrapper, this.basicInfo.name);

        this.parent.append(this.wrapper);

        this.renderInfo();
        this.renderObjectStats();
    }


    renderInfo(){


        this.info = new UIInfo(this.wrapper, [

            `Start Date ${toDateString(this.basicInfo.start_date, TIME_ZONE, true)}`,
            UIBr(),
            `End Date ${toDateString(this.basicInfo.end_date, TIME_ZONE, true)}`,
            UIBr()
        ]);
    }

    renderObjectStats(){


        const tableOptions = {
            "className": "t-width-1",
            "headers": [
                {"display": "Name"},
                {"display": "Total Matches"},
                {"display": "Total Playtime"},
                {"display": "First Match"},
                {"display": "Last Match"},
            ]
        };

        new UIHeader(this.wrapper, "Servers");

 

        const serversRows = this.objectStats.servers.map(mapObjectStats)
        const gametypeRows = this.objectStats.gametypes.map(mapObjectStats)
        const mapRows = this.objectStats.maps.map(mapObjectStats)


        new TESTUITable(this.wrapper, tableOptions, serversRows);
        new UIHeader(this.wrapper, "Gametypes");
        new TESTUITable(this.wrapper, tableOptions, gametypeRows);
        new UIHeader(this.wrapper, "Maps");
        new TESTUITable(this.wrapper, tableOptions, mapRows);
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

function UISeasonInfo(parent, data, bActive, mostPlayedMaps){

    const section = new UISection(parent, data.name);
    section.elem.className = "season-info";

    if(bActive) section.elem.className += ` season-active`;


    const content = [];

   
    
    const ssw = UIDiv("season-stat-wrapper");

    content.push(ssw);


    ssw.append(UISeasonStat("Start Date", toDateString(data.start_date, TIME_ZONE, true)));
    ssw.append(UISeasonStat("End Date", toDateString(data.end_date, TIME_ZONE, true)));
    ssw.append(UISeasonStat("Total Matches", data.total_matches));

    ssw.append(UISeasonStat(`Total Players`, data.total_players));
    ssw.append(UISeasonStat(`Total Playtime`, toPlaytime(data.total_playtime)));
 

    for(let i = 0; i < mostPlayedMaps.length; i++){

        const m = mostPlayedMaps[i];

        const image = document.createElement("img");
        image.src = getMapThumbOrFullSize(m);

        const test = UIDiv();
        test.append(
            m.name, 
            UIBr(), 
            `${m.total_matches} Matches Played`,
            image);

        ssw.append(UISeasonStat(`${i+1}${getOrdinal(i+1)} Most Played Map`, test));
    }


    section.setContent(content);

    


}

class SeasonsPage{

    constructor(data, mostPlayedMaps){

        this.parent = document.querySelector("#root");

        this.wrapper = UIDiv();

        this.data = data;
        
        this.mostPlayedMaps = mostPlayedMaps;
        console.log(data);

        this.parent.append(this.wrapper);

        this.renderTestRichView();
        //this.renderBasicList();
    }

    renderTestRichView(){

        this.wrapper.innerHTML = ``;

        const now = new Date();

        const nowISO = now.toISOString();


        for(let i = 0; i < this.data.length; i++){

            const d = this.data[i];

            const bActive = nowISO >= d.start_date && nowISO < d.end_date;

           // const link = document.createElement("a");
           // link.href = `/season/${d.id}/`;
            console.log(d);
            console.log(this.mostPlayedMaps[d.id]);
            
            UISeasonInfo(this.wrapper, d, bActive, this.mostPlayedMaps[d.id]);
           // this.wrapper.append(link);
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
                {"display": a, "value": d.name},
                {"value": toDateString(d.start_date, TIME_ZONE, true)},
                {"value": toDateString(d.end_date, TIME_ZONE, true)},
                {"value": d.total_matches},
                {"value": d.total_players},
                {"value": d.total_playtime},
            ]
        });

        new TESTUITable(this.wrapper, tableOptions, rows);
    }
}