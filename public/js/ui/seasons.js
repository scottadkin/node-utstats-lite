
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

    constructor(basicInfo, objectStats, mostPlayedMaps){

        this.parent = document.querySelector("#root");
        this.wrapper = UIDiv();
        this.basicInfo = basicInfo;
        this.objectStats = objectStats;
        this.mostPlayedMaps = mostPlayedMaps;


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


    renderTestMaps(){

        const testMaps = UIDiv(`test-maps`);

        for(let i = 0; i < this.mostPlayedMaps.length; i++){

            const m = this.mostPlayedMaps[i];
            const image = getMapThumbOrFullSize(m);

            const wrapper = UIDiv(`test-map-wrapper`);

            const imgWrapper = UIDiv(`test-map-img-wrapper`);

            const imgElem = document.createElement("img");
            imgElem.src = image;
            imgElem.className = `test-map-img`;

            imgWrapper.append(imgElem);

            

            const info = UIDiv(`test-map-info`);

            const title = UIDiv(`test-map-title`);
            title.append(m.name);

            info.append(title, `${m.total_matches} Matches Played`);
            info.append(UIBr(), `Playtime ${toPlaytime(m.total_playtime, false)}`);
            wrapper.append(imgWrapper, info);



            const a = document.createElement("a");
            a.href = `/season/${this.basicInfo.id}/map/${m.map_id}`;

            a.append(wrapper);

            testMaps.append(a);
        }


        this.wrapper.append(testMaps);


    }

    renderObjectStats(){


        const topMaps = UIDiv();

        

        UIHeader(topMaps, "Top 3 Maps Of The Season");
        const testData = [];

        const totalParts = (this.mostPlayedMaps.length >= 2) ? 3 : this.mostPlayedMaps.length;

        for(let i = 0; i < totalParts; i++){

            const m = this.mostPlayedMaps[i];
            const image = getMapThumbOrFullSize(m);

            testData.push({
                "name": m.name,
                "image": image,
                "info":`${m.total_matches} Matches Played`,
                "url": `/season/${this.basicInfo.id}/map/${m.map_id}`
            });
        }

       // new UIPodium(topMaps, testData);

        

        //this.wrapper.append(topMaps);
       
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
        //const mapRows = this.objectStats.maps.map(mapObjectStats)


        new TESTUITable(this.wrapper, tableOptions, serversRows);
        new UIHeader(this.wrapper, "Gametypes");
        new TESTUITable(this.wrapper, tableOptions, gametypeRows);
        new UIHeader(this.wrapper, "Maps");
        this.renderTestMaps();
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
        console.log(data);

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