
function mapObjectStats(s){
    return [
        {"display": s.object_name, "value": s.object_name.toLowerCase(), "className": "text-left"},
        {"value": s.matches},
        {"display": toPlaytime(s.playtime), "value": s.playtime, "className": "playtime"},
        {"display": toDateString(s.first_match, TIME_ZONE, true),"value": s.first_match},
        {"display": toDateString(s.last_match, TIME_ZONE, true),"value": s.last_match}
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
            `End Date ${toDateString(this.basicInfo.end_date, TIME_ZONE, true)}`
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

        const test = (s) =>{

            return [
                {"display": s.object_name, "value": s.object_name.toLowerCase(), "className": "text-left"},
                {"value": s.matches},
                {"display": toPlaytime(s.playtime), "value": s.playtime, "className": "playtime"},
                {"display": toDateString(s.first_match, TIME_ZONE, true),"value": s.first_match, "className": "date"},
                {"display": toDateString(s.last_match, TIME_ZONE, true),"value": s.last_match, "className": "date"}
            ];
        }


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

class SeasonsPage{

    constructor(data){

        this.parent = document.querySelector("#root");

        this.wrapper = UIDiv();

        UIHeader(this.parent, "Seasons");

        this.data = data;
        console.log(data);

        this.parent.append(this.wrapper);

        this.renderBasicList();
    }


    renderBasicList(){


        const tableOptions = {
            "className": "t-width-1",
            "headers": [
                {"display": "Name"},
                {"display": "Start Date"},
                {"display": "End Date"},
            ]
        };


        const rows = this.data.map((d) =>{

            const a = document.createElement("a");
            a.href = `/season/${d.id}`;
            a.append(d.name);
            return [
                {"display": a, "value": d.name},
                {"value": toDateString(d.start_date, TIME_ZONE, true)},
                {"value": toDateString(d.end_date, TIME_ZONE, true)}
            ]
        });

        new TESTUITable(this.wrapper, tableOptions, rows);
    }
}