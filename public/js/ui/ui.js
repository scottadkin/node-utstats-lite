function UIMatchScoreBox(parent, data, small, bTableElem){

    const wrapper = document.createElement((bTableElem) ? "td" : "div");

    let wrapperClassName = "solo";

    if(data.total_teams === 2) wrapperClassName = "duo";
    if(data.total_teams === 3) wrapperClassName = "trio";
    if(data.total_teams === 4) wrapperClassName = "quad";

    if(data.total_teams > 0){

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
                currentElem.appendChild(image);
            }


            const currentScoreElem = document.createElement("div");
            currentScoreElem.innerHTML = data[`team_${i}_score`];

            currentElem.appendChild(currentScoreElem);

            wrapper.appendChild(currentElem);
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
            currentElem.appendChild(image);
        }


        const currentScoreElem = document.createElement("div");
        currentScoreElem.innerHTML = `${data.solo_winner_name} Wins with ${data.solo_winner_score}`;

        currentElem.appendChild(currentScoreElem);

        wrapper.appendChild(currentElem);

    }

    if(!small) wrapperClassName = `match-scorebox-wrapper ${wrapperClassName} team-none`;

    wrapper.className = wrapperClassName;

    parent.appendChild(wrapper);
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

    elem.appendChild(text);

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
        url.appendChild(text);
        elem.appendChild(url);

    }else{

        if(contentType != "object"){
            elem.appendChild(text);
        }else{
            elem.appendChild(content);
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

function UIHeader(parent, text){

    if(typeof parent === "string"){
        parent = document.querySelector(parent);
    }

    const elem = document.createElement("div");
    elem.className = "header-wrapper";
    elem.appendChild(document.createTextNode(text));
    parent.appendChild(elem);

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

        new UISelect(parent, [
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


