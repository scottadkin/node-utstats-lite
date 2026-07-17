class TESTUITable{

    constructor(parent, options, data){

        if(typeof parent === "string"){
            this.parent = document.querySelector(parent);
        }else{
            this.parent = parent;
        }

        this.options = options;
        this.data = data;

        this.perPage = (options.perPage !== undefined) ? parseInt(options.perPage) : 0;

        if(this.perPage !== this.perPage) this.perPage = 0;
        this.page = 0;

        this.setTotalPages();

        this.bNoSort = options.bNoSort ?? false;

        this.bAscOrder = options.bAscOrder ?? true;
        
        this.sortBy = options.sortBy ?? 0;
        this.lastSortBy = this.sortBy;


        if(!this.bNoSort){
            this.sortData();
        }

        this.table = document.createElement("table");

        if(this.options.className !== undefined){
            this.table.className = this.options.className;
        }

        this.parent.append(this.table);


        this.render();
    }

    setTotalPages(){

        if(this.data.length !== 0 && this.perPage !== 0){
            this.totalPages = Math.ceil(this.data.length / this.perPage);
        }else{
            this.totalPages = 1;
        }
    }

    getTable(){
        return this.table;
    }

    renderHeaders(){

        if(this.options.headers === undefined) return;

        if(this.tableHead === undefined){
            this.tableHead = document.createElement("thead");
            
        }else{
            this.tableHead.innerHTML = ``;
        }

        const headerRow = document.createElement("tr");

        for(let i = 0; i < this.options.headers.length; i++){

            const h = this.options.headers[i];

            const cell = document.createElement("th");
            cell.append(h.display);

            
            if(h.className !== undefined){
                cell.className = h.className;
            }


            
            if(!this.bNoSort){
                cell.style.cssText = `user-select:none;cursor:pointer;`;
            }else{

                if(h.callback !== undefined){
                    cell.style.cssText = `user-select:none;cursor:pointer;`;
                }
            }


            cell.addEventListener("click", () =>{

                
                if(!this.bNoSort){

                    this.lastSortBy = this.sortBy;
                    this.sortBy = i;

                    if(this.sortBy === this.lastSortBy){
                        this.bAscOrder = !this.bAscOrder;
                    }

                    
                    this.sortData();
                    this.renderRows();
                }

                if(h.callback !== undefined){
                    h.callback(this.bAscOrder, this.lastSortBy, this.sortBy);
                }

            });
            

            
            headerRow.append(cell);
        }

        
       

        this.tableHead.append(headerRow);

        this.table.append(this.tableHead);
    }



    sortData(){

        this.data.sort((a, b) =>{

            if(a[this.sortBy] === undefined){
                throw new Error(`Array a does not contain index ${this.sortBy}`);
            }
            if(b[this.sortBy] === undefined){
                throw new Error(`Array b does not contain index ${this.sortBy}`);
            }

            a = a[this.sortBy].value;
            b = b[this.sortBy].value;

            if(a < b){
                return (this.bAscOrder) ? -1 : 1;
            }else if(a > b){
                return (this.bAscOrder) ? 1 : -1;
            }
            return 0;
        });
    }

    getDataStartEnd(){

        if(this.totalPages <= 1){
            return {"start": 0, "end": this.data.length};
        }

        if(this.perPage !== 0){

            const start = this.page * this.perPage;

            let end = start + this.perPage;

            if(end > this.data.length) end = this.data.length;

            return {start, end};
            
        }else{
            return {"start": 0, "end": this.data.length};
        }
    }


    createFooterCellTotals(rowIndex, dataType, floatDecimalPlaces){

        if(this.data.length === 0) return 0;

        let total = 0;

        if(floatDecimalPlaces === undefined) floatDecimalPlaces = 2;

        dataType = dataType.toLowerCase();

        const validTypes = ["float", "int"];

        if(validTypes.indexOf(dataType) === -1) throw new Error("Not a valid footer total type");

        if(this.data[0][rowIndex] === undefined){
            throw new Error("Row index doesn't exist!");
        }

        const {start, end} = this.getDataStartEnd();

        for(let i = start; i < end; i++){

            const d = this.data[i];

            let value = this.data[i][rowIndex].value;

            if(d === undefined){
                console.warn(`row doesn't have data index ${rowIndex}`);
                continue;
            }

            if(dataType === "int"){

                value = parseInt(value);
      
                if(value !== value){
                    throw new Error("Not a valid integer");
                }

                total += value;

            }else if(dataType === "float"){

                value = parseFloat(value);
                total += value;
            }
        }

        return total;
    }

    createFooterCellMinMax(rowIndex, dataType, type){

        if(type !== "MIN" && type !== "MAX") throw new Error("NOT a valid type of MIN or MAX");

        dataType = dataType.toLowerCase();

        const validTypes = ["float", "int", "text"];   

        if(validTypes.indexOf(dataType) === -1){
            throw new Error(`Not a valid type from ${type}`);
        }

        let value = "";
        let bSetFirstValue = false;

        const {start, end} = this.getDataStartEnd();

        for(let i = start; i < end; i++){

            const d = this.data[i][rowIndex];

            if(d === undefined){
                console.warn(`Row doesn't have rowIndex of ${rowIndex}`);
                continue;
            }

            if(!bSetFirstValue){
                value = d.value;
                bSetFirstValue = true;
                continue;
            }

            if(type === "MIN" && d.value < value){
                value = d.value;
            }else if(type === "MAX" && d.value > value){
                value = d.value;
            }
        }

        return value;
    }


    createFooterAVGCell(rowIndex, dataType){

        const validTypes = ["int", "float"];

        if(validTypes.indexOf(dataType.toLowerCase()) === -1){
            throw new Error(`Not a valid dataType for AVG`);
        }

        let totalDataPoints = 0;
        let totalValue = 0;

        let bSetFirstValue = false;

        const {start, end} = this.getDataStartEnd();

        for(let i = start; i < end; i++){

            const d = this.data[i][rowIndex];

            if(d === undefined){
                console.warn(`Missing rowIndex ${rowIndex} for AVG`);
                continue;
            }

            if(!bSetFirstValue){

                totalValue = d.value;
                totalDataPoints++;
                bSetFirstValue = true;
                continue;
            }

            totalDataPoints++;
            totalValue += d.value;
        }

        if(totalDataPoints > 0 && totalValue > 0){
            return totalValue / totalDataPoints;
        }

        return totalValue;
    }


    renderFooterRow(){

        if(this.tableFooter === undefined) return;

        if(this.options.footer === undefined || this.options.footer === null){
            //delete this.tableFooter;

            return;
        }

        const row = document.createElement("tr");

        for(let i = 0; i < this.options.footer.length; i++){

            const o = this.options.footer[i];

            const cell = document.createElement("td");

            if(o.className !== undefined) cell.className = o.className;

            if(o.display === "SUM" || o.display === "AVG" || o.display === "MAX" || o.display === "MIN"){

                let value = o.display;

                if(value === "SUM"){

                    value = this.createFooterCellTotals(i, o.dataType);

                    if(o.dataType === "float") value = value.toFixed(2);

                }else if(value === "MIN" || value === "MAX"){

                    value = this.createFooterCellMinMax(i, o.dataType, value);
                    if(o.dataType === "float") value = value.toFixed(2);

                }else if(value === "AVG"){

                    value = this.createFooterAVGCell(i, o.dataType, value).toFixed(2);
                }

                let postFix = o.postFix ?? "";
                
                if(typeof postFix === "function"){
                    postFix = postFix(value);
                }

                let preFix = o.preFix ?? "";

                if(typeof preFix === "function"){
                    preFix = preFix(value);
                }

                const fullOutput = `${preFix}${value}${postFix}`

                if(o.callback === undefined){
                    cell.append(fullOutput);
                }else{
                    cell.append(o.callback(fullOutput));
                }
            }else{

                if(o.callback === undefined){
                    cell.append(o.display ?? o.value);
                }else{
                    cell.append(o.callback(o.display ?? o.value));
                }
            }

            row.append(cell);
        }

        this.tableFooter.append(row);
    }

    renderRows(){
        
        let bFirstRender = true;

        if(this.tableBody !== undefined){

            this.tableBody.innerHTML = ``;
            bFirstRender = false;

        }else{
            this.tableBody = document.createElement("tbody");
        }

        if(this.options.footer === undefined && this.tableFooter !== undefined){
            this.tableFooter.innerHTML = ``;
        }

        if(this.options.footer !== undefined){

            if(this.tableFooter === undefined){
           
                this.tableFooter = document.createElement("tfoot");
            }else{
                this.tableFooter.innerHTML = ``;
            }
        }

        let start = (this.page * this.perPage);
        const totalRows = this.data.length;
        let end = totalRows;

        if(this.perPage !== 0 && start + this.perPage < totalRows){

            end = start + this.perPage;
        }


        for(let i = start; i < end; i++){

            const data = this.data[i];

            const row = document.createElement("tr");

            for(let x = 0; x < data.length; x++){

                const d = data[x];

                let currentCellData = d.display ?? d.value;

                if(d.url !== undefined){

                    const a = document.createElement("a");
                    a.href = d.url;

                    if(d.urlTarget !== undefined) a.target = d.urlTarget;

                    a.append(currentCellData);

                    currentCellData = a;
                }


                

                if(!d.bSkipTD){

                    const cell = document.createElement("td");
        
                    cell.append(currentCellData);
                    if(d.className !== undefined) cell.className = d.className;

                    if(d.id !== undefined){
                        cell.id = d.id;
                    }
                    row.append(cell);

                }else{

                    //don't allow className for override TD

                    if(d.id !== undefined){
                        currentCellData.id = d.id;
                    }

                    row.append(currentCellData);
                }

              
            }

            this.tableBody.append(row);
        }

        this.renderFooterRow();

        if(bFirstRender){

            this.table.append(this.tableBody);
        }

        if(this.tableFooter !== undefined){
            this.table.append(this.tableFooter);
        }

    }

    setSortBy(newSortBy){

        this.sortBy = parseInt(newSortBy);
    }

    updateRows(newRows, newHeaders, newFooter){

        this.tableBody.innerHTML = "";

        this.data = newRows;

        this.page = 0;
        this.setTotalPages();

        
        if(newHeaders !== undefined){
            this.options.headers = newHeaders;
            this.sortBy = 0;
            this.renderHeaders();
        }

        if(newFooter !== undefined && newFooter !== null){
    
            this.options.footer = newFooter;
            
        }else if(newFooter === null){  
            delete this.options.footer;
        }

        if(!this.bNoSort){
            this.sortData();
        }

        this.renderCaption();
        this.renderRows();
    }


    renderButtons(){

        if(this.perPage <= 1 && this.captionTitle === undefined){
            this.caption.classList.add("hidden");
            return;
        }

        this.caption.classList.remove("hidden"); 


        if(this.perPage <= 1){
            return;
        }

        if(this.previous === undefined){

            this.previous = UIButton("Previous Page");
            this.previous.className = "uit-but";

            this.previous.addEventListener("click", () =>{

                if(this.page - 1 < 0) return;

                this.page--;
                
                this.renderCaption();
                this.renderRows();

            });

            this.next = UIButton("Next Page");
            this.next.className = "uit-but";
            this.next.addEventListener("click", () =>{

                if(this.page + 1 >= this.totalPages) return;

                this.page++;
                
                this.renderCaption();
                this.renderRows();

            });

            this.buttonsWrapper = UIDiv("uit-bw");

            this.viewingInfo = UIDiv();

            this.buttonsWrapper.append(this.previous, this.viewingInfo, this.next);
            this.caption.append(this.buttonsWrapper);

        }
        

        if(this.viewingInfo !== undefined){
            this.viewingInfo.innerHTML = "";
            this.viewingInfo.append(`Viewing Page ${this.page + 1} of ${this.totalPages}`);
        }

    }


    renderCaption(){

        if(this.caption === undefined){

            this.caption = document.createElement("caption");
            this.caption.className = "hidden";
            this.table.append(this.caption);
        }


        if(this.captionTitle === undefined){
            this.captionTitle = document.createElement("h3");
            this.caption.append(this.captionTitle);
        }else{
            this.captionTitle.innerHTML = "";
        }

        
        

        if(this.options.caption !== undefined){

            this.captionTitle.append(this.options.caption);  
            this.caption.classList.remove("hidden");  
        }else{
            this.captionTitle.classList.add("hidden");
        }

        this.renderButtons();
    }

    render(){


        this.renderCaption();

        this.renderHeaders();
        this.renderRows();
    }
}