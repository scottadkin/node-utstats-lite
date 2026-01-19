function UIAdminInfoRow(name, content){

    const elem = document.createElement("div");
    elem.className = "admin-info-row center";

    const label = document.createElement("div");
    label.innerHTML = name;
    label.className = "admin-info-row-label";

    elem.appendChild(label);

    const display = document.createElement("div");

    if(typeof content !== "object"){
        display.innerHTML = content;
    }else{
        display.appendChild(content);
    }

    elem.appendChild(display);
    return elem;
}

class AdminFTPManager{

    constructor(parent){

        this.parent = document.querySelector(parent);

        this.wrapper = document.createElement("div");
        UIHeader(this.wrapper, "Importer Manager");
        this.parent.appendChild(this.wrapper);
        this.mode = "current";

        this.selectedFTPServer = "";
        this.bActionInProgress = false;

        this.actionMessage = `Another action is being processed please wait for it to finish before continuing.`;


        this.init();
    }

    createTabs(){

        const options = [
            {"display": "Current Settings", "value": "current"},
            {"display": "Add FTP Server", "value": "add-ftp"},
            {"display": "Edit FTP Server Settings", "value": "edit-ftp"},
            {"display": "Edit Logs Folder Settings", "value": "edit-folder"},
        ];

        this.tabs = new UITabs(this.wrapper, options, this.mode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{

            if(this.bActionInProgress){
                alert(this.actionMessage);
                this.tabs.setMode(this.mode);
                return;
            }

            this.mode = e.detail.newTab;
            this.render();
        });
    }

    async init(){

        try{

            await this.loadData();

            this.createTabs();
            this.content = document.createElement("div");
            this.wrapper.appendChild(this.content);

            this.render();

        }catch(err){

            console.trace(err);
        }
    }

    async loadData(){

        const req = await fetch("/admin", {
            "headers": {"Content-type": "application/json"},
            "method": "POST",
            "body": JSON.stringify({"mode": "load-importer-list"})
        });

        const res = await req.json();

        if(res.error !== undefined){
            this.wrapper.innerHTML = `There was a problem loading importer settings: ${res.error}`;
            throw new Error(res.error);
        }

        this.ftpServers = res.ftp;
        this.logsFolderSettings = res.logsFolder;

    }


    renderFTPServers(){

    }

    renderCurrentLogsSettings(){

        UIHeader(this.content, "Current Logs Folder Settings");

        const wrapper = document.createElement("div");
        wrapper.className = "info";

        const line1 = `These are the settings that are used if you manually place 
        logs into the websites /Logs folder.`;
        const line2 = `These are also the fallback settings if the import has an 
        issue and stops and there are remaining logs in the /Logs folder.`;

        wrapper.appendChild(document.createTextNode(line1));
        wrapper.appendChild(document.createElement("br"));
        wrapper.appendChild(document.createTextNode(line2));
        wrapper.appendChild(document.createElement("br"));
        wrapper.appendChild(document.createElement("br"));
        //wrapper.appendChild(UIFormInputRow("Ttest", "test", "number", "", "Farts"));

        const logs = this.logsFolderSettings;

        wrapper.appendChild(UIAdminInfoRow("Total Imports", logs["total_imports"]));
        wrapper.appendChild(UIAdminInfoRow("Total Logs Imported", logs["total_logs_imported"]));
        wrapper.appendChild(UIAdminInfoRow("Latest Import",  toDateString(logs["last"])));
        wrapper.appendChild(UIAdminInfoRow("First Import", toDateString(logs["first"])));

        wrapper.appendChild(UIAdminInfoRow("Ignore Bots", UIStaticTrueFalse(logs["ignore_bots"])));
        wrapper.appendChild(UIAdminInfoRow("Ignore Duplicate Logs", UIStaticTrueFalse(logs["ignore_duplicates"])));
        wrapper.appendChild(UIAdminInfoRow("Minimum Match Length", logs["min_playtime"]));
        wrapper.appendChild(UIAdminInfoRow("Minimum Players", logs["min_players"]));
        wrapper.appendChild(UIAdminInfoRow("Append Team Sizes To Gametype Names", UIStaticTrueFalse(logs["append_team_sizes"])));
        

        this.content.appendChild(wrapper);
    }


    renderCurrentFTPSettings(){

        if(this.mode !== "current") return;

        UIHeader(this.content, "Current FTP Servers");

        const wrapper = document.createElement("div");
        wrapper.className = "info";

        const line1 = `These are the current FTP servers that the importer will download log files from.`;

        wrapper.appendChild(document.createTextNode(line1));

        const table = document.createElement("table");
        table.className = `t-width-1`;

        this.content.appendChild(wrapper);

        const headers = [
            "Name", "Address", "User", "Target Folder",
            "Ignore Values", "Minimum Requirements",
            "Total Imports", "SFTP", "Enabled"

        ];

        const headerRow = document.createElement("tr");

        for(let i = 0; i < headers.length; i++){
            headerRow.appendChild(UITableHeaderColumn({"content": headers[i]}));
        }

        table.appendChild(headerRow);

        for(let i = 0; i < this.ftpServers.length; i++){

            const s = this.ftpServers[i];

            const row = document.createElement("tr");
            row.appendChild(UITableColumn({"content": s.name}));
            row.appendChild(UITableColumn({"content": `${s.host}:${s.port}`}));
            row.appendChild(UITableColumn({"content": s.user}));
            row.appendChild(UITableColumn({"content": s.target_folder}));

            const ignoreWrapper = document.createElement("div");
            ignoreWrapper.className = "text-left";

            ignoreWrapper.appendChild(document.createTextNode(`Ignore Bots: ${(s.ignore_bots) ? "True": "False"}`));
            ignoreWrapper.appendChild(document.createElement("br"));
            ignoreWrapper.appendChild(document.createTextNode(`Ignore Duplicates: ${(s.ignore_duplicates) ? "True": "False"}`));
           
            row.appendChild(UITableColumn({"content": ignoreWrapper}));

            const minWrapper = document.createElement("div");
            minWrapper.className = "text-left";

            minWrapper.appendChild(document.createTextNode(`Minimum Players: ${s.min_players} Players`));
            minWrapper.appendChild(document.createElement("br"));
            minWrapper.appendChild(document.createTextNode(`Minimum Playtime: ${s.min_playtime} Seconds`));

            row.appendChild(UITableColumn({"content":minWrapper}));

            const totalWrapper = document.createElement("div");
            totalWrapper.className = "text-left";

            totalWrapper.appendChild(document.createTextNode(`Total Imports: ${s.total_imports}`));
            totalWrapper.appendChild(document.createElement("br"));
            totalWrapper.appendChild(document.createTextNode(`Total Logs Imported: ${s.total_logs_imported}`));

            row.appendChild(UITableColumn({"content": totalWrapper}));

            row.appendChild(UIStaticTrueFalse(s.sftp, true));
            row.appendChild(UIStaticTrueFalse(s.enabled, true));
            

            table.appendChild(row);
        }

        this.content.appendChild(table);

    }

    renderCurrentSettings(){

        if(this.mode !== "current") return;

        this.renderCurrentLogsSettings();
        this.renderCurrentFTPSettings();

    }


    renderSelectFTPServer(){

        const selectArea = document.createElement("div");
        selectArea.className = "form";

        const selectRow = document.createElement("div");
        selectRow.className = "form-row";

        const selectLabel = document.createElement("label");
        selectLabel.htmlFor = "selected-ftp-server";
        selectLabel.innerHTML = "Selected Server";
        selectRow.appendChild(selectLabel);

        const select = document.createElement("select");
        select.id = select.name = "selected-ftp-server";

        select.addEventListener("change", (e) =>{

            this.selectedFTPServer = e.target.value;
            this.render();
        });
        

        const noneSelected = document.createElement("option");
        noneSelected.value = "";
        noneSelected.innerHTML = `- Please Select An FTP Server -`;
        select.appendChild(noneSelected);

        for(let i = 0; i < this.ftpServers.length; i++){

            const s = this.ftpServers[i];

            const option = document.createElement("option");
            option.value = s.id;

            if(option.value == this.selectedFTPServer) option.selected = true;

            option.appendChild(document.createTextNode(`${s.name} (${s.host}:${s.port})`));
            select.appendChild(option);
        }

        selectRow.appendChild(select); 
        selectArea.appendChild(selectRow);

        this.fart = selectArea;

        this.content.appendChild(this.fart);
    }

    async createFTPServer(){

        try{

            if(this.bActionInProgress) throw new Error(this.actionMessage);

            this.bActionInProgress = true;

            const form = document.querySelector("#create-ftp-server-form");
            const formData = new FormData(form);

            const data = {};

            for(const [key, value] of formData){

                data[key] = value;

                if(value == "true"){
                    data[key] = 1;
                }else if(value == "false"){
                    data[key] = 0;
                }
            }

            const req = await fetch("/admin", {
                "headers": {"Content-type": "application/json"},
                "method": "POST",
                "body": JSON.stringify({"mode": "add-ftp-server", "settings": {...data}})
            });

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);


            new UINotification(this.wrapper, "pass", "Server Added", "FTP Server Added Successfully", () =>{
                form.reset();
            });

            await this.loadData();
            this.bActionInProgress = false;
           // alert(`FTP Server Added succuessfully`);


        }catch(err){
            console.trace(err);
            new UINotification(this.wrapper, "error", "Failed To Add Server", err.message);
            if(err.message !== this.actionMessage) this.bActionInProgress = false;
        }

        
    }

    getServer(id){

        for(let i = 0; i < this.ftpServers.length; i++){

            const s = this.ftpServers[i];

            if(s.id == id) return s;

        }
        return null;
    }

    createForm(type){

        const form = document.createElement("form");
        form.className = "form";
        form.id = `${(type === "add") ? "create" : "edit" }-ftp-server-form`;
        
        const info = document.createElement("div");
        info.className = "form-info";

        let infoString = `Add a (S)FTP server to add to the importer list.`;

        let enableValue = true;
        let sftpValue = false;
        let nameValue = "";
        let hostValue = "";
        let portValue = 7777;
        let userValue = "";
        let passwordValue = "";
        let folderValue = "";
        let minPlayersValue = 0;
        let minPlaytimeValue = 0;
        let ignoreBotsValue = false;
        let ignoreDuplicatesValue = false;
        let appendTeamSizesValue = false;
        let deleteTmpFilesValue = false;
        let deleteLogsValue = false;

        if(type !== "add"){

            infoString = `Edit an existing FTP server settings.`;

            const settings = this.getServer(this.selectedFTPServer);

            if(settings !== null){

                enableValue = settings.enabled;
                sftpValue = settings.sftp;
                nameValue = settings.name;
                hostValue = settings.host;
                portValue = settings.port;
                userValue = settings.user;
                passwordValue = settings.password;
                folderValue = settings.target_folder;
                minPlayersValue = parseInt(settings.min_players);
                minPlaytimeValue = parseInt(settings.min_playtime);
                ignoreBotsValue = settings.ignore_bots;
                ignoreDuplicatesValue = settings.ignore_duplicates;
                appendTeamSizesValue = settings.append_team_sizes;
                deleteTmpFilesValue = settings.delete_tmp_files;
                deleteLogsValue = settings.delete_after_import;
            }

        }



        info.innerHTML = infoString;
        form.appendChild(info);

        const enableRow = UIDiv("form-row");
        enableRow.appendChild(UILabel("Enabled"));
        const enableButton = new UITrueFalse(enableValue, "server-enabled", false);
        enableRow.appendChild(enableButton.wrapper);
        form.appendChild(enableRow);

        const sftpRow = UIDiv("form-row");
        sftpRow.appendChild(UILabel("Use SFTP Protocol"));
        const sftpButton = new UITrueFalse(sftpValue, "server-sftp", false);
        sftpRow.appendChild(sftpButton.wrapper);
        form.appendChild(sftpRow);

        const nameRow = UIDiv("form-row");

        nameRow.appendChild(UILabel("Server Name", "server-name"));

        const nameInput = UIInput("text", "server-name", nameValue, "Server Name....");

        nameRow.appendChild(nameInput);
        form.appendChild(nameRow);

        const hostRow = UIDiv("form-row");
        hostRow.appendChild(UILabel("Host", "server-host"));
        hostRow.appendChild(UIInput("text", "server-host", hostValue, "Server Host..."));
        form.appendChild(hostRow);

        const portRow = UIDiv("form-row");
        portRow.appendChild(UILabel("Port", "server-port"));
        portRow.appendChild(UIInput("number", "server-port", portValue, "Server Port..."));
        form.appendChild(portRow);


        const userRow = UIDiv("form-row");
        userRow.appendChild(UILabel("User", "server-user"));
        userRow.appendChild(UIInput("text", "server-user", userValue, "FTP User..."));
        form.appendChild(userRow);


        const passRow = UIDiv("form-row");
        passRow.appendChild(UILabel("Password", "server-password"));
        passRow.appendChild(UIInput("password", "server-password", passwordValue, "FTP Password..."));
        form.appendChild(passRow);

        const folderRow = UIDiv("form-row");
        folderRow.appendChild(UILabel("Target Folder", "server-folder"));
        folderRow.appendChild(UIInput("text", "server-folder", folderValue, "FTP Target Folder..."));
        form.appendChild(folderRow);

        const playersRow = UIDiv("form-row");
        playersRow.appendChild(UILabel("Minimum Players", "server-players"));
        playersRow.appendChild(UIInput("number", "server-players", minPlayersValue));
        form.appendChild(playersRow);

        const playtimeRow = UIDiv("form-row");
        playtimeRow.appendChild(UILabel("Minimum Playtime(Seconds)", "server-playtime"));
        playtimeRow.appendChild(UIInput("number", "server-playtime", minPlaytimeValue));
        form.appendChild(playtimeRow);


        const botsRow = UIDiv("form-row");
        botsRow.appendChild(UILabel("Ignore Bots"));
        const botsButton = new UITrueFalse(ignoreBotsValue, "server-bots", false);
        botsRow.appendChild(botsButton.wrapper);
        form.appendChild(botsRow);

        const dupRow = UIDiv("form-row");
        dupRow.appendChild(UILabel("Ignore Duplicate Logs"));
        const dupButton = new UITrueFalse(ignoreDuplicatesValue, "server-duplicates", false);
        dupRow.appendChild(dupButton.wrapper);
        form.appendChild(dupRow);


        const teamRow = UIDiv("form-row");
        teamRow.appendChild(UILabel("Append Team Sizes To Gametype Names"));
        const teamButton = new UITrueFalse(appendTeamSizesValue, "server-teams", false);
        teamRow.appendChild(teamButton.wrapper);
        form.appendChild(teamRow);


        const tmpRow = UIDiv("form-row");
        tmpRow.appendChild(UILabel("Delete .tmp Files From UT Server ./Logs Folder"));
        const tmpButton = new UITrueFalse(deleteTmpFilesValue, "server-tmp", false);
        tmpRow.appendChild(tmpButton.wrapper);
        form.appendChild(tmpRow);


        const deleteRow = UIDiv("form-row");
        deleteRow.appendChild(UILabel("Delete Logs From UT-Server ./Logs Folder"));
        const deleteButton = new UITrueFalse(deleteLogsValue, "server-delete", false);
        deleteRow.appendChild(deleteButton.wrapper);
        form.appendChild(deleteRow);

        const submit = document.createElement("input");
        submit.type = "submit";
        submit.value = (type === "add") ? "Add Server" : "Save Changes";
        submit.className = "submit-button";


        form.appendChild(submit);

        return form;
    }

    renderAddFTPServer(){

        if(this.mode !== "add-ftp") return;

        UIHeader(this.content, "Add FTP Server");

        const form = this.createForm("add");

        form.addEventListener("submit", (e) =>{
            e.preventDefault();
            this.createFTPServer();
        });
        
    
        this.content.appendChild(form);
    }

    async editFTPServer(form){

        try{

            if(this.bActionInProgress) throw new Error(this.actionMessage);

            this.bActionInProgress = true;

            const formData = new FormData(form);

            const data = {};

            data["server-id"] = this.selectedFTPServer;

            for(const [key, value] of formData){

                data[key] = value;

                if(value == "true"){
                    data[key] = 1;
                }else if(value == "false"){
                    data[key] = 0;
                }
            }

            const req = await fetch("/admin", {
                "headers": {"Content-type": "application/json"},
                "method": "POST",
                "body": JSON.stringify({"mode": "edit-ftp-server", "settings": {...data}})
            });

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            //this.selectedFTPServer = "";
            await this.loadData();
            

            new UINotification(this.wrapper, "pass", "Changes Saved", "Changes were successfully applied.");
            this.bActionInProgress = false;

        }catch(err){
            console.trace(err);
            new UINotification(this.wrapper, "error", "Failed To Save Changes", err.toString());
            if(err.message !== this.actionMessage) this.bActionInProgress = false;
        }


        
    }


    async deleteFTPServer(){

        try{

            if(this.bActionInProgress) throw new Error(this.actionMessage);

            this.bActionInProgress = true;

            const req = await fetch("/admin", {
                "headers": {"Content-type": "application/json"},
                "method": "POST",
                "body": JSON.stringify({"mode": "delete-ftp-server", "serverId": this.selectedFTPServer})
            });

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            await this.loadData();

            this.bActionInProgress = false;
            this.selectedFTPServer = "";
            this.render();
            new UINotification(this.wrapper, "pass", "Server Delete", "FTP Server Deleted Successfully");


        }catch(err){

            console.trace(err);
            new UINotification(this.wrapper, "error", "Failed To Delete Server", err.toString());

            if(err.message !== this.actionMessage) this.bActionInProgress = false;

        }

        
    }

    renderDeleteServer(){

        const wrapper = UIDiv("form");
        wrapper.className = "form";

        const info = document.createElement("div");
        info.className = "info";
        info.innerHTML = `Delete selected server from importer list.`;

        wrapper.appendChild(info);

        const button = document.createElement("button");
        button.className = "button delete-button";
        button.innerHTML = "Delete Server";

        button.addEventListener("click", () =>{

            this.deleteFTPServer();
        });

        wrapper.appendChild(button);


        this.content.appendChild(wrapper);
    }

    renderEditFTPSettings(){

        if(this.mode !== "edit-ftp") return;

        UIHeader(this.content, "Edit FTP Server Settings");

        this.renderSelectFTPServer();

        if(this.selectedFTPServer !== ""){

            const form = this.createForm("edit");

            form.addEventListener("submit", (e) =>{
                e.preventDefault();
                this.editFTPServer(form);
            });

            this.content.appendChild(form);

            this.renderDeleteServer();
        }
    }


    async editLogsFolderSettings(form){

        try{

            if(this.bActionInProgress) throw new Error(this.actionMessage);

            const data = {};

            const formData = new FormData(form);

            for(const [key, value] of formData){

                data[key] = value;

                if(value == "true") data[key] = 1;
                if(value == "false") data[key] = 0;
            }

            const req = await fetch("/admin", {
                "headers": {"Content-type": "application/json"},
                "method": "POST",
                "body": JSON.stringify({"mode": "edit-logs-folder-settings", "settings": {...data}})
            });


            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            this.bActionInProgress = false;
            await this.loadData();
            new UINotification(this.wrapper, "pass", "Changes Saved", "Logs folder settings successfully updated");
            this.render();

        }catch(err){
            console.trace(err);

            if(err.message !== this.actionMessage) this.bActionInProgress = false;
            new UINotification(this.wrapper, "error", "Failed To Save Changes", "Logs folder settings successfully updated");

        }
    }

    renderEditLogsFolderSettings(){

        if(this.mode !== "edit-folder") return;

        UIHeader(this.content, "Edit Logs Folder Settings");

        const form = document.createElement("form");
        form.className = "form"
        
        const info = UIDiv("info");

        const line1 = `These are the settings the importer will use if you manually 
        place logs into the website's /Logs folder.`

        info.appendChild(document.createTextNode(line1));
        info.appendChild(document.createElement("br"));
        const line2 = `If the importer encounters a problem or is turned off mid 
        import these settings are also used by the importer next time you start the importer process.`;

        info.appendChild(document.createTextNode(line2));
        form.appendChild(info);

        const settings = this.logsFolderSettings;

        const botsRow = UIDiv("form-row");
        botsRow.appendChild(UILabel("Ignore Bots"));
        botsRow.appendChild(new UITrueFalse(settings.ignore_bots, "ignore_bots", false).wrapper);
        form.appendChild(botsRow);

        const dupRow = UIDiv("form-row");
        dupRow.appendChild(UILabel("Ignore Duplicate Logs"));
        dupRow.appendChild(new UITrueFalse(settings.ignore_duplicates, "ignore_duplicates", false).wrapper);
        form.appendChild(dupRow);

        const teamsRow = UIDiv("form-row");
        teamsRow.appendChild(UILabel("Append Team Sizes To Gametype Names"));
        teamsRow.appendChild(new UITrueFalse(settings.append_team_sizes, "append_team_sizes", false).wrapper);
        form.appendChild(teamsRow);

        form.appendChild(UIFormInputRow("Minimum Players", "min_players", "number", settings.min_players));
        form.appendChild(UIFormInputRow("Minimum Playtime(Seconds)", "min_playtime", "number", settings.min_playtime));

        const submitButton = document.createElement("input");
        submitButton.type = "submit";
        submitButton.className = "submit-button";
        submitButton.value = "Save Changes";
        form.appendChild(submitButton);

        form.addEventListener("submit", (e) =>{
            e.preventDefault();
            this.editLogsFolderSettings(e.target);
        });

        this.content.appendChild(form);
    }

    render(){

        this.content.innerHTML = "";

        this.renderCurrentSettings();
        this.renderAddFTPServer();
        this.renderEditFTPSettings();
        this.renderEditLogsFolderSettings();
    }
}


class AdminMapsManager{

    constructor(parent){

        this.parent = document.querySelector(parent);
        UIHeader(this.parent, "Map Manager");
       
        this.mode = "sshots";

        this.mapList = [];
        this.mapImages = [];

        this.validScreenshotTypes = [
            "image/png", 
            "image/x-ms-bmp", 
            "image/bmp", 
            "image/gif",
            "image/jpeg",
            "image/tiff"
        ];

        this.badImageChars = ["[","]","'","`"];

        this.createTabs();
        this.wrapper = UIDiv();
        this.parent.append(this.wrapper);

        this.render();

        this.loadData();
    }

    async loadData(){

        try{

            const req = await fetch("/admin", {
                "headers": {"Content-type": "application/json"},
                "method": "POST",
                "body": JSON.stringify({"mode": "load-maps"})
            });

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            this.mapList = res.mapList;
            this.mapImages = res.mapImages;

            this.render();

        }catch(err){
            console.trace(err);
            new UINotification(this.parent, "error", "Failed To Load Maps Data", err.toString());
        }
    }

    createTabs(){

        const tabsOptions = [
            {"value": "sshots", "display": "Screenshots"}
        ];

        this.tabs = new UITabs(this.parent, tabsOptions, this.mode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{
            this.mode = e.detail.newTab;
            this.render();
        });
    }

    getTitle(){

        switch(this.mode){
            case "sshots": return "Screenshot Manager";
        }

        return "Not Found";
    }

    getImageStatus(targetImage){

        const index = this.mapImages.indexOf(targetImage);

        if(index !== -1) return "Found";

        const partial = getPartialNameMatchImage(this.mapImages, targetImage);

        if(partial === null) return "Missing";

        return `Partial Match(${partial})`;
    }

    updateMapImages(newImage){

        if(this.mapImages.indexOf(newImage) === -1){
            this.mapImages.push(newImage);
        }

        const statusElem = document.querySelector(`#${stripFileExtension(newImage)}`);

        if(statusElem === null){
            console.warn("Failed to find statusElem");
            return;
        }

        const test = document.getElementsByClassName("dummy-map-name");

        for(let i = 0; i < test.length; i++){

            const status = this.getImageStatus(`${test[i].id}.jpg`);

            let className = "team-red";

            if(status === "Found"){
                className = "team-green";
            }else if(status !== "Missing"){
                className = "team-yellow";
            }

            test[i].className = `dummy-map-name ${className}`;

            const url = document.createElement("a");
            url.href = `/images/maps/${test[i].id}.jpg`;
            url.append(status);
            url.target = "_blank";

            test[i].innerHTML = '';
            test[i].append(url);
        }
    }

    async uploadImage(e){

        try{

            const formData = new FormData();

            const fileElem = e.target[0];

            formData.append("mode", "upload-map-sshot");
            formData.append("map-sshot", fileElem.files[0]);
            formData.append("map-name", e.target[2].value);


            const req = await fetch("/admin", {
                "method": "POST",
                "body": formData
            });

            const res = await req.json();
  
            if(res.error !== undefined) throw new Error(res.error);
            this.updateMapImages(res.fileName);
            new UINotification(this.parent, "pass", `Map Image Uploaded`, `Image uploaded successfully, Saved as ${res.fileName}`);
            
        }catch(err){
            console.trace(err);
            new UINotification(this.parent, "error", `Failed To Upload Map Image`, err.toString());
        }
    }

    createUploadForm(targetFileName){

        const form = document.createElement("form");
       
        form.method = "POST";
        form.enctype = "multipart/form-data";
        form.action = "/admin/";


        form.addEventListener("submit", async (e) =>{
            e.preventDefault();
            await this.uploadImage(e);
            //render again
        });

        const fileUpload = document.createElement("input");
        fileUpload.type = "file";
        fileUpload.accept = `image/png, image/x-ms-bmp, image/bmp, image/gif, image/jpeg, image/tiff`;
        fileUpload.name = fileUpload.id = "sshot";
        form.append(fileUpload);

        const mode = document.createElement("input");
        mode.type = "hidden";
        mode.name = mode.id = "mode";
        mode.value = "upload-map-sshot";
        form.append(mode);

        const name = document.createElement("input");
        name.type = "hidden";
        name.name = name.id = "file-name";
        name.value = targetFileName;
        form.append(name);

        const submit = document.createElement("input");
        submit.type = "submit";
        submit.value = "Upload";
        submit.className = "small-button";
        form.append(submit);

        return form;
    }


    renderScreenshotsInfo(){

        //image/png, image/x-ms-bmp, image/bmp, image/gif, image/jpeg, image/tiff
        const infoWrapper = UIDiv("info");
        const info = UIDiv("info-text");

        infoWrapper.append(info);

        info.append(`- This is where you can upload map screenshots that are used in various areas of the site.`);
        info.append(UIBr());
        info.append(`- File names are automatically assigned to match the selected map so the website can recognize the image.`);
        info.append(UIBr());
        info.append(`- Images are automatically converted to .jpg format, you can upload the following image types: `);

        for(let i = 0; i < this.validScreenshotTypes.length; i++){

            const v = this.validScreenshotTypes[i];
            const item = document.createElement("b");

            item.append(v);

            if(i < this.validScreenshotTypes.length - 1){
                item.append(", ");
            }

            info.append(item);
        }

        info.append(UIBr());
        info.append(`- You can manually place images into the site's `, UIB("/images/maps/"), " folder, but they must be a .jpg image");
        info.append(UIBr(), `- The naming convention for images is the map name with the gametype prefix removed, `)
        info.append(`all lowercase, and shouldn't include the following characters: `);

        for(let i = 0; i < this.badImageChars.length; i++){
            const b = this.badImageChars[i];
            info.append(UIB(b));
            if(i < this.badImageChars.length - 1) info.append(" ");
        }
        info.append(UIBr(), "An example: ", UIB("DM-Deck16]["), " will require the image to be called ", UIB("deck16.jpg"), UIBr());
        info.append("- The website also does partial matches, ");
        info.append("if you have multiple version of a map like ", UIB("CTF-FaceLE01, "), UIB("CTF-FaceCE, "), UIB("CTF4-FaceV201"));
        info.append(" you can place an image into the ",UIB("/images/maps/"), " folder called ", UIB("face.jpg"));
        info.append(" and every map with a name containg ",UIB("face")," will use that image if there isn't an exact match for a map.");

        info.append(UIBr(), `- For best results use an aspect ratio of 16:9.`, UIBr());
        info.append(``);


        this.wrapper.append(infoWrapper);

    }

    renderScreenshots(){

        this.renderScreenshotsInfo();

        const table = document.createElement("table");
        table.className = "t-width-1";

        const headers = ["Name", "Latest Match", "Total Playtime", "Required Image Name", "Image Status", "Upload"];

        const headerRow = document.createElement("tr");

        for(let i = 0; i < headers.length; i++){
            headerRow.append(UITableHeaderColumn({"content": headers[i]}));
        }

        table.append(headerRow);

        for(let i = 0; i < this.mapList.length; i++){

            const m = this.mapList[i];

            const row = document.createElement("tr");

            row.append(UITableColumn({"content": m.name, "className": "text-left"}));
            row.append(UITableColumn({"content": m.last_match, "parse": ["date"], "className": "date"}));
            row.append(UITableColumn({"content": m.playtime, "parse": ["playtime"], "className": "playtime"}));
            row.append(UITableColumn({"content": m.targetImage}));

            const imageStatus = this.getImageStatus(m.targetImage);

            let statusClass = "team-red";

            if(imageStatus === "Found"){
                statusClass = "team-green";
            }else if(imageStatus !== "Missing"){
                statusClass = "team-yellow";
            }

            // form.id = targetFileName;
            row.append(UITableColumn({
                "content": imageStatus, 
                "className": `dummy-map-name ${statusClass}`, 
                "id": stripFileExtension(m.targetImage),
                "url": `/images/maps/${m.targetImage}`,
                "urlTarget": "_blank"
            }));

            const form = this.createUploadForm(m.targetImage);

            row.append(UITableColumn({"content": form}));
            table.append(row);
        }

        this.wrapper.append(table);
    }

    render(){

        this.wrapper.innerHTML = ``;

        UIHeader(this.wrapper, this.getTitle());

        if(this.mode === "sshots"){
            this.renderScreenshots();
        }
    }
}


class UIPageEditorBox{

    constructor(parent, itemSettings){

        this.parent = parent;
        this.settings = itemSettings;

        this.wrapper = UIDiv("page-layout-editor-box");
        this.title = UIDiv("page-layout-editor-title");
        this.title.append(this.settings.item);
        this.wrapper.append(this.title);
        
        this.parent.append(this.wrapper);

        this.createButtons()
    }



    createButtons(){

        const elem = UIDiv("page-layout-editor-options");
        this.wrapper.append(elem);

        const buttons = [];
        const values = ["To Bottom", "Move Down", "Move Up", "To Top"];

        for(let i = 0; i < values.length; i++){

            const b = document.createElement("button");
            b.innerHTML = values[i];
            buttons.push(b);
        }

        const eventNames = ["bottom", "down", "up", "top"];

        for(let i = 0; i < buttons.length; i++){

            buttons[i].className = "hover";

            buttons[i].addEventListener("click", () =>{
                this.wrapper.dispatchEvent(new CustomEvent("movePageComponent", {
                    "detail": {
                        "id": this.settings.id,
                        "newPosition": eventNames[i]
                    }
                }));
            });

            elem.append(buttons[i]);
        }
        
    }

}

class AdminSiteSettingsManager{

    constructor(parent){

        this.parent = document.querySelector(parent);

        this.wrapper = UIDiv();
        this.mode = "page-settings";
        
        this.pageSettings = [];
        this.pageLayouts = [];

        this.pages = [
            /*"Branding",*/"CTF League", "Home", "Map", "Maps", 
            "Match", "Matches", /*"Nav",*/ 
            "Player", "Players", /*"Social Media", 
            "Welcome Message"*/"Rankings", "Records"
        ];

        this.selectedPage = "Home"//this.pages[0];

        UIHeader(this.parent, "Site Settings Manager");

        this.createTabs();

        this.warningElem = UIDiv("hidden");

        this.parent.append(this.warningElem);

        this.parent.append(this.wrapper);

        

        this.loadData();
    }

    createTabs(){

        const tabs = [
            {"display": "Branding Settings", "value": "branding-settings"},
            {"display": "Page Settings", "value": "page-settings"},
            {"display": "Social Settings", "value": "social-settings"},
            {"display": "Welcome Message", "value": "welcome-message-settings"},
        ];

        this.tabs = new UITabs(this.parent, tabs, this.mode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{
            this.mode = e.detail.newTab;
            this.render();
        });
    }

    async loadData(){

        try{

            const req = await fetch("/admin/", {
                "headers": {"Content-type": "application/json"},
                "method": "POST",
                "body": JSON.stringify({"mode": "get-all-page-settings"})
            });

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            this.pageSettings = res.pageSettings;
            this.savedPageSettings = JSON.parse(JSON.stringify(res.pageSettings));
            this.validRecordTypes = res.validRecordTypes;

            this.pageLayouts = res.pageLayouts;
            this.savedPageLayouts = JSON.parse(JSON.stringify(this.pageLayouts));

            this.render();

        }catch(err){
            console.trace(err);
            new UINotification(this.parent, "error", "Failed to load settings", err.toString());
        }
    }

    async saveChanges(){

        try{

            const changes = this.getUnsavedChanges();

            const data = [];

            for(let i = 0; i < changes.length; i++){

                const c = changes[i];


                if(c.setting_value !== undefined){

                    let newValue = c.setting_value;

                    if(c.setting_type === "bool"){
                        newValue = (c.setting_value === true) ? 1 : 0; 
                    }

                    if(c.setting_type === "longtext" && c.setting_value.indexOf("<script>") !== -1){
                        throw new Error(`You can not have <script> tags in your welcome message`);
                    }

                    data.push({"id": c.id, "value": newValue});

                }else{

                    data.push({"id": c.id, "pageIndex": c.page_order});
                }
            }

            const req = await fetch("/admin", {
                "headers": {"Content-type": "application/json"},
                "method": "POST",
                "body": JSON.stringify({
                    "mode":  "save-site-setting-changes",
                    "changes": data
                })
            });

            const res = await req.json();


            if(res.error !== undefined) throw new Error(res.error);

            new UINotification(
                this.parent, 
                "note", 
                "Site Settings Changed", 
                `${res.passed} ${plural(res.passed, "change")}  successful, and ${res.failed} failed.`
            );

            this.savedPageSettings = JSON.parse(JSON.stringify(this.pageSettings));
            this.savedPageLayouts = JSON.parse(JSON.stringify(this.pageLayouts));
            this.renderUnsavedChanges();
            this.render();


        }catch(err){
            console.trace(err);
            new UINotification(this.parent, "error", "Failed to save changes", err.toString());
        }
    }


    getUniquePages(){

        const found = new Set();

        for(let i = 0; i < this.pageSettings.length; i++){

            const p = this.pageSettings[i];

            found.add(p.category);

        }

        return [...found].sort((a, b) =>{

            a = a.toLowerCase();
            b = b.toLowerCase();

            if(a < b){
                return -1;
            }else if(a > b){
                return 1;
            }

            return 0;
        });
    }

    renderPageSettingsForm(){

        const form = document.createElement("form");
        form.className = "form";

        const info = UIDiv("info");
        info.append("Change what components are displayed on each page, and how many of certain items are displayed.");
        form.append(info);

        const row = UIDiv("form-row");
        row.append(UILabel("Selected Page", "selected-page"));

        const select = document.createElement("select");
        select.name = select.id = "selected-page";
        row.append(select);

        for(let i = 0; i < this.pages.length; i++){

            const p = this.pages[i];
            const option = document.createElement("option");
            option.innerHTML = option.value = p;
            if(this.selectedPage === p) option.selected = true;
            select.append(option);
        }

        select.addEventListener("change", (e) =>{

            this.selectedPage = e.target.value;
            this.render();
        });

        form.append(row);
        this.wrapper.append(form);
    }

    getUnsavedChanges(){

        const found = [];

        for(let i = 0; i < this.pageSettings.length; i++){

            const current = this.pageSettings[i];
            const old = this.savedPageSettings[i];

            if(current.setting_value !== old.setting_value){
                found.push(current);
            }
        }

        const pageKeys = Object.keys(this.pageLayouts);

        for(let i = 0; i < pageKeys.length; i++){

            const currentLayout = this.pageLayouts[pageKeys[i]];
            const savedLayout = this.savedPageLayouts[pageKeys[i]];

            for(let x = 0; x < currentLayout.length; x++){

                const current = currentLayout[x];

                for(let z = 0; z < savedLayout.length; z++){

                    const saved = savedLayout[z];

                    if(current.item === saved.item && current.page_order !== saved.page_order){
                        found.push(current);
                    }
                    //console.log(current.item, saved.item);
                }
            }
        }

        return found;
    }

    changePageSetting(id, value){

  
        for(let i = 0; i < this.pageSettings.length; i++){

            const s = this.pageSettings[i];

            if(s.id !== id) continue;

            if(s.setting_type === "bool"){
                s.setting_value = value; 
                break;
            }

            s.setting_value = value;
            break;
        }

        this.renderUnsavedChanges();
    }

    createSaveButton(bLayoutEditor){

        if(bLayoutEditor === undefined) bLayoutEditor = false;

        if(bLayoutEditor){

            this.layoutSaveButton = document.createElement("button");
            this.layoutSaveButton.innerHTML = "Save Changes";
            this.layoutSaveButton.className = `submit-button${(this.getUnsavedChanges().length === 0) ? " hidden": ""}`;

            this.layoutSaveButton.addEventListener("click", () =>{
                this.saveChanges();
            });

            return this.layoutSaveButton;
        }

        this.saveButton = document.createElement("button");
        this.saveButton.innerHTML = `Save Changes`;
        this.saveButton.className = `submit-button${(this.getUnsavedChanges().length === 0) ? " hidden": ""}`;

        this.saveButton.addEventListener("click", () =>{
            this.saveChanges();
        });

        return this.saveButton;

    }

    renderPageSettings(){

        if(this.mode !== "page-settings") return;

        this.renderPageSettingsForm();

        UIHeader(this.wrapper, "Page Components");

        const elem = UIDiv("form");

        for(let i = 0; i < this.pageSettings.length; i++){

            const s = this.pageSettings[i];

            if(s.category !== this.selectedPage) continue;

            const row = UIDiv("form-row");

            const label = UIDiv("form-label");
            label.append(s.setting_name);
            row.append(label);

            if(s.setting_type === "integer"){

                const numInput = new UIInput(
                    "number", 
                    `setting_${s.id}`, 
                    s.setting_value, 
                    `${s.setting_name}...`
                );

                numInput.min = 0;
                numInput.addEventListener("input", (e) =>{
                    this.changePageSetting(s.id, e.target.value);   
                });

                row.append(numInput);

            }else if(s.setting_type === "bool"){

                const item = new UITrueFalse(s.setting_value == true, `setting_${s.id}`, false, (newValue) =>{
                    this.changePageSetting(s.id, newValue, s);       
                });

                row.append(item.wrapper);

            }else if(s.setting_type === "perPage"){
                
                new UIPerPageSelect(row, s.setting_value, null, (newValue) =>{
                    this.changePageSetting(s.id, newValue);
                });
                
            }else if(s.setting_type === "displayMode"){

                new UISelect(row, [
                        {"display": "Default", "value": "default"},
                        {"display": "Table View", "value": "table"},
                    ], s.setting_value, (newValue) =>{
                    this.changePageSetting(s.id, newValue);
                });

            }else if(s.setting_type === "order"){
                
                new UIOrderSelect(row, s.setting_value, (newValue) => {this.changePageSetting(s.id, newValue)});
                
            }else if(s.setting_type === "playersSortBy"){

                new UIPlayerSortBySelect(row, s.setting_value, (newValue) =>{this.changePageSetting(s.id, newValue)});

            }else if(s.setting_type === "activeIn"){
                
                new UILastActiveSelect(row, s.setting_value, null, (newValue) =>{this.changePageSetting(s.id, newValue)});

            }else if(s.setting_type === "ctfLeagueMode"){

                new UICTFLeagueModeSelect(row, s.setting_value, null, (newValue) =>{ this.changePageSetting(s.id, newValue)});

            }else if(s.setting_type === "recordsMode"){
                
                new UIRecordsModeSelect(row, s.setting_value, (newValue) => { this.changePageSetting(s.id, newValue)});

            }else if(s.setting_type === "recordsType"){
                
                new UIRecordsTypeSelect(
                    row, 
                    (s.setting_name === "Default Record Type(Matches)") ? "match" : "lifetime", 
                    s.setting_value, 
                    this.validRecordTypes, 
                    (newValue) =>{ this.changePageSetting(s.id, newValue)}
                );

            }else if(s.setting_type === "heatmapMode"){
                
                new UIHeatmapModeSelect(row, s.setting_value, (newValue) =>{ this.changePageSetting(s.id, newValue)});
            }else{

                console.log(s.setting_type);
            }

            elem.append(row);
        }

       
        elem.append(this.createSaveButton());
        this.wrapper.append(elem);

        this.renderPageLayoutEditor();
    }

    getPageLayoutItem(page, id){

        const pageLayout = this.pageLayouts[page] ?? null;
        if(pageLayout === null) return null;

        for(let i = 0; i < pageLayout.length; i++){

            const p = pageLayout[i];
            if(p.id === id) return p;
        }

        return null;
    }

    movePageComponent(details){

        const {id, newPosition} = details;

        const targetSetting = this.getPageLayoutItem(this.selectedPage.toLowerCase(), id);
        if(targetSetting === null) throw new Error(`Could not find page layout item`);

        for(let i = 0; i < this.editorElems.length; i++){

            const e = this.editorElems[i];

            const previous = this.editorElems?.[i - 1] ?? null;
            const next = this.editorElems?.[i + 1] ?? null;

            if(e.settings.id === id){

                if(i === 0 && newPosition === "up"){
                    //item is already at top nothing needs to change
                    return;
                }   

                if(i === this.editorElems.length - 1 && newPosition === "down"){
                    //already at bottom nothing needs to change
                    return;
                }

                if(newPosition === "top"){

                    e.settings.page_order = -1;

                }else if(newPosition === "bottom"){

                    e.settings.page_order = 999999;

                }else if(newPosition === "up"){

                    e.settings.page_order--;
                    previous.settings.page_order++;     

                }else if(newPosition === "down"){

                    next.settings.page_order = e.settings.page_order;
                    e.settings.page_order++;
                }
            }
        }

        this.editorElems.sort((a, b) =>{

            a = a.settings.page_order;
            b = b.settings.page_order;

            if(a < b){
                return -1;
            }else if(a > b){
                return 1;
            }
            return 0;
        });

        this.pageLayoutEditor.innerHTML = ``;

        const newLayout = [];

        for(let i = 0; i < this.editorElems.length; i++){

            const e = this.editorElems[i];

            e.settings.page_order = i;
            newLayout.push(e.settings);

            this.pageLayoutEditor.append(e.wrapper);
        }

        this.pageLayouts[this.selectedPage.toLowerCase()] = newLayout;

        this.renderUnsavedChanges();
    }   

    renderPageLayoutEditor(){

        const pageLayout = this.pageLayouts[this.selectedPage.toLowerCase()] ?? null;
        if(pageLayout === null) return;

        UIHeader(this.wrapper, "Page Layout Editor");

        this.pageLayoutEditor = UIDiv("page-layout-editor-wrapper");

        this.editorElems = [];

        for(let i = 0; i < pageLayout.length; i++){

            const s = pageLayout[i];

            const elem = new UIPageEditorBox(this.pageLayoutEditor, s);

            elem.wrapper.addEventListener("movePageComponent", (e) =>{
                this.movePageComponent(e.detail);
            });

            this.editorElems.push(elem);
        }

        this.wrapper.append(this.pageLayoutEditor);

        const bWrapper = UIDiv("text-center margin-bottom-1");

        bWrapper.append(this.createSaveButton(true));
        this.wrapper.append(bWrapper);

    }



    renderUnsavedChanges(){

        this.warningElem.innerHTML = ``;
        this.warningElem.className = "hidden";
        const changes = this.getUnsavedChanges();

        if(changes.length === 0){
            this.saveButton.className = "hidden";
            this.layoutSaveButton.className = "hidden";
            return;
        }

        this.warningElem.className = `warning`;
        this.warningElem.append(`You have ${changes.length} unsaved changes.`);
        this.saveButton.className = "submit-button";
         this.layoutSaveButton.className = "submit-button";
    }

    renderSettings(type){

        let title = ``;
        let cat = "";

        if(type === "social-settings"){

            title = "Social Links";
            cat = "Social Media";

        }else if(type === "branding-settings"){

            title = "Branding Settings";
            cat = "Branding";
        }

        if(cat === "") throw new Error("not a valid setting cat");

        UIHeader(this.wrapper, title);

        const form = UIDiv("form");

        for(let i = 0; i < this.pageSettings.length; i++){

            const s = this.pageSettings[i];
            if(s.category !== cat) continue;

            const row = UIDiv("form-row");
            row.append(UILabel(s.setting_name));
            
            const input = UIInput("text", `link_${i}`, s.setting_value, `${s.setting_name}...`);

            input.addEventListener("input", (e) =>{
                this.changePageSetting(s.id, e.target.value);  
            });
            
            row.append(input);
            form.append(row);
        }

        form.append(this.createSaveButton());

        this.renderUnsavedChanges();
        this.wrapper.append(form);
    }

    renderWelcomeMessageSettings(){

        UIHeader(this.wrapper, "Welcome Message Settings");

        const form = UIDiv("form");

        for(let i = 0; i < this.pageSettings.length; i++){

            const s = this.pageSettings[i];

            if(s.category !== "Welcome Message") continue;

            if(s.setting_type === "string"){

                const row = UIDiv("form-row");
                row.append(UILabel(s.setting_name));

                const input = new UIInput("text", `input_${i}`, s.setting_value, `${s.setting_name}...`);

                input.addEventListener("input", (e) =>{
                    this.changePageSetting(s.id, e.target.value);  
                });

                row.append(input);
                form.append(row);

            }else if(s.setting_type === "longtext"){

                const div = UIDiv("admin-textarea-wrapper");

                div.append(UIBr(), `Welcome Message Content`, UIBr(), UIBr());
                const warning = UIDiv("warning");
                warning.innerHTML = `Input must be valid HTML, if you input invalid HTML the home page may experience 
                problems rendering the rest of the content correctly. <br><br>Script tags are not permitted.
                <br>You also have to have Welcome Message enabled in the Home Page settings for this area to be visible.`;
                div.append(warning);
                
                const textarea = document.createElement("textarea");

                textarea.addEventListener("input", (e) =>{

                    this.changePageSetting(s.id, e.target.value);  
                });

                textarea.innerHTML = s.setting_value;

                div.append(textarea);
                form.append(div);
            }
        }

        form.append(UIBr(), UIBr(), this.createSaveButton());
        this.renderUnsavedChanges();
        this.wrapper.append(form);
    }

    
    render(){

        this.wrapper.innerHTML = ``;

        if(this.mode === "page-settings"){

            return this.renderPageSettings();

        }else if(this.mode === "social-settings" || this.mode === "branding-settings"){

            return this.renderSettings(this.mode);

        }else if(this.mode === "welcome-message-settings"){
            return this.renderWelcomeMessageSettings();
        }
        
    }
}


class AdminRankingManager{

    constructor(parent){

        this.parent = document.querySelector(parent);
        this.wrapper = UIDiv();

        this.bRecalculatingInProgress = false;

        this.mode = "recalculate";
        this.settingCat = "general";

        this.settings = [];
        this.savedSettings = [];

        UIHeader(this.wrapper, "Rankings Manager");

        this.createTabs();

        this.content = UIDiv();
        this.wrapper.append(this.content);

        this.parent.append(this.wrapper);

        this.loadData();
    }

    createTabs(){

        const options = [
            {"value": "settings", "display": "Ranking Values"},
            {"value": "recalculate", "display": "Recalculate Rankings"},
        ];

        this.tabs = new UITabs(this.wrapper, options, this.mode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{
            
            this.mode = e.detail.newTab;
            this.render();
        });
    }

    async loadData(){

        try{

            const req = await fetch("/admin", {
                "headers": {"Content-type": "application/json"},
                "method": "POST",
                "body": JSON.stringify({"mode": "load-ranking-settings"})
            });

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            this.settings = res.settings;
            this.savedSettings = JSON.parse(JSON.stringify(this.settings));

            this.render();

        }catch(err){
            console.trace(err);
            new UINotification(this.parent, "error", "Failed To Load Rankings Data", err.toString());
        }
    }

    getSettingsByIds(ids){

        if(ids.length === 0) return [];

        const found = [];

        for(let i = 0; i < this.settings.length; i++){

            const s = this.settings[i];

            if(ids.indexOf(s.id) !== -1) found.push({...s});
        }

        found.sort((a, b) =>{

            a = a.display_name.toLowerCase();
            b = b.display_name.toLowerCase();

            if(a < b){
                return -1;
            }else if(a > b){
                return 1;
            }

            return 0;
        });

        return found;
    }

    updateSavedSettings(passed){

        for(let i = 0; i < this.savedSettings.length; i++){

            if(passed.indexOf(this.savedSettings[i].id) === -1) continue;

            this.savedSettings[i].points = this.settings[i].points;

        }

        this.renderUnsavedChanges();
    }

    async saveChanges(){

        try{

            if(this.bRecalculatingInProgress){
                alert(`You can not adjust values while recalculating is in progress`);
                return;
            }

            const changes = this.getUnsavedChanges();

            const req = await fetch("/admin", {
                "headers": {"Content-type": "application/json"},
                "method": "POST",
                "body": JSON.stringify({"mode": "save-ranking-changes", changes})
            });

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            if(res.fails.length > 0){

                const failedSettings = this.getSettingsByIds(res.fails);

                let failedElem = UIDiv("");

                for(let i = 0; i < failedSettings.length; i++){
                    const f = failedSettings[i];
                    failedElem.append(UIB(f.category), " -> ", UIB(f.display_name), " change failed to save.", UIBr());
                }

                new UINotification(this.parent, "error", "Failed To Save All Changes", failedElem);

            }else{

                new UINotification(this.parent, "pass", "All Changes Saved", "All changes were successfully saved.");
            }

            this.updateSavedSettings(res.passed);

        }catch(err){

            console.trace(err);
            new UINotification(this.parent, "error", "Failed To Save Changes", err.toString());

        }
    }

    getUniqueCategories(){

        const found = new Set();

        for(let i = 0; i < this.settings.length; i++){

            const s = this.settings[i];

            found.add(s.category);
        }

        return [...found].sort((a, b) =>{
            a = a.toLowerCase();
            b = b.toLowerCase();

            if(a < b){
                return -1
            }else if(a > b){
                return 1;
            }

            return 0;
        });
    }

    updateSetting(id, newValue){

        for(let i = 0; i < this.settings.length; i++){

            const s = this.settings[i];
            if(s.id !== id) continue;
            s.points = newValue;
            this.renderUnsavedChanges();
            return;
        }
    }

    getUnsavedChanges(){

        const changes = [];

        for(let i = 0; i < this.settings.length; i++){

            const currentValue = this.settings[i].points;
            const oldValue = this.savedSettings[i].points;

            if(currentValue != oldValue){
                changes.push({"id": this.settings[i].id, "value": currentValue});
            }
        }

        return changes;
    }

    renderUnsavedChanges(){

        const changes = this.getUnsavedChanges();
        this.unsavedChanges.innerHTML = "";

        if(changes.length === 0){
            this.unsavedChanges.className = "hidden";
            this.saveButton.className = "hidden";
            return;
        }

        this.unsavedChanges.className = "warning";
        this.saveButton.className = "submit-button";
        this.unsavedChanges.append(`You have ${changes.length} unsaved ${plural(changes.length, "change")}`);
    }

    renderSettings(){

        this.content.innerHTML = ``;

        UIHeader(this.content, "Ranking Values");

        this.unsavedChanges = new UIDiv("warning");
        this.unsavedChanges.className = "hidden";
        this.content.append(this.unsavedChanges);

        const form = UIDiv("form");

        const info = UIDiv("info");
        info.innerHTML = `Adjust how many points a player gets for each event and adjust time penalties.`;
        info.innerHTML += `<br>For time penalties every 0.01 is 1% of the original score, a value of 1 will keep the players score the same, setting it to 0.1 will reduce the players score by 90%`;
        info.innerHTML += `<br>You must recalculate rankings for the changes to take effect.`;
        form.append(info);

        const cats = this.getUniqueCategories();

        const selectRow = UIDiv("form-row");
        selectRow.append(UILabel("Category"));

        const options = cats.map((c) =>{
            return {"value": c, "display": c.toUpperCase()};
        });

        new UISelect(selectRow, options, this.settingCat, (newValue) =>{
            this.settingCat = newValue;
            this.render();
        });

        form.append(selectRow);

        form.append(UIBr());

        for(let i = 0; i < this.settings.length; i++){

            const s = this.settings[i];

            if(s.category !== this.settingCat) continue;

            form.append(UIFormInputRow(s.display_name, `setting_${i}`, "number", s.points, `${s.display_name}...`, (newValue) =>{
                this.updateSetting(s.id, newValue);
            }));
        }

        this.saveButton = document.createElement("input");
        this.saveButton.type = "button";
        this.saveButton.value = "Save Changes";
        this.saveButton.className = "hidden";

        this.saveButton.addEventListener("click", () =>{
            this.saveChanges();
        });

        form.append(this.saveButton);

        this.renderUnsavedChanges();

        this.content.append(form);
    }


    async recalculateAllRankings(){

        try{

            if(this.bRecalculatingInProgress){
                alert(`Recalculating is already in progress please wait.`);
                return;
            }

            this.bRecalculatingInProgress = true;

            const req = await fetch("/admin/", {
                "headers": {"Content-type": "application/json"},
                "method": "POST",
                "body": JSON.stringify({"mode": "recalculate-all-rankings"})
            });

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            new UINotification(this.parent, "pass", "Rankings Recalculated", res.message);
            
        }catch(err){
            
            console.trace(err);

            new UINotification(this.parent, "error", "Failed To Recalculate Rankings", err.toString())

        }finally{

            this.bRecalculatingInProgress = false;
        }
    }

    renderRecalculateRankings(){

        this.content.innerHTML = ``;

        UIHeader(this.content, "Recalculate Rankings");
        
        const info = UIDiv("info");
        info.className = "info";

        info.append(`Recalculate all Map and Gametype Rankings, you may want to do this after adjusting ranking values to apply the changes.`);

        this.content.append(info);


        const form = UIDiv("form");

        this.recalculateButton = document.createElement("button");
        this.recalculateButton.innerHTML = "Recalculate All Rankings";
        this.recalculateButton.className = "submit-button";
        if(this.bRecalculatingInProgress) this.recalculateButton.className = "hidden";

        this.recalculateButton.addEventListener("click", () =>{

            this.recalculateAllRankings();
        });

        form.append(this.recalculateButton);

        this.content.append(form);
    }

    render(){

        this.content.innerHTML = ``;

        if(this.mode === "settings"){

            return this.renderSettings();

        }else if(this.mode === "recalculate"){
            return this.renderRecalculateRankings();
        }
    }
}


class AdminClearDatabase{

    constructor(parent){

        this.parent = document.querySelector(parent);

        this.wrapper = UIDiv();

        this.parent.append(this.wrapper);

        this.bDeleteInProgress = false;

        this.render();
    }

    async clearTables(){

        try{

            if(this.bDeleteInProgress){
                throw new Error(`Already clearing database tables.`);
            }

            this.bDeleteInProgress = true;
            
            const req = await fetch("/admin", {
                "headers": {"Content-type": "application/json"},
                "method": "POST",
                "body": JSON.stringify({"mode": "clear-database-tables"})
            });

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            new UINotification(this.parent, "pass", "Database Tables Cleared", "All Player and Match data has been deleted.");

        }catch(err){

            console.trace(err);
            new UINotification(this.parent, "error", "Failed To Clear Database Tables", err.toString());

        }finally{

            this.bDeleteInProgress = false;
        }
    }

    render(){

        this.wrapper.innerHTML = ``;
        UIHeader(this.wrapper, "Clear Database Tables");
        const info = UIDiv("info");
        info.append(`Delete all match and player data, site settings and data are not affected.`);
        this.wrapper.append(info);

        const form = UIDiv("form");
        form.className = "form";

        const clearButton = document.createElement("button");
        clearButton.innerHTML = `Clear Database Tables`;
        clearButton.className = "submit-button";
        clearButton.style.cssText = "background-color:var(--team-color-red);";

        clearButton.addEventListener("click", () =>{

            if(window.confirm("Are you sure you want to delete all player and match data? This action can not be undone.")){
                this.clearTables();
            }
        });

        form.append(clearButton);
        this.wrapper.append(form);
    }
}


class AdminCTFLeagueManager{

    constructor(parent){

        this.parent = document.querySelector(parent);

        this.mode = "combined";
        this.settings = [];
        this.savedSettings = [];
        this.bSavingInProgress = false;

        this.wrapper = UIDiv();
        this.content = UIDiv();

        UIHeader(this.wrapper, "CTF League Manager");
        this.createTabs();

        this.unsavedChanges = UIDiv("hidden");

        this.wrapper.append(this.unsavedChanges);
        this.wrapper.append(this.content);
        this.parent.append(this.wrapper);
        
        this.render();
        this.loadSettings();
    }

    async loadSettings(){

        try{

            const req = await fetch("/admin", {
                "headers": {"Content-type": "application/json"},
                "method": "POST",
                "body": JSON.stringify({"mode": "load-ctf-league-settings"})
            });

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            this.settings = res.settings;
            this.savedSettings = JSON.parse(JSON.stringify(this.settings));

            this.render();

        }catch(err){
            console.trace(err);
            new UINotification(this.parent, "error", "Failed To Load Settings", err.toString());
        }
    }

    async saveChanges(){

        try{

            if(this.bSavingInProgress){
                throw new Error(`Previous save is still processing, please wait.`);
            }

            const changes = this.getUnsavedChanges();

            if(changes.length === 0) return;

            this.bSavingInProgress = true;

            const req = await fetch("/admin", {
                "headers": {"Content-type": "application/json"},
                "method": "POST",
                "body": JSON.stringify({"mode": "save-ctf-league-settings", changes})
            });

            const res = await req.json();

            if(res.error !== undefined) throw new Error(res.error);

            this.savedSettings = JSON.parse(JSON.stringify(this.settings));

            new UINotification(this.parent, "pass", "Changes Saved", "CTF League settings have been updated.");
            this.render();

        }catch(err){
            console.trace(err);
            new UINotification(this.parent, "error", "Failed To Save Changes", err.toString());
        }finally{

            this.bSavingInProgress = false;
        }
    }

    createTabs(){

        const options = [
            {"value": "combined", "display": "Gametype & Map Combinations Tables"},
            {"value": "gametypes", "display": "Gametype Tables"},
            {"value": "maps", "display": "Maps Tables"},
        ];

        this.tabs = new UITabs(this.wrapper, options, this.mode);

        this.tabs.wrapper.addEventListener("tabChanged", (e) =>{
            this.mode = e.detail.newTab;
            this.render();
        });
    }


    createInfoElem(){

        const elem = UIDiv("info");

        if(this.mode === "combined"){

            elem.append(`Combined league settings refers to unique gametype & map combinations, each table is for 1 unique combination.`);
            elem.append(UIBr(), `An example would be `, UIB(`CTF-Face - Capture The Flag (insta)`));
            elem.append(` where every match that was played on CTF-Face and the gametype 
                was Capture The Flag (insta) would be counted towards it's unique table.`);

        }else if(this.mode === "gametypes"){

            elem.append(`Gametype league settings refer to any match played with a unique gametype, 
                it doesn't matter what map was played, the match result will be counted towards this table.`);

        }else if(this.mode === "maps"){

            elem.append(`Map league settings refer to any match played on a unique map, 
                it doesn't matter what gametype was played, the match result will be counted towards this table.`);
        }

        elem.append(UIBr(), `Whole League Refreshes refer to automatic recalculating of every CTF League table, 
            the importer will carry out this process every 24 hours since the previous whole league refresh.`);
        return elem;
    }


    updateSetting(id, value){

        for(let i = 0; i < this.settings.length; i++){

            const s = this.settings[i];

            if(s.id != id) continue;
            s.value = value.toString();
            break;
        }

        const unsaved = this.getUnsavedChanges();

        if(unsaved.length > 0){

            this.unsavedChanges.className = "warning";
            this.unsavedChanges.innerHTML = `You have ${unsaved.length} unsaved changes.`;

            this.saveButton.className = "submit-button";

        }else{
            this.unsavedChanges.className = "hidden";
            this.saveButton.className = "hidden";
        }
    }

    getUnsavedChanges(){

        const found = [];

        for(let i = 0; i < this.settings.length; i++){

            const newSetting = this.settings[i];
            const oldSettings = this.savedSettings[i];

            if(newSetting.value.toString() !== oldSettings.value.toString()){

                found.push({"id": newSetting.id, "value": newSetting.value});
            }
        }

        return found;
    }

    render(){

        this.content.innerHTML = ``;

        this.content.append(this.createInfoElem());

        const form = UIDiv("form");

        for(let i = 0; i < this.settings.length; i++){

            const s = this.settings[i];

            if(s.category !== this.mode) continue;

            const row = new UIDiv("form-row");

            row.append(UILabel(s.name));

            if(s.type === "datetime"){

                const elem = UIDiv("form-read-only");
                elem.append(toDateString(s.value, true));
                row.append(elem);
                
            }else if(s.type === "bool"){

                const elem = new UITrueFalse(s.value === "true", `setting_${i}`, false, (newValue) =>{
                    this.updateSetting(s.id, newValue);
                });

                row.append(elem.wrapper);

            }else if(s.type === "integer"){

                row.append(UIInput("number", `setting_${i}`, s.value, s.name, (newValue) =>{
                    this.updateSetting(s.id, newValue);
                }));
            }   

            form.append(row);
        }


        this.saveButton = document.createElement("button");
        this.saveButton.innerHTML = "Save Changes";
        this.saveButton.className = `submit-button ${(this.getUnsavedChanges().length === 0) ? "hidden" : ""}`;

        this.saveButton.addEventListener("click", () =>{
            this.saveChanges();
        });
        form.append(this.saveButton);

        this.content.append(form);
    }
    
}