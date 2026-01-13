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

        const info = UIDiv("info");

        const link = document.createElement("a");
        link.href = settings["External Site"];
        link.className = "bold"
        link.append(settings["External Site"]);


        info.append(`We also have another website you may like to visit `, link);
        wrapper.append(info);
       // UISocial(wrapper, settings["External Site"], "red.png");
    }

    parent.appendChild(wrapper);
}

function renderServerList(parent, servers){

    UIHeader(parent, "Our Servers");
    parent = document.querySelector(parent);


    const table = document.createElement("table");
    table.className = "t-width-1";

    const headers = ["Name", "First Match", "Last Match", "Playtime", "Matches"];
    const headerRow = document.createElement("tr");
    for(let i = 0; i < headers.length; i++){

        headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
    }

    table.appendChild(headerRow);

    for(let i = 0; i < servers.length; i++){

        const s = servers[i];

        const tableRow = document.createElement("tr");

        tableRow.appendChild(UITableColumn({"content": s.name, "className": "text-left"}));
        tableRow.appendChild(UITableColumn({"content": toDateString(s.first_match, true), "className": "date"}));
        tableRow.appendChild(UITableColumn({"content": toDateString(s.last_match, true), "className": "date"}));
        tableRow.appendChild(UITableColumn({"content": toPlaytime(s.playtime), "className": "date"}));
        tableRow.appendChild(UITableColumn({"content": s.matches}));

        table.appendChild(tableRow);
    }


    parent.appendChild(table);
}


function homeRenderRecentMatches(parent, data){

    parent = document.querySelector(parent);

    if(data.total === 0) return;

    const wrapper = UIDiv();
    wrapper.id = "home-recent-matches";
    wrapper.className = "text-center";
    UIHeader(wrapper, "Recent Matches");

    parent.append(wrapper);

    new MatchesRichView("#home-recent-matches", data);
}