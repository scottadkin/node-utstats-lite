class UINavDropDown{

    constructor(parent, options){

        this.parent = document.querySelector(parent);
        this.options = options;

        this.mainNav = document.querySelector("nav");

        this.wrapper = UIDiv("nav-content");
        this.root = document.querySelector("#nav-dummy");
        this.root.append(this.wrapper);

        this.createElements();
        this.createEvents();
    }

    createElements(){

        for(let i = 0; i < this.options.length; i++){

            const o = this.options[i];
            const elem = document.createElement("a");
            elem.href = `/season/${o.id}/`;
            elem.append(o.name);
            this.wrapper.append(elem)
        }
    }

    createEvents(){

        this.parent.addEventListener("mouseover", (e) =>{

            this.unHide();
            const bounds = this.parent.getBoundingClientRect();
            
            this.wrapper.style.cssText = `margin-top:10px;margin-left:-10px;`;
            //this.wrapper.style.cssText = `margin-left:${bounds.x}px;margin-top:${bounds.height}px;`;
  
        });

        this.wrapper.addEventListener("mouseleave", () =>{

            this.hide();
        });
    }

    unHide(){
        this.root.style.cssText = `display:block;`;
    }

    hide(){
        this.root.style.cssText = `display:none;`;
    }
}