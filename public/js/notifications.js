class UINotificationsManager{

    constructor(){

        this.elem = document.querySelector("#notifications-wrapper");
        if(this.elem === null) throw new Error(`Failed to find notifications wrapper`);

        this.activeNotificationIndex = -1;

        this.toolBar = UIDiv("notifications-toolbar");

        this.toolBar.innerHTML = "test";

        this.content = UIDiv();

        this.elem.append(this.toolBar, this.content);

        this.notifications = [];
    }

    addNotification(notification){

        this.notifications.unshift(notification);

        if(this.activeNotificationIndex === -1){
            this.activeNotificationIndex = 0;
        }

        this.elem.className = "";

        this.toolBar.innerHTML = `You have ${this.notifications.length} notifications`;

        this.focusNotification(this.activeNotificationIndex);
    }

    focusNotification(index){

        this.content.innerHTML = ``;

        this.content.append(this.notifications[index].wrapper);
    }

    removeNotification(notification){

        let indexToRemove = null;

        for(let i = 0; i < this.notifications.length; i++){

            const n = this.notifications[i];

            if(n.date === notification.date && n.type === notification.type && n.content === notification.content){
                indexToRemove = i;
                break;
            }
        }

        if(indexToRemove === null){
            throw new Error(`failed to find matching notification`);
        }

        this.notifications.splice(indexToRemove, 1);
        this.activeNotificationIndex = -1;
        if(this.notifications.length > 0){
            this.activeNotificationIndex = 0;
            this.focusNotification(this.activeNotificationIndex);
        }else{

            this.elem.className = "hidden";
        }
    }
}

const NOTIFICATIONS_MANAGER = new UINotificationsManager();

class UINotification{

    constructor(type, title, content, callback){

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


        this.dateElem = UIDiv("notification-date");
        this.dateElem.append(this.date);

        this.wrapper.append(this.dateElem, this.title, this.elem, this.closeButton);

        NOTIFICATIONS_MANAGER.addNotification(this);

        this.createEvents();
        this.render();
    }

    createEvents(){

        this.closeButton.addEventListener("click", () =>{

            if(this.callback !== null){
                this.callback();
            }
            NOTIFICATIONS_MANAGER.removeNotification(this);
            //this.wrapper.remove();
            
        });
    }

    render(){

        if(typeof this.content !== "object"){
            this.elem.append(this.content);
        }else{
            this.elem.append(this.content);
        }

        let className = `team-none`;

        if(this.type === "pass") className = "team-green";
        if(this.type === "error") className = "team-red";
        if(this.type === "warning") className = "team-yellow";
        if(this.type === "processing") className = "team-blue";

        this.wrapper.className = `notification ${className}`;
    }
}