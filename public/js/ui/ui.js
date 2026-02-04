function UIMatchScoreBox(parent, data, small, bTableElem){

    const wrapper = document.createElement((bTableElem) ? "td" : "div");

    let wrapperClassName = "solo";

    if(data.total_teams === 2) wrapperClassName = "duo";
    if(data.total_teams === 3) wrapperClassName = "trio";
    if(data.total_teams === 4) wrapperClassName = "quad";

    if(data.total_teams > 1){

        for(let i = 0; i < data.total_teams; i++){

            let image = null;

            if(!small){
                image = document.createElement("img");
                image.src = `/images/${getTeamIcon(i)}`;
                image.alt = "image";
            }

            const currentElem = document.createElement("div");
            currentElem.className = getTeamColorClass(i);

            if(image !== null){
                currentElem.append(image);
            }


            const currentScoreElem = document.createElement("div");
            if(!small){
                currentScoreElem.className = `match-scorebox-score`;
            }
            currentScoreElem.innerHTML = data[`team_${i}_score`];

            currentElem.append(currentScoreElem);

            wrapper.append(currentElem);
        }

    }else{

        let image = null;

        if(!small){
            image = document.createElement("img");
            
            image.src = `/images/${getTeamIcon(255)}`;
            image.alt = "image";
        }

        const currentElem = document.createElement("div");
        currentElem.className = getTeamColorClass(255);

        if(image !== null){
            currentElem.append(image);
        }


        const currentScoreElem = document.createElement("div");
        if(!small){
            currentScoreElem.className = `match-scorebox-score`;
        }
        currentScoreElem.innerHTML = `${data.solo_winner_name} Wins with ${data.solo_winner_score}`;

        currentElem.append(currentScoreElem);

        wrapper.append(currentElem);

    }

    if(!small) wrapperClassName = `match-scorebox-wrapper ${wrapperClassName} team-none`;

    wrapper.className = wrapperClassName;

    parent.append(wrapper);
}

function UICountryFlag(country){

    if(country === "") country = "xx";

    const elem = document.createElement("img");
    elem.className = "country-flag";

    elem.src = `/images/flags/${country}.svg`;

    return elem;
}


function UIPlayerLink(params){

    let {playerId, className, country, bTableElem, name, bHeaderElem} = params;

    if(className === undefined) className = "";
    if(country === undefined) country = "";
    if(country === "") country = "xx";
    if(bTableElem === undefined) bTableElem = false;
    if(bHeaderElem === undefined) bHeaderElem = false;

    const elem = document.createElement("a");

    if(!bHeaderElem){
        className += ` player-name-td`;
    }

    if(!bTableElem && className !== "") elem.className = className;

    elem.href = `/player/${playerId}`;
    const text = document.createTextNode(name ?? "Not Found");
    elem.appendChild(UICountryFlag(country));
    elem.appendChild(text);


    if(!bTableElem) return elem;

    const wrapper = document.createElement((bHeaderElem) ? "th" : "td");
    if(className !== "") wrapper.className = className;
    wrapper.appendChild(elem);
    return wrapper;
}

function UITableHeaderColumn(params){

    let content = params.content ?? "";

    const elem = document.createElement("th");
    const text = document.createTextNode(content);

    if(params.className !== undefined){
        elem.className = params.className;
    }

    if(params.url === undefined){
        elem.appendChild(text);
    }else{
        const a = document.createElement("a");
        a.append(text);
        a.href = params.url;
        elem.append(a);
    }

    return elem;
}

function UITableColumn(params){

    const contentType = typeof params.content;

    let content = params.content ?? "";
    let className = params.className ?? "";

    const elem = document.createElement("td");
    if(className !== "") elem.className = className;

    if(params.id !== undefined) elem.id = params.id;

    if(params.parse != undefined){

        const parse = params.parse;

        if(parse.indexOf("playtime") !== -1){
            content = toPlaytime(content);
        }

        if(parse.indexOf("ignore0") !== -1){
            content = ignore0(content);
        }

        if(parse.indexOf("mmss") !== -1){
            content = MMSS(content);
        }

        if(parse.indexOf("date") !== -1){
            content = toDateString(content, true);
        }

        if(parse.indexOf("ordinal") !== -1){

            content = `${content}${getOrdinal(content)}`;
        }
    }


    const text = document.createTextNode(content);

    if(params.url !== undefined){

        const url = document.createElement("a");
        url.href = params.url;

        if(params.urlTarget !== undefined) url.target = params.urlTarget;
        url.append(text);
        elem.append(url);

    }else{

        if(contentType != "object"){
            elem.append(text);
        }else{
            elem.append(content);
        }
    }
    
    return elem;
}


function UIPaginationButton(page, currentPage, url, changePage){

    if(typeof url === "string"){
        const elem = document.createElement("a");
        elem.className = `pagination-button ${(page === currentPage) ? "pagination-active" : ""}`;
        elem.innerHTML = page;
        elem.href = `${url}${page}`;
        return elem;
    }else{
       // url();
        const elem = document.createElement("div");
        elem.className = `pagination-button ${(page === currentPage) ? "pagination-active" : ""}`;
        elem.innerHTML = page;
        elem.addEventListener("click", () =>{
            url(page);
            changePage(page);
        });
        //const dummy = document.createElement("div");
        //return dummy;

        return elem;
    } 
}

class UIPagination{

    constructor(parent, url, totalResults, perPage, currentPage){

        this.parent = parent;
        this.url = url;
        this.totalPages = 1;

        if(perPage > 0 && totalResults > 0){
            this.totalPages = Math.ceil(totalResults / perPage);
        }

        this.totalResults = totalResults;

        this.currentPage = parseInt(currentPage);

        this.wrapper = document.createElement("div");

        this.render();
    }

    updateResults(currentPage, totalResults, perPage){

        this.totalPages = 1;

        if(perPage > 0 && totalResults > 0){
            this.totalPages = Math.ceil(totalResults / perPage);
        }

        this.totalResults = totalResults;

        this.currentPage = parseInt(currentPage);

        this.render();
    }
    
    render(){

        this.wrapper.innerHTML = "";

        if(this.totalPages <= 1){
            this.wrapper.className = "hidden";
            return;
        }
 
        this.wrapper.className = "pagination-wrapper";

        const info = document.createElement("div");
        info.className = "pagination-info";
        info.innerHTML = `Displaying Page ${this.currentPage} of ${this.totalPages}<br>Total Results ${this.totalResults}`;

        this.wrapper.appendChild(info);

        const buttons = document.createElement("div");

        const changePage = (newPage) =>{
            this.currentPage = newPage;
            this.render();
        }

        buttons.appendChild(UIPaginationButton(1, this.currentPage, this.url, changePage));
        
        if(this.currentPage - 2 > 1){
            buttons.appendChild(UIPaginationButton(this.currentPage - 2, this.currentPage, this.url,changePage));
        }

        if(this.currentPage - 1 > 1){
            buttons.appendChild(UIPaginationButton(this.currentPage - 1, this.currentPage, this.url,changePage));
        }

        if(this.currentPage !== 1 && this.currentPage !== this.totalPages){
            buttons.appendChild(UIPaginationButton(this.currentPage, this.currentPage, this.url,changePage));
        }

        if(this.currentPage + 1 < this.totalPages){
            buttons.appendChild(UIPaginationButton(this.currentPage + 1, this.currentPage, this.url, changePage));
        }

        if(this.currentPage + 2 < this.totalPages){
            buttons.appendChild(UIPaginationButton(this.currentPage + 2, this.currentPage, this.url, changePage));
        }

        if(this.totalPages > 1){
            buttons.appendChild(UIPaginationButton(this.totalPages, this.currentPage, this.url, changePage));
        }

        this.wrapper.appendChild(buttons);

        this.parent.appendChild(this.wrapper);

    }
}


class UITabs{

    constructor(parent, options, initialMode){

        this.parent = parent;
        this.options = options;
        this.mode = initialMode ?? options?.[0]?.value ?? null;

        this.wrapper = document.createElement("div");
        this.wrapper.className = "tabs-wrapper";


        this.parent.appendChild(this.wrapper);

        this.createTabs();
        this.render();
    }

    setMode(value){
        this.mode = value;
        this.render();
    }

    createTabs(){

        this.tabs = [];

        for(let i = 0; i < this.options.length; i++){

            const {display, value} = this.options[i];

            this.tabs[i] = document.createElement("div");
            this.tabs[i].className = "tab";
            const text = document.createTextNode(display);
            this.tabs[i].appendChild(text);

            this.tabs[i].addEventListener("click", (e) =>{

                this.mode = value;
                this.render();

                this.wrapper.dispatchEvent(new CustomEvent("tabChanged", {
                    "detail": {
                        "newTab": value,
                    },
                }));
            });

            this.wrapper.appendChild(this.tabs[i]);
        }
        
    }

    render(){

        for(let i = 0; i < this.tabs.length; i++){

            const t = this.tabs[i];

            if(this.mode === this.options[i].value){
                t.className = "tab tab-selected";
            }else{
                t.className = "tab";
            }
        }
    }
}

function UIHeader(parent, text, id){

    if(typeof parent === "string"){
        parent = document.querySelector(parent);
    }

    const elem = document.createElement("div");
    elem.className = "header-wrapper";

    if(id !== undefined){

        elem.id = id;
        const a = document.createElement("a");
        a.href = `#${id}`;
        a.innerHTML = text;
        elem.append(a);

    }else{
        elem.append(document.createTextNode(text));
    }

    parent.append(elem);
}

function UIDiv(className){

    const elem = document.createElement("div");
    if(className !== undefined) elem.className = className;

    return elem;
}


function UIBr(){
    return document.createElement("br");
}

/**
 * bold elem
 */
function UIB(text){
    
    const elem = document.createElement("b");
    elem.append(text);
    return elem;
}


function UISpan(text, className){

    const elem = document.createElement("span");

    if(className !== undefined) elem.className = className;
    elem.appendChild(document.createTextNode(text));

    return elem;
}

function UITextNode(input){
    return document.createTextNode(input);
}

function UILabel(label, htmlFor){

    const elem = document.createElement((htmlFor === undefined) ? "span" : "label");

    if(htmlFor === undefined) elem.className = "form-label";

    if(htmlFor !== undefined){
        elem.htmlFor = htmlFor;
    }
    elem.innerHTML = label;

    return elem;
}

function UIInput(type, name, initialValue, placeholder, callback){

    type = type.toLowerCase();

    if(initialValue === undefined) initialValue = "";
    if(placeholder === undefined) placeholder = "";

    const input = document.createElement("input");
    input.type = type;
    input.name = input.id = name;

    let className = "";

    if(type === "text" || type === "number" || type === "password"){
        className = "textbox";
    }

    if(className !== "") input.className = className;

    input.value = initialValue;
    input.placeholder = placeholder;

    if(callback !== undefined){
        
        input.addEventListener("input", (e) =>{
            callback(e.target.value);
        });
    }

    return input;
}

function UIFormInputRow(labelString, id, type, value, placeholder, callback){

    if(value === undefined) value = "";
    if(placeholder === undefined) placeholder = "";

    const row = document.createElement("div");
    row.className = "form-row";

    const label = document.createElement("label");
    label.htmlFor = id;
    label.innerHTML = labelString;

    row.appendChild(label);

    const input = document.createElement("input");
    input.type = type;
    input.name = id;
    input.id = id;
    input.className = "textbox";
    input.value = value;

    if(callback !== undefined){
        input.addEventListener("input", (e) =>{
            callback(e.target.value);
        });
    }

    row.appendChild(input);

    return row;

}


function UIStaticTrueFalse(value, bTableElem){

    if(bTableElem === undefined) bTableElem = false;

    const elem = document.createElement((bTableElem) ? "td" : "div");

    let string = "False";
    let className = "false";

    if(value){
        string = "True";
        className = "true";
    }

    elem.innerHTML = string;
    elem.className = `${className} text-center`;
    
    return elem;
}

/**
 * Use UIStaticTrueFalse for non editable version
 * @param {*} initialValue 
 * @param {*} name 
 * @param {*} bTableElem 
 * @returns 
 */
class UITrueFalse{
    
    constructor(initialValue, name, bTableElem, callback){

        if(bTableElem === undefined) bTableElem = false;


        this.value = initialValue;

        this.wrapper = document.createElement((bTableElem) ? "td" : "div");
        this.elem = UIDiv();

        this.elem.addEventListener("click", () =>{

            this.value = !this.value;
            this.hidden.value = this.value;
            if(callback !== undefined) callback(this.value);
            this.render();
        });

        this.wrapper.appendChild(this.elem);

        this.hidden = document.createElement("input");
        this.hidden.type = "hidden";
        this.hidden.name = this.hidden.id = name;
        this.hidden.value = initialValue;

        this.wrapper.appendChild(this.hidden);

        this.render();
    }

    render(){

        let text = "True";
        let className = "true";

        if(!this.value){
            text = "False";
            className = "false";
        }

        this.elem.innerHTML = text;
        this.elem.className = `${className} white no-user-select hover`;
    }
}

class UINotification{

    constructor(parent, type, title, content, callback){

        this.parent = parent;
        this.type = type.toLowerCase();
        this.title = title;
        this.content = content;
        this.callback = callback ?? null;
        this.date = new Date(Date.now());

        this.wrapper = UIDiv();

        this.title = UIDiv("notification-title");
        this.title.append(title);

        this.elem = UIDiv("notification-content");

        this.closeButton = document.createElement("input");
        this.closeButton.type = "button";
        this.closeButton.value = "Close Notification";
        this.closeButton.className = "small-button margin-bottom-1";


        this.dateElem = UIDiv("tiny-font");
        this.dateElem.append(this.date);

        this.wrapper.append(this.title, this.elem, this.closeButton, this.dateElem);

        this.parent.append(this.wrapper);

        this.createEvents();
        this.render();
    }

    createEvents(){

        this.closeButton.addEventListener("click", () =>{

            if(this.callback !== null){
                this.callback();
            }
            this.wrapper.remove();
            
        });
    }

    render(){

         if(typeof this.content !== "object"){
            this.elem.appendChild(document.createTextNode(this.content));
        }else{
            this.elem.appendChild(this.content);
        }

        let className = `team-none`;

        if(this.type === "pass") className = "team-green";
        if(this.type === "error") className = "team-red";
        if(this.type === "warning") className = "team-yellow";

        this.wrapper.className = `notification ${className}`;
    }
}



class UIWatchlistButton{

    constructor(parent, type, hash){

        type = type.toLowerCase();
        const validTypes = ["matches", "players"];

        if(validTypes.indexOf(type) === -1){
            throw new Error(`${type} is not a valid type for UIWatchlistButton`);
        }

        this.parent = parent;
        this.type = type;

        
        this.hash = hash;

        this.elem = UIDiv();
        this.parent.appendChild(this.elem);

        this.createEvents();
        
        this.render();
    }

    createEvents(){

        this.elem.addEventListener("click", () =>{
            
             if(!bAddedToWatchlist(this.type, this.hash)){
                addToWatchlist(this.type, this.hash);
            }else{
                removeFromWatchlist(this.type, this.hash);
            }

            this.render();
        });
    }


    render(){

        let display = "Unknown";

        if(this.type === "matches") display = "Match";
        if(this.type === "players") display = "Player";


        if(bAddedToWatchlist(this.type, this.hash)){

            this.elem.className = "fav fav-del";
            this.elem.innerHTML = `Remove ${display} From Watchlist`;
            return;
        }

        this.elem.className = "fav fav-add";
        this.elem.innerHTML = `Add ${display} To Watchlist`;   
    }
}


function UICopyURLToClipboard(parent, text, url){

    const button = UIDiv("perma-link");
    button.append(text);
    button.addEventListener("click", async () =>{

        await navigator.clipboard.writeText(`${window.location.host}${url}`);
    });
    parent.append(UIBr(), button);
}

class UISelect{

    constructor(parent, options, initialValue, callback){

        this.parent = parent;
        this.options = options;
        this.initialValue = initialValue;

        this.select = document.createElement("select");

        this.select.addEventListener("change", (e) =>{
            if(callback !== undefined){
                callback(e.target.value);
            }
        });

        this.createOptions();

        this.parent.append(this.select);
    }

    createOptions(){

        for(let i = 0; i < this.options.length; i++){

            const {value, display} = this.options[i];

            const elem = document.createElement("option");
            elem.value = value;
            elem.append(display);
            if(value == this.initialValue) elem.selected = true;
            this.select.append(elem);
        }
    }
}

class UIPerPageSelect{

    constructor(parent, initialValue, name, callback){

        const perPageValues = [5,10,15,20,25,50,75,100];

        this.elem = new UISelect(parent, perPageValues.map((p) =>{
            return {"value": p, "display": p};
        }), initialValue, callback);

        if(name !== null){
            this.elem.select.name = this.elem.select.id = name;
        }
    }
}

class UIOrderSelect{

    constructor(parent, initialValue, callback){

        this.elem = new UISelect(parent, [
            {"value": "ASC", "display": "Ascending"},
            {"value": "DESC", "display": "Descending"},
        ], initialValue, callback);
    }
}

class UIPlayerSortBySelect{

    constructor(parent, initialValue, callback){

        const options =  [
            {"value": "name", "display": "Name"}, 
            {"value": "last_active", "display": "Last Active"}, 
            {"value": "score", "display": "Score"}, 
            {"value": "frags", "display": "Frags"}, 
            {"value": "kills", "display": "Kills"}, 
            {"value": "deaths", "display": "Deaths"}, 
            {"value": "suicides", "display": "Suicides"}, 
            {"value": "eff", "display": "Efficiency"}, 
            {"value": "matches", "display": "Matches"}, 
            {"value": "playtime", "display": "Playtime"}
        ];

        this.elem = new UISelect(parent, options, initialValue, callback);
    }

    setName(name){
        this.elem.select.name = this.elem.select.id = name;
    }
}


class UILastActiveSelect{

    constructor(parent, initialValue, name, callback){

        const options = [
            {"display": "24 Hours", "value": 1},
            {"display": "7 Days", "value": 7},
            {"display": "14 Days", "value": 14},
            {"display": "28 Days", "value": 28},
            {"display": "90 Days", "value": 90},
            {"display": "365 Days", "value": 365},
            {"display": "No Limit", "value": 0}
        ];

        this.elem = new UISelect(parent, options, initialValue, callback);

        if(name !== null){
            this.elem.select.name = this.elem.select.id = name;
        }
    }
}

class UICTFLeagueModeSelect{

    constructor(parent, initialValue, name, callback){

        const options = [
            {"display": "Combined", "value": "combined"},
            {"display": "Gametypes", "value": "gametypes"},
            {"display": "Maps", "value": "maps"},
        ];

        this.elem = new UISelect(parent, options, initialValue, callback);

        if(name !== null){
            this.elem.select.name = this.elem.select.id = name;
        }
    }
}

class UIRecordsModeSelect{

    constructor(parent, initialValue, callback){

        this.elem = new UISelect(parent, [
            {"display": "Single Match", "value": "match"},
            {"display": "Lifetime", "value": "lifetime"},
        ], initialValue, callback);
    }
}

class UIRecordsTypeSelect{

    constructor(parent, recordMode, initialValue, validTypes, callback){

        if(recordMode !== "match" && recordMode !== "lifetime"){
            throw new Error(`Not a valid record type (${recordMode})`);
        }

        const types = (recordMode === "match") ? validTypes.matches : validTypes.lifetime;

        this.elem = new UISelect(parent, types, initialValue, callback);
    }
}

class UIHeatmapModeSelect{

    constructor(parent, initialValue, callback){

        this.elem = new UISelect(parent, [
            {"display": "Matches Played", "value": "matches"},
            {"display": "Total Players", "value": "players"},
            {"display": "Total Playtime", "value": "playtime"},
        ], initialValue, callback);
    }
}

class UIPlayerHeatmapModeSelect{

    constructor(parent, initialValue, callback){

        this.elem = new UISelect(parent, [
            {"display": "Matches Played", "value": "matches"},
            {"display": "Total Playtime", "value": "playtime"},
            {"display": "Daily Winrate", "value": "winrate"},
            {"display": "Wins", "value": "wins"},
            {"display": "Draws", "value": "draws"},
            {"display": "Losses", "value": "losses"},
        ], initialValue, callback);
    }
}


function UIMapRichBox(data){

    const link = document.createElement("a");
    link.href = `/map/${data.id}`;

    const wrapper = document.createElement("div");
    wrapper.className = "rich-wrapper";

    const title = document.createElement("div");
    title.className = "rich-title";
    title.appendChild(document.createTextNode(data.name));

    wrapper.appendChild(title);

    const image = document.createElement("img");
    image.className = "rich-image";
    image.src = `/images/maps/${data.image}`;
    wrapper.appendChild(image);

    const info = document.createElement("div");
    info.className = "rich-info";
    info.appendChild(document.createTextNode(`${data.matches} Match${(data.matches === 1) ? "" : "es"} Played`));

    info.appendChild(document.createElement("br"));
    info.appendChild(document.createTextNode(`Playtime ${toPlaytime(data.playtime)}`));
    info.appendChild(document.createElement("br"));
    info.appendChild(document.createTextNode(`Last Match ${toDateString(data.last_match, true)}`));

    wrapper.appendChild(info);

    link.appendChild(wrapper);
    return link;
}

class UIBasicMouseOver{

    constructor(parent, title, content){

        this.parent = parent;
        this.wrapper = UIDiv();

        const titleElem = UIDiv("basic-mouse-over-title");
        titleElem.append(title);

        const contentElem = UIDiv("basic-mouse-over-content");
        contentElem.append(content);

        this.wrapper.append(titleElem, contentElem);
        
        this.hide();
    }

    hide(){
        this.wrapper.className = "hidden";
    }

    removePx(value){
        if(typeof value !== "string") return value;
        return parseInt(value.replace(/\D/ig, ""));
    }

    display(){

        this.wrapper.className = "basic-mouse-over";

        const bounds = this.wrapper.getBoundingClientRect();

        const test = window.getComputedStyle(this.parent);

        let paddingTop = test.getPropertyValue("padding-top");
        let paddingLeft = test.getPropertyValue("padding-left");

        if(paddingTop !== ""){
            paddingTop = this.removePx(paddingTop);
        }else{
            paddingTop = 0;
        }

        if(paddingLeft !== ""){
            paddingLeft = this.removePx(paddingLeft);
        }else{
            paddingTop = 0;
        }


        const marginTop = bounds.height + paddingTop
        const marginLeft = paddingLeft;

        this.wrapper.style.cssText = `margin-top:-${marginTop}px;margin-left:-${marginLeft}px;`;

    }
}

class UICalendarHeatMap{

    constructor(parent, options){

        this.parent = document.querySelector(parent);

        this.jsonURL = options?.jsonURL ?? "/json/unkown/";
        this.div = UIDiv("text-center");
        this.parent.append(this.div);

        this.wrapper = UIDiv("calendar-heatmap text-center");

        this.now = new Date(Date.now());

        this.currentYear = this.now.getFullYear();
        this.currentMonth = this.now.getMonth();
        this.currentDate = this.now.getDate();

        this.selectedYear = this.now.getFullYear();
        this.selectedMonth = this.now.getMonth();

        this.selectedMode = options?.defaultMode ?? "playtime";
        //cache data instead of fetching the same data twice
        this.data = {};

        UIHeader(this.div, options?.header ?? "Heatmap");

    }

    init(){

        if(this.modes === undefined){
            this.modes = [
                {"display": "By Playtime", "value": "playtime"},
                {"display": "By Total Matches", "value": "matches"},
                {"display": "By Total Players", "value": "players"},    
            ];
        }

        if(this.targetPlayer !== null){
            this.heatmapType = "players";
        }else{
            this.heatmapType = "matches";
        }
        

        this.createTabs();
        this.div.append(this.wrapper);

        this.createHeatMap();
        this.render();
        this.loadData();
    }

    createTabs(){
      
        this.tabs = new UITabs(this.div, this.modes, this.selectedMode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{
            this.selectedMode = e.detail.newTab;
            this.render();
        });
    }

    async loadData(){

        try{

            const dateKey = `${this.selectedYear}-${this.selectedMonth}`;

            //we cache data that we have already fetched
            if(this.data[dateKey] !== undefined){
                this.render();
                return;
            }

            let slug = `?y=${this.selectedYear}&m=${this.selectedMonth}`;

            const keysToSlugs = {
                "targetGametype": "gid",
                "targetMap": "mid",
                "targetPlayer": "pid",
            };


            for(const [varName, keyName] of Object.entries(keysToSlugs)){

                if(this[varName] !== undefined){
                    slug += `&${keyName}=${this[varName]}`;
                }
            }
    
            const req = await fetch(`${this.jsonURL}${slug}`);
            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            this.data[dateKey] = res.data;
       
            this.render();

        }catch(err){
            new UINotification(this.parent, "error", "Failed To Load Data", err.toString());
        }
    }

    createHeatMap(){
 
        this.buttons = UIDiv("calendar-heatmap-buttons");

        this.previous = document.createElement("button");
        this.previous.innerHTML = "Previous Month";

        this.previous.addEventListener("click", () =>{

            if(this.selectedMonth - 1 < 0){
                this.selectedMonth = 11;
                this.selectedYear--;    
            }else{
                this.selectedMonth--;
            }

            this.loadData();
        });

        this.next = document.createElement("button");
        this.next.innerHTML = "Next Month";

        this.next.addEventListener("click", () =>{

            if(this.selectedMonth + 1 > 11){
                this.selectedMonth = 0;
                this.selectedYear++;
            }else{
                this.selectedMonth++;
            }

            this.loadData();
        });

        this.buttons.append(this.previous, this.next);
        this.wrapper.append(this.buttons);

        this.title = UIDiv("calendar-heatmap-title");
        this.updateTitle();
        this.wrapper.append(this.title);

        this.content = UIDiv("calendar-heatmap-content");
        this.wrapper.append(this.content);

    }

    updateTitle(){

        this.title.innerHTML = `${getMonthName(this.selectedMonth, true)} ${this.selectedYear}`;
        
        const endOfMonth = new Date(this.selectedYear, this.selectedMonth + 1, -1);
        //starts at 0 not 1
        this.lastDayOfMonth = endOfMonth.getDate(); 

        const start = new Date(this.selectedYear, this.selectedMonth, 1);

        //0-6
        this.startDayOfMonth = start.getDay();
        
    }

    createHeaderColumns(){

        const row = UIDiv("calendar-heatmap-week");

        for(let i = 0; i < 7; i++){
            const elem = UIDiv("calendar-heatmap-day calendar-heatmap-day-header");

            const dayName = getDayName(i);
            elem.innerHTML = dayName[0];
            elem.title = dayName;
            row.append(elem);
        }

        return row;
    }

    calcMinMax(){

        this.max = {};

        const data = this.data[`${this.selectedYear}-${this.selectedMonth}`];
        if(data === undefined) return;

        for(const stats of Object.values(data)){

            for(let i = 0; i < this.modes.length; i++){

                const key = this.modes[i].value;
                const value = stats[key];
                if(this.max[key] === undefined) this.max[key] = 0;

                if(this.max[key] < value) this.max[key] = value;
            }
        }

    }

    calculatePercent(stats){

        let max = 0;

        max = this.max[this.selectedMode];

        if(max === undefined) throw new Error(`this.max.${this.selectedMode} not found`);

        const value = stats[this.selectedMode];

        if(value === 0 || max === 0) return 0;

        return (value > 0) ? value / max: 0;
    }


    createDayElem(i, dayOfWeek, stats){

        let bDateMatchToday = false;

        if(this.selectedYear === this.currentYear
            && this.currentMonth === this.selectedMonth 
            && i + 1 === this.currentDate
        ){ 
            bDateMatchToday = true;      
        }

        const elem = UIDiv(`calendar-heatmap-day hover${(bDateMatchToday) ? " calendar-heatmap-today" : ""}`);

        if(stats !== undefined){

            const percent = this.calculatePercent(stats[i]);

            if(percent > 0){
                elem.style.cssText = `background-color:rgba(150,0,0,${percent})`;
            }

            const title = `${getDayName(dayOfWeek)} ${i+1}${getOrdinal(i+1)}`;
            let currentValue = stats[i][this.selectedMode];


            if(this.selectedMode === "playtime"){
                currentValue = toPlaytime(currentValue);
            }else if(this.selectedMode === "players"){
                currentValue = `${currentValue} ${plural(currentValue, "player")}`;
            }else if(this.selectedMode === "matches"){
                currentValue = `${currentValue} ${plural(currentValue, "match")}`;
            }else if(this.selectedMode === "wins"){
                currentValue = `${currentValue} ${plural(currentValue, "win")}`;
            }else if(this.selectedMode === "draws"){
                currentValue = `${currentValue} ${plural(currentValue, "draw")}`;
            }else if(this.selectedMode === "losses"){
                currentValue = `${currentValue} ${plural(currentValue, "loss")}`;
            }else if(this.selectedMode === "winrate"){

                if(currentValue === 0){
                    currentValue = "No matches played";
                }else{
                    currentValue = `${currentValue}% of ${stats[i].matches} ${plural(currentValue, "match")}`;
                }

            }

            const mouseTest = new UIBasicMouseOver(elem, title, currentValue);

            elem.append(mouseTest.wrapper);

            elem.addEventListener("mouseover", () =>{
                mouseTest.display();
            });

            elem.addEventListener("mouseleave", () =>{
                mouseTest.hide();
            });
        }

        const ordinal = UISpan(getOrdinal(i+1), "tiny-font");
        
        elem.append(`${i + 1}`, ordinal);

        return elem;
    }

    render(){

        this.updateTitle();
        this.calcMinMax();

        this.content.innerHTML = ``;
        const stats = this.data[`${this.selectedYear}-${this.selectedMonth}`];

        let i = 0;
        let dayOfWeek = this.startDayOfMonth;

        this.content.append(this.createHeaderColumns());

        let currentRow = UIDiv("calendar-heatmap-week");

        //need to add missing days to keep format
        for(let x = 0; x < dayOfWeek; x++){

            const elem = UIDiv("calendar-heatmap-day empty-date");
            currentRow.append(elem);
        }

        while(i <= this.lastDayOfMonth){

            const elem = this.createDayElem(i, dayOfWeek, stats);

            currentRow.append(elem);
            i++;

            dayOfWeek++;

            if(dayOfWeek > 6){
                dayOfWeek = 0;
                this.content.append(currentRow);
            }    
        }

        if(dayOfWeek > 0){

            for(let i = dayOfWeek; i < 7; i++){
                const elem = UIDiv("calendar-heatmap-day empty-date");
                currentRow.append(elem);
            }
            this.content.append(currentRow);
        }
    }
}

class UIMatchesActivtyHeatmap extends UICalendarHeatMap{

    constructor(parent, options){

        super(parent, options);

        this.targetGametype = options?.gametype ?? "";
        this.targetMap = options?.map ?? "";
        super.init();
    }
}

class UIPlayerActivityHeatmap extends UICalendarHeatMap{

    constructor(parent, options){

        super(parent, options);
        this.modes = [
            {"display": "Playtime", "value": "playtime"},
            {"display": "Total Matches", "value": "matches"},
            {"display": "Daily Winrate", "value": "winrate"},
            {"display": "Wins", "value": "wins"},
            {"display": "Draws", "value": "draws"},
            {"display": "Losses", "value": "losses"},
        ];

        this.header = `Activity Heatmap`;

        this.targetGametype = options?.gametype ?? "";
        this.targetMap = options?.map ?? "";
        this.targetPlayer = options?.player ?? "";
        
        super.init();
    }
}

class InteractiveTable{

    constructor(parent, headers, rows){

        this.parent = document.querySelector(parent);
        this.headers = headers;
        this.rows = rows;


        this.render();
    }

    render(){
        console.log(`renderInteractiveTable`);
    }
}


function UIMatchScreenshot(parent, matchData, bLatest){

    if(matchData === null) return;
    if(bLatest === undefined) bLatest = false;

    parent = document.querySelector(parent);

    const wrapper = UIDiv("text-center margin-bottom-1");
    UIHeader(wrapper, `${(bLatest) ? "Latest " : ""}Match Screenshot`);
    const canvas = document.createElement("canvas"); 
    canvas.className = "match-sshot text-center";
    canvas.width = 1920;
    canvas.height = 1080;
    wrapper.append(canvas);
    const sshot = new MatchScreenshot(canvas, matchData, false);
    sshot.render();
    
    parent.append(wrapper);
}

function UILoading(parent){

    const img = document.createElement("img");
    img.className = "loading";
    img.src = `/images/loading.png`;
    parent.append(img);
}
