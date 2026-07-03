function createAutoMaxValue(max, interval){

    if(max == 0 || interval == 0) return 0;

    if(max >= 0){
        return interval * Math.ceil(max / interval);
    }else if(max < 0){
        const newMax = interval * Math.floor(Math.abs(max) / interval);
        return -newMax;
    }

}

function createAutoMinValue(min, interval){

    if(min == 0 || interval == 0) return 0;

    const newMin = interval * Math.ceil(Math.abs(min) / interval);

    if(min >= 0){
        return newMin;
    }else if(min < 0){
        return -newMin;
    } 
    
}

/**
 * 
 * @param {*} graphData 
 * @param {*} interval 
 * @param {*} forcedMaxMinValue The max value the minimum value can be
 * @param {*} forcedMinMaxValue The min value the maximum value can be
 */
function setDataRanges(graphData, interval=10, forcedMaxMinValue=null, forcedMinMaxValue=null){

    const dataSet = graphData.data;

    if(interval <= 0) throw new Error(`Interval must be >=0`);

    graphData.maxDataPoints = 0;
    graphData.minValue = forcedMaxMinValue;
    graphData.maxValue = forcedMinMaxValue;
    graphData.range = 0;
    graphData.totalIntervals = 1;
    graphData.interval = interval;
    
    let minFound = 0;
    let maxFound = 0;

    for(let x = 0; x < dataSet.length; x++){

        const v = dataSet[x].data;

        if(v.length > graphData.maxDataPoints){
            graphData.maxDataPoints = v.length;
        }

        const min = Math.min(...v);
        const max = Math.max(...v);

        if(x === 0){
            minFound = min;
            maxFound = max;
            continue;
        }


        if(min < minFound) minFound = min;
        if(max > maxFound) maxFound = max;
        
    }

    let bSetMinValue = false;
    let bSetMaxValue = false;

    

    if(forcedMaxMinValue !== null && minFound > forcedMaxMinValue){
       
        graphData.minValue = createAutoMinValue(forcedMaxMinValue, interval);
        bSetMinValue = true;  

    }


    if(forcedMinMaxValue !== null && maxFound < forcedMinMaxValue){

        graphData.maxValue = createAutoMaxValue(forcedMinMaxValue, interval);
        bSetMaxValue = true;   
    }

    if(!bSetMinValue){

        if(minFound < forcedMaxMinValue){
            graphData.minValue = createAutoMinValue(minFound, interval);
        }else{
            graphData.minValue = createAutoMinValue(forcedMaxMinValue, interval);
        }
    }

    if(!bSetMaxValue){

        if(maxFound > forcedMinMaxValue){
            graphData.maxValue = createAutoMaxValue(maxFound, interval);
        }else{
            graphData.maxValue = createAutoMinValue(forcedMinMaxValue, interval);
        }
    }


    graphData.range = Math.abs(graphData.maxValue - graphData.minValue);
    
    if(graphData.range != 0 && interval != 0){
        graphData.totalIntervals = Math.ceil(graphData.range / interval);
    }
    
}

function bOptionExists(options, key){
    return options?.[key] !== undefined;
}

function checkRequiredParams(requiredKeys, options){

    for(let i = 0; i < requiredKeys.length; i++){

        const r = requiredKeys[i];
        if(options[r] === undefined) throw new Error(`${r} is a required parameter.`);     
    }
}

function bUseScale(options){

    if(!bOptionExists(options, "bNoScale")) return true;

    const value = options.bNoScale;

    if(value === true){
        return false;
    }

    return true;
}

function getMaxAxisSize(canvas, axis){
    return (axis.toLowerCase() === "x") ? canvas.width : canvas.height;
}

function scale(canvas, axis, value){

    axis = axis.toLowerCase();
    if(axis !== "x" && axis !== "y") throw new Error("Unsupported axis");

    if(value === 0) return 0;

    const max = getMaxAxisSize(canvas, axis);
    const bit = max * 0.01;

    return bit * value;
}

function reverseScale(canvas, axis, value){

    if(value === 0) return 0;
    const max = getMaxAxisSize(canvas, axis);

    if(max === 0) return 0;

    return value / max * 100;
}

class GraphCanvas{
    
    constructor(parent, graphId, defaultWidth, defaultHeight, data, overrideOptions){

        if(typeof parent === "string"){
            this.parent = document.querySelector(parent);
        }else{
            this.parent = parent;
        }


        const maxDataPerPage = overrideOptions?.dataPointsPerPage ?? 0; 
        const maxMinValue = overrideOptions?.maxMinValue ?? null; 
        const minMaxValue = overrideOptions?.minMaxValue ?? null; 
        const bNoXAxisLabels = overrideOptions?.bNoXAxisLabels ?? false;
        this.bNoMainTitle = overrideOptions?.bNoMainTitle ?? false;
        const bNoReduceKeySpace = overrideOptions?.bNoReduceKeySpace ?? false;


        this.state = {
            "bLargeView": false,
            "bFullScreen": false,
            "bDisplayAllData": false,
            "page": 0, //0 index
            "totalPages": 1,
            "xAxisFontSize": 1,
            "xAxisLabelWidth": 1,
            "bNoCenterXAxisLabels": false,
            bNoReduceKeySpace
        };

        this.bCreatedMouseMoveEvent = false;

        
        this.canvas = document.createElement("canvas");
        this.canvas.tabIndex = 0;
        this.canvas.id = graphId;

        if(overrideOptions.className !== undefined){

            this.canvas.className = overrideOptions.className;
        }

        this.canvas.width = defaultWidth;
        this.canvas.height = defaultHeight;

        this.originalWidth = defaultWidth;
        this.originalHeight = defaultHeight;

        this.wrapper = document.createElement("div");
        this.wrapper.className = "canvas-wrapper";

        this.canvas.addEventListener("fullscreenchange", () =>{
      

            const fullScreenElem = document.fullscreenElement;

            if(fullScreenElem === null){
                this.state.bLargeView = false;
                this.state.bFullScreen = false;
                this.canvas.width = this.originalWidth;
                this.canvas.height = this.originalHeight;
                this.render();
                return;
            }


            if(fullScreenElem.id !== this.canvas.id){
                this.state.bLargeView = false;
                this.state.bFullScreen = false;
                this.canvas.width = this.originalWidth;
                this.canvas.height = this.originalHeight;
                this.render();
            }
            
        });
        


   
        this.parent.append(this.wrapper);


        this.mouse = {"x": -9999, "y": -9999};
        this.click = null;
        this.lastFontSize = 20;
        this.lastFont = "Arial";
        this.zoom = 100;
        this.keys = {};
        this.mouseOverData = [];

        this.mainTitleFontSize = 3.5;
        this.mainTitleMarginY = 2;

        this.buttonHeight = 6;
        this.buttonFontSize = 4;

        this.bNoXAxisLabels = bNoXAxisLabels;
        this.maxXAxisSize = 2;
        this.maxPossibleXAxisLabelSize = 9;
        this.minPossibleXAxisLabelSize = 1;

        this.buttons = [];
        this.graphKeys = [];
        this.keysRowHeight = 4.7;
        this.keysPaddingTop = 2;
        this.keyIconWidth = 2;
        this.keyIconHeight = 3.4;
        this.keysFontSize = 3.4;
        this.keysStartX = 2;
        this.keysEndX = 98;

        this.maxIntervals = 10;

        //the max value the minimum value can be in the chart
        //null will act as no limit
        this.maxMinValue = maxMinValue;
        this.minMaxValue = minMaxValue;

        this.bMultiDataSet = false;

        this.maxDataPerPage = maxDataPerPage;



        if(Array.isArray(data)){

            this.bMultiDataSet = true;
            this.currentMultiDataSetIndex = 0;

            this.multiDataSet = data;

            this.data = data[0];

        }else{
            this.currentMultiDataSetIndex = null;
            this.data = data;
        }
        
        
        
        
        this.columns = [];

        this.context = this.canvas.getContext("2d", {"willReadFrequently": true});
        this.context.textBaseline = "top";

        this.updateDataPointsInfo();
        this.createDropdown();
        this.wrapper.append(this.canvas);

        this.setPlotAreaSize();


        this.createEvents();

    }

    calculateMaxXAxisLabelSize(plotAreaWidth){

        const minFontSize = 0.6;
        const maxFontSize = 2;

        this.state.xAxisLabelWidth = plotAreaWidth / ((this.state.bDisplayAllData) ? this.data.maxDataPoints : this.maxDataPerPage);
        this.state.xAxisFontSize = this.state.xAxisLabelWidth;

        if(this.state.xAxisFontSize > maxFontSize){
            this.state.xAxisFontSize = maxFontSize;
        }


        if(this.state.xAxisFontSize < minFontSize){
            this.state.bXAxisLabelsTooSmall = true;
        }else{
            this.state.bXAxisLabelsTooSmall = false;
        }

        const {dataEntryStart, dataEntryEnd} = this.getDataStartEnd();

        for(let i = dataEntryStart; i < dataEntryEnd; i++){

            const current = this.drawText({
                "x": 0, 
                "y": 0, 
                "textAlign": "left", 
                "rotate": 90, 
                "fontSize": this.state.xAxisFontSize, 
                "text": this.getDataEntryTitle(i),
                "type": "measure"
            });

            if(current > this.maxXAxisSize){
                this.maxXAxisSize = current;
            }
        }


        if(this.maxXAxisSize > this.maxPossibleXAxisLabelSize){

            this.maxXAxisSize = this.maxPossibleXAxisLabelSize;
            return;
        }

        if(this.maxXAxisSize < this.minPossibleXAxisLabelSize){

            this.maxXAxisSize = this.minPossibleXAxisLabelSize;
        }


    }

    setPlotAreaSize(){

        let width = 92;
        let height = 70;
        let x = 8;
        let y = 7;
     

        this.calculateMaxXAxisLabelSize(width);


        if(!this.bNoMainTitle){
            height -= this.mainTitleFontSize + this.mainTitleMarginY;
            y += this.mainTitleFontSize + this.mainTitleMarginY;
        }


        if(!this.bNoXAxisLabels && !this.state.bXAxisLabelsTooSmall){
            height -= this.maxPossibleXAxisLabelSize - this.maxXAxisSize;
        }else{
            height += 10;
        }


        this.plotArea = {
            x, 
            y,
            width, 
            height
        }
    }

    updateDataPointsInfo(){
        //TODO: add check that keys can't have same name
        setDataRanges(this.data, 10, this.maxMinValue, this.minMaxValue);

    
        this.bDisablePagination = this.maxDataPerPage === null;
 
        this.state.bDisplayAllData = this.maxDataPerPage === 0;
        
        if(this.data.maxDataPoints >= this.maxDataPerPage){
            this.dataPointsPerPage = (this.maxDataPerPage > 0) ? this.maxDataPerPage : this.data.maxDataPoints;
        }else{
            this.dataPointsPerPage = this.data.maxDataPoints;
            this.state.bDisplayAllData = true;
            this.bDisablePagination = true;
        }
    }

    createDropdown(){

        if(!this.bMultiDataSet) return;


        const options = [];

        for(let i = 0; i < this.multiDataSet.length; i++){

            const d = this.multiDataSet[i];

            options.push({"value": i, "name": d.title});
        }


        const dropdown = document.createElement("select");

        dropdown.append(...options.map((o)=>{

            const elem = document.createElement("option");
            elem.value = o.value;
            elem.append(o.name);

            return elem;
        }));

        dropdown.addEventListener("change", (e) =>{

            this.currentMultiDataSetIndex = e.target.value;

            this.data = this.multiDataSet[this.currentMultiDataSetIndex];

            if(this.state.bDisplayAllData){
                this.dataPointsPerPage = this.data.maxDataPoints;
            }else{
                this.dataPointsPerPage = this.maxDataPerPage;
            }

            this.createKeys();

            this.state.page = 0;
            
            setDataRanges(this.data, 10, this.data.minValue, this.data.maxValue);
            this.setTotalPages();
            this.createButtons();
            this.render();
        });

        this.wrapper.append(dropdown);
    }


    async toggleFullScreen(){

        try{

            this.state.bLargeView = false;


            const fullScreenElem = document.fullscreenElement;

            if(fullScreenElem !== null && fullScreenElem.id === this.canvas.id){

                this.state.bFullScreen = false;
                this.canvas.width = this.originalWidth;
                this.canvas.height = this.originalHeight;
                await document.exitFullscreen();
                this.render();
                return;
            }

            if(fullScreenElem === null){
                this.state.bFullScreen = true;
                
                await this.canvas.requestFullscreen();
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
                this.render();
                return;
            }

            await this.canvas.requestFullscreen();
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.render();

        }catch(err){
            console.trace(err);
        }
    }

    toggleDisplayAllData(){

        if(this.dataPointsPerPage === 0){
            return;
        }
        

        this.state.bDisplayAllData = !this.state.bDisplayAllData;
        this.state.page = 0;


        if(!this.state.bDisplayAllData){
            this.dataPointsPerPage = this.maxDataPerPage;
        }else{
            this.dataPointsPerPage = this.data.maxDataPoints;
        }

        this.render();

    }
        

    changePage(newPage){

        if(this.data.maxDataPoints === 0) return;
        if(this.dataPointsPerPage === 0) return;


        

        //remember page starts at index 0 not 1

        if(newPage > this.state.totalPages - 1){
            newPage = this.state.totalPages - 1;
        }else if(newPage < 0){
            newPage = 0;
        }


        this.state.page = newPage;
        this.render();
    }
    

    toggleLargeView(){

        //don't allow this
        if(this.state.bFullScreen){
            this.state.bLargeView = false;
            return;
        }

        const canvas = this.canvas;

        
        if(!this.state.bLargeView){
            canvas.style.cssText = `color:red;`;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            window.location.href = `#${this.canvas.id}`
        }else{
            canvas.style.cssText = "";
            canvas.width = this.originalWidth;
            canvas.height = this.originalHeight;
        }
        
        this.state.bLargeView = !this.state.bLargeView;   
    }

    calcMousePositionInPercent(e){

        // if canvas is 50% scale, then scale the mouse coordinates to prevent the cursor being in wrong position
        const bounds = this.canvas.getBoundingClientRect();

        let offsetWidth = 0;
        let offsetHeight = 0;

        const scaleX = bounds.width / this.canvas.width;
        const scaleY = bounds.height / this.canvas.height;

        let x = e.clientX - bounds.x;
        let y = e.clientY - bounds.y;



        x = reverseScale(this.canvas, "x", x / scaleX);
        y = reverseScale(this.canvas, "y", y / scaleY);


        return {x, y}

    }


    /**
     * Removes/Adds hidden data when users clicks a key
     */
    updateDataRange(){


        let min = this.data.minValue;
        let max = 0;

        for(let i = 0; i < this.data.data.length; i++){

            const entries = this.data.data[i];

            const keyInfo = this.getGraphKeyByName(entries.name);

            if(keyInfo === null) throw new Error("Keyinfo is null");

            if(keyInfo.bHidden) continue;

            for(let x = 0; x < entries.data.length; x++){

                const value = entries.data[x];

                if(i === 0 && x === 0){
                    max = value;
                    continue;
                }

                if(value > max) max = value;
                if(value < min) min = value;

               
            }
        }


        min = createAutoMinValue(min, this.data.interval);

        if(this.maxMinValue !== null && min > this.maxMinValue){
            min = this.maxMinValue;
        }
        max = createAutoMaxValue(max, this.data.interval);

        if(this.minMaxValue !== null && max < this.minMaxValue){

            max = this.minMaxValue;
        }


        const range = Math.abs(max - min);
        

        this.data.minValue = min;
        this.data.maxValue = max;
        this.data.range = range;

        if(range != 0){

            this.data.totalIntervals = Math.ceil(range / this.data.interval);
        }
    }

    createEvents(){

        const canvas = this.canvas;

        /*canvas.addEventListener("keydown", (e) =>{

            if(e.key.toLowerCase() === "escape" && this.state.bLargeView){

                this.toggleLargeView();
                this.render();        
            }
        });*/

        canvas.addEventListener("mousemove", (e) =>{


            const {x, y} = this.calcMousePositionInPercent(e);

            this.mouse.x = x;
            this.mouse.y = y;

        });

        canvas.addEventListener("mouseleave", () =>{
            this.mouse.x = -9999;
            this.mouse.y = -9999;
            this.render();
            canvas.blur();
        });

        canvas.addEventListener("click", (e) =>{

            const {x, y} = this.calcMousePositionInPercent(e);

            this.click = {x, y};

            for(let i = 0; i < this.buttons.length; i++){

                const b = this.buttons[i];

                if(b.bIgnoreEvents) continue;

                if(x >= b.startX && x <= b.startX + b.width){

                    if(y >= b.startY && y <= b.startY + b.height){

                 
                        b.callback();
                       

                        this.render();
                        return;
                    }
                }
            }

            for(let i = 0; i < this.graphKeys.length; i++){

                const k = this.graphKeys[i];
            

                if(x >= k.options.x && x <= k.options.x + k.options.keyIconWidth){

                    if(y >= k.options.y && y <= k.options.y + k.options.keyIconHeight){

                        k.bHidden = !k.bHidden;
                        
                        this.updateDataRange();
                        this.render();
                        return;
                    }
                }
            }

        });
    }

    applyColors(options){

        if(bOptionExists(options, "fillStyle")){
            this.context.fillStyle = options.fillStyle;
        }

        if(bOptionExists(options, "strokeStyle")){
            this.context.strokeStyle = options.strokeStyle;
        }
    }

    setLineWidth(options){

        if(!bOptionExists(options, "lineWidth")) return;

        if(bUseScale(options)){

            let axis = "x";

            if(bOptionExists(options, "bUseHeightLineWidth")){
                axis = "y";
            }

            options.lineWidth = scale(this.canvas, axis, options.lineWidth);
        }

        this.context.lineWidth = options.lineWidth;
        
    }


    drawRect(options){

        const requiredKeys = ["width", "height", "x", "y"];

        checkRequiredParams(requiredKeys, options);

        let {width, height, x, y} = options;

        if(bUseScale(options)){

            x = scale(this.canvas, "x", x);
            y = scale(this.canvas, "y", y);
            width = scale(this.canvas, "x", width);
            height = scale(this.canvas, "y", height);
        }

        this.applyColors(options);


        const type = options.type ?? "fill";

        if(type === "both" || type === "fill"){
            this.context.fillRect(x, y, width, height);
        }


        if(type === "both" || type === "stroke"){

            this.setLineWidth(options);

            this.context.strokeRect(x, y, width, height);
        }
    }

    drawLine(options){



        const requiredKeys = ["points", "lineWidth", "points"];

        checkRequiredParams(requiredKeys, options);

        if(options.points.length === 0) return;

        this.applyColors(options);

        this.setLineWidth(options);

        let points = options.points;

        if(bUseScale(options)){


            for(let i = 0; i < points.length; i++){

                points[i][0] = scale(this.canvas, "x", points[i][0]);
                points[i][1] = scale(this.canvas, "y", points[i][1]);
            }
        }


        this.context.beginPath();
        this.context.moveTo(points[0][0], points[0][1]);

        for(let i = 0; i < points.length; i++){

            const [x, y] = points[i];
            this.context.lineTo(x, y);
        }

        this.context.stroke();
    }

    toDefaultTextBaseLine(){
        this.context.textBaseline = "top";

    }

    drawText(options){

        const requiredKeys = ["text", "x", "y"];

        const measureTypes = ["measure", "fill-measure", "stroke-measure", "both-measure"];
        const fillTypes = [ "both","fill","fill-measure","both-measure"];
        const strokeTypes = [ "both","stroke","stroke-measure","both-measure"];

        checkRequiredParams(requiredKeys, options);

        const context = this.context;
        const canvas = this.canvas;
        
        
        this.applyColors(options);
        this.setLineWidth(options);

        let {x, y} = options;
        const bScale = bUseScale(options);

        let maxWidth = canvas.width;

        if(bScale){

            x = scale(canvas, "x", x);
            y = scale(canvas, "y", y);
        }

        if(bOptionExists(options, "fontFamily")){
            this.lastFont = options.fontFamily;
            context.font = `${this.lastFontSize}px ${options.fontFamily}`;
        }

        if(bOptionExists(options, "fontSize")){

            let fontSize = options.fontSize;

            const bNoTextScale = options?.bNoTextScale ?? false;

            if(!bNoTextScale && bScale){

                if(!bOptionExists(options, "rotate")){
                    fontSize = scale(canvas, "y", fontSize);
                }else{
                    fontSize = scale(canvas, "x", fontSize);
                }
            }

            this.lastFontSize = fontSize;

            context.font = `${fontSize}px ${this.lastFont}`;  
        }


        const preBoldFont = context.font;

        if(bOptionExists(options, "bold")){

            context.font = `bold ${context.font}`;
        }

        if(bOptionExists(options, "textAlign")){
            context.textAlign = options.textAlign;
        }

        if(bOptionExists(options, "textBaseline")){
            context.textBaseline = options.textBaseline;
        }


        if(bOptionExists(options, "maxWidth")){

            if(bScale){
                if(bOptionExists(options, "rotate")){
                    maxWidth = scale(canvas, "y", options.maxWidth);
                }else{
                    maxWidth = scale(canvas, "x", options.maxWidth);
                }     
            }else{
                maxWidth = options.maxWidth;
            }   
        }

        const type = options.type ?? "fill";

        let textWidth = null;

        if(measureTypes.indexOf(type) !== -1){

            textWidth = context.measureText(options.text).width;

            if(bScale){

                if(textWidth > maxWidth) textWidth = maxWidth;

                textWidth = reverseScale(canvas, (bOptionExists(options, "rotate")) ? "y" : "x", textWidth);
            }

            if(type === "measure"){

                this.toDefaultTextBaseLine();
                
                return textWidth;
            }
        }
        
        let bRotated = false;

        if(bOptionExists(options, "rotate")){     
            context.save();
            context.translate(x, y); 
            context.rotate(options.rotate * Math.PI / 180);
            x = 0;
            y = 0;
            bRotated = true;
        }

        

        if(fillTypes.indexOf(type) !== -1){

            context.fillText(options.text, x,y, maxWidth);
        }


        if(strokeTypes.indexOf(type) !== -1){
            context.strokeText(options.text, x,y, maxWidth);
        }

        if(bRotated){
            context.restore();
        }

        context.font = preBoldFont;

        this.toDefaultTextBaseLine();
        return textWidth;
        
    }


    setTotalPages(){

        if(this.data.maxDataPoints === 0 || this.dataPointsPerPage === 0){
            this.state.totalPages = 1;

            return;
        }

        this.state.totalPages = Math.ceil(this.data.maxDataPoints / this.dataPointsPerPage);
    }

    createButtons(){

        this.setTotalPages(); 

        const startY = this.plotArea.y - this.buttonHeight - 0.4;
        const startX = this.plotArea.x;

        this.buttons = [
            new ToggleButton(
                this, 
                {
                    "x": startX, 
                    "y": startY, 
                    "width": 15, 
                    "height": this.buttonHeight, 
                    "fontSize": this.buttonFontSize
                },
                "Normal View", 
                "Fullscreen",  
                "bFullScreen", () =>{ this.toggleFullScreen()},     
            ),
            new ToggleButton(
                this, 
                {
                    "x": startX + 15, 
                    "y": startY, 
                    "width": 15, 
                    "height": this.buttonHeight, 
                    "fontSize": this.buttonFontSize
                },
                "Normal View", "Large View", "bLargeView", () =>{ this.toggleLargeView()},     
            )
        ]; 


        if(!this.bDisablePagination && this.state.totalPages > 1){

            this.buttons.push(
                new ToggleButton(
                    this, 
                    {
                        "x": 55, 
                        "y": startY, 
                        "width": 15, 
                        "height": this.buttonHeight, 
                        "fontSize": this.buttonFontSize
                    },
                    "Display By Page", "Display All", "bDisplayAllData",  
                    () =>{ this.toggleDisplayAllData()},     
                ),
                
                new PaginationButton(
                    this, 
                    {
                        "x": 70, 
                        "y": startY, 
                        "width": 15, 
                        "height": this.buttonHeight, 
                        "fontSize": this.buttonFontSize
                    },
                    "Previous Page",
                    () =>{ this.changePage(this.state.page - 1)}, 
                    this.dataPointsPerPage,
                    this.state.totalPages,
                    this.state.page
                ),
            new PaginationButton(
                this, 
                {
                    "x": 85, 
                    "y": startY, 
                    "width": 15, 
                    "height": this.buttonHeight, 
                    "fontSize": this.buttonFontSize
                },
                "Next Page",
                () =>{ this.changePage(this.state.page + 1)},    
                this.dataPointsPerPage,
                this.state.totalPages,
                this.state.page 
            ));
        }
    }

    preCalculateKeyWidths(keyFontSize, maxWidth, keyWidth, keyLabelPaddingX){


        const test = [];

        for(let i = 0; i < this.data.data.length; i++){

            const d = this.data.data[i];

            //need to check text wont go off screen, if it does start a new row for keys
            const textWidth = this.drawText({
                "text": d.name, 
                "x": 0, 
                "y": 0,
                "textAlign": "left",
                "fontSize": keyFontSize,
                "type": "measure",
                maxWidth
            });

            test.push({"width":textWidth, "name": d.name, "fillStyle": d.fillStyle});
   
        }

        if(!this.state.bNoReduceKeySpace){
            
            test.sort((a, b) =>{

                a = a.width;
                b = b.width;

                if(a > b){
                    return -1;
                }else if(a < b){
                    return 1;
                }
                return 0;

            });
        }

        return test;
    }

    createKeys(){

        const xAxisLabelSize = (this.bNoXAxisLabels) ? 0 : this.maxXAxisSize;

        const startX = 1;
        const startY = this.plotArea.y + this.plotArea.height + this.keysPaddingTop + xAxisLabelSize;

        const rowHeight = this.keysRowHeight;
        const keyWidth = this.keyIconWidth;
        const keyHeight = this.keyIconHeight;
        const keyFontSize = this.keysFontSize;
        const keyLabelPaddingX = 1;
        const maxWidth = 14;

        let x = startX;
        let y = startY;

        this.graphKeys = [];

        const keyWidths = this.preCalculateKeyWidths(keyFontSize, maxWidth, keyWidth, keyLabelPaddingX);


        let remainingSpace = 100;

        while(keyWidths.length > 0){

            for(let i = 0; i < keyWidths.length; i++){

                const k = keyWidths[i];

                if(k.width + keyWidth + keyLabelPaddingX < remainingSpace){

                    const currentKey = new CanvasGraphKey(this, k.name, {
                        x, 
                        y,
                        "keyIconWidth": keyWidth,
                        "keyIconHeight": keyHeight,
                        "textAlign": "left",
                        "bgColor": k.fillStyle,
                        "bgStrokeColor":"rgba(255,255,255,0.125)",
                        "fontColor": "white",
                        "fontSize": keyFontSize,
                        "type": "fill",
                        "keyWidth": keyWidth,
                        keyLabelPaddingX,
                        "maxWidth": k.width
                    });

                    this.graphKeys.push(currentKey);

                    x += k.width + keyWidth + keyLabelPaddingX;
                    remainingSpace -= k.width + keyWidth + keyLabelPaddingX;
                    keyWidths.splice(i, 1);
                    continue;
                    
                }
                
                if(i === keyWidths.length - 1){

                    y += rowHeight;

                    remainingSpace = 100;
                    x = startX;

                    const currentKey = new CanvasGraphKey(this, k.name, {
                        x, 
                        y,
                        "keyIconWidth": keyWidth,
                        "keyIconHeight": keyHeight,
                        "textAlign": "left",
                        "bgColor": k.fillStyle,
                        "bgStrokeColor":"rgba(255,255,255,0.125)",
                        "fontColor": "white",
                        "fontSize": keyFontSize,
                        "type": "fill",
                        "keyWidth": keyWidth,
                        keyLabelPaddingX,
                        "maxWidth": k.width
                    });

                    x += k.width + keyWidth + keyLabelPaddingX;
                    this.graphKeys.push(currentKey);
                    remainingSpace -= k.width + keyWidth + keyLabelPaddingX;

                    keyWidths.splice(i, 1);
                }
            }
        }
    }

    renderKeys(){

        for(let i = 0; i < this.graphKeys.length; i++){

            this.graphKeys[i].render();
            
        }
    }

    getGraphKeyByName(targetName){

        targetName = targetName.toLowerCase();

        for(let i = 0; i < this.graphKeys.length; i++){

            const k = this.graphKeys[i];

            if(k.text.toLowerCase() === targetName) return k;
        }

        return null;
    }

    renderButtons(){

        this.canvas.style.cssText = "";

        for(let i = 0; i < this.buttons.length; i++){

            const b = this.buttons[i];

            b.render();
        }

    }

    renderCrosshair(){

        const mouseX = scale(this.canvas, "x", this.mouse.x);
        const mouseY = scale(this.canvas, "y", this.mouse.y);

        const shadowOffset = 1;
        const width = 20;
        const height = 2;


        const x1 = mouseX - width * 0.5;
        const x2 = mouseX - height * 0.5;

        const y1 = mouseY - height * 0.5;
        const y2 = mouseY - width * 0.5;

        this.drawRect({"x": x1 + shadowOffset, "y": y1 + shadowOffset, "fillStyle": "black", width, height, "bNoScale": true});
        this.drawRect({"x": x2, "y":y2 + shadowOffset, "fillStyle": "black", "width": height, "height": width, "bNoScale": true});

        this.drawRect({"x": x1, "y": y1, "fillStyle": "white", width, height, "bNoScale": true});
        this.drawRect({"x": x2, "y": y2, "fillStyle": "white", "width": height, "height": width, "bNoScale": true});

        
        //also hide real cursor
        this.canvas.style.cssText = "cursor:none;";
    }

    copyCurrentImageToHiddenCanvas(){

        this.savedFullDraw = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        

        this.hiddenCanvas = document.createElement("canvas");
        this.hiddenCanvas.context = this.hiddenCanvas.getContext("2d");
        this.hiddenCanvas.width = this.canvas.width;
        this.hiddenCanvas.height = this.canvas.height;

        this.hiddenCanvas.context.putImageData(this.savedFullDraw, 0, 0);
    }

    renderPlotArea(){

        this.drawRect({
            ...this.plotArea,
            "fillStyle": "rgba(255,255,255,0.125)",
            "type": "both",
            "strokeStyle": "rgba(255,255,255,0.75)",
            "lineWidth": 0.125
        });
    }

    renderMouseMove(){

        requestAnimationFrame((timestamp) =>{

            this.context.drawImage(this.hiddenCanvas, 0, 0);

            
            this.renderButtons();
            
            
            this.renderKeys();
            this.renderHoverData();
            this.renderCrosshair();
            

        });
    }

     renderLabels(){

        const plotArea = this.plotArea;
        const data = this.data;

        let intervals = this.data.totalIntervals;

        if(intervals > this.maxIntervals) intervals = this.maxIntervals;

        const startY = plotArea.y + plotArea.height;
        const startX = plotArea.x;
        const endX = plotArea.x + plotArea.width;
        const maxLabelWidth = 6;
        const intervalPercent = 1 / intervals;

        const intervalHeight = plotArea.height * intervalPercent;
        const quaterValue = data.range * intervalPercent;

        const lineWidth = 0.125;


        for(let i = 0; i < intervals + 1; i++){

            const y = startY - intervalHeight * i - lineWidth * 0.5;

            const xLabelOffset = 0.5;

            this.drawLine({
                "points": [
                    [startX - xLabelOffset,y - (lineWidth * 0.5)],
                    [startX, y]
                ],
                "strokeStyle": "rgba(255,255,255,0.75)",
                "lineWidth": lineWidth    
            });

            if(i > 0){

                const colour = (i % 2 === 1) ? 64 : 0;

                this.drawRect({
                    "x": startX,
                    y,
                    "fillStyle": `rgba(${colour},${colour},${colour},0.15)`,
                    "width": endX,
                    "height": intervalHeight
                });
            }



            this.drawText({
                "text": this.data.minValue + quaterValue * i,
                "fillStyle": "white",
                "textAlign": "right",
                "textBaseline": "bottom",
                "fontSize": 3,
                "type": "fill",
                "x": startX  - xLabelOffset - xLabelOffset,
                "y": y - (lineWidth * 0.5),
                "maxWidth": maxLabelWidth
            });
        }

        this.toDefaultTextBaseLine();
    }

    renderHoverData(){}

    bRenderHoverData(){

        if(this.mouse.x < this.plotArea.x || this.mouse.x > this.plotArea.x + this.plotArea.width){
            return false;
        }

        if(this.mouse.y < this.plotArea.y || this.mouse.y > this.plotArea.y + this.plotArea.height){
            return false;
        }

        return true;
    }

    getMouseOverBoxInfo(){

        let startX = this.mouse.x;
        let startY = this.mouse.y;
        const width = 25;
        const titleFontSize = 3;
        const titleHeight = 5;

        const maxX = this.plotArea.x + this.plotArea.width;
        const maxY = 100;

        if(startX + width > maxX){
            startX = this.mouse.x - width;
        }


        const dataRowHeight = 3;
        const labelXOffset = 1;
        const maxLabelWidth = 11;
        const valueXOffset = labelXOffset + maxLabelWidth + 1;

        const dataFontSize = 2.8;

        const totalVisible = this.graphKeys.filter((k) => !k.bHidden).length;
        const mainHeight = titleHeight + titleFontSize + dataRowHeight * totalVisible;

        if(startY + mainHeight > maxY){
      
            startY = startY - mainHeight;
        }

        return {
            width, titleFontSize, titleHeight, 
            maxX, maxY, dataRowHeight, labelXOffset, 
            maxLabelWidth, valueXOffset, dataFontSize, 
            totalVisible, mainHeight, startX, startY
        }
    }

    

    
    renderMouseOverMainBox(){

        const {mouseOverData, mouseOverTitle, entryData} = this.getMouseOverData();

        if(mouseOverData === null){
            return;
            //throw new Error("Failed to find mouse over data");
        }


        const { width, titleFontSize, titleHeight, 
            maxX, maxY, dataRowHeight, labelXOffset, 
            maxLabelWidth, valueXOffset, dataFontSize, 
            totalVisible, mainHeight, startX, startY
        } = this.getMouseOverBoxInfo();

        this.context.shadowColor = "rgba(0,0,0,0.9)";
        this.context.shadowBlur = 15;

        let x = startX;
        let y = startY;

        this.drawRect({
            "x": x, "y": y,
            "width": width,
            "height": mainHeight,
            "fillStyle": "rgba(0,0,0,0.85)",
            "strokeStyle": "rgba(255,255,255,0.1)",
            "lineWidth": 0.2,
            "type": "both"
        });

        this.context.shadowBlur = 0;

        this.drawText({
            "x": x + width * 0.5,
            "y": y + titleFontSize * 0.2,
            "maxWidth": width,
            "fillStyle": "white",
            "text": mouseOverTitle,
            "fontSize": titleFontSize,
            "textAlign": "center",
            "bold": true
        });



        y += dataRowHeight;
        

        mouseOverData.sort((a, b) =>{

            a = a.value;
            b = b.value;

            if(a < b){
                return 1;
            }else if(a > b){
                return -1;
            }
            
            return 0;
        });

        for(let i = 0; i < mouseOverData.length; i++){

            const d = mouseOverData[i];

            const keyInfo = this.getGraphKeyByName(d.entry.name);

            if(keyInfo === null) throw new Error(`Failed to get keyInfo`);

            if(keyInfo.bHidden){
                continue;
            }

            y += dataRowHeight;

            this.drawText({
                "x": x + labelXOffset,
                y,
                "maxWidth": maxLabelWidth,
                "fillStyle": d.entry.fillStyle,
                "text": d.entry.name,
                "textAlign": "left",
                "fontSize": dataFontSize
            });

            this.drawText({
                "x": x + width * 0.98,
                y,
                "fillStyle": d.entry.fillStyle,
                "maxWidth": 10,
                "text": d.value,
                "textAlign": "right"
            });  
        }
    }

    getMouseOverData(){

        return null;
    }

    /**
     * 
     * @returns The first data index and the end of page index, or last index if page index > totalEntries
     */
    getDataStartEnd(){

        const dataEntryStart = this.state.page * this.dataPointsPerPage;

        let dataEntryEnd = this.data.maxDataPoints;

        if(dataEntryStart + this.dataPointsPerPage <= this.data.maxDataPoints){
            dataEntryEnd =  dataEntryStart + this.dataPointsPerPage; 
        }

        return {dataEntryStart, dataEntryEnd};
    }

    getDataEntryTitle(index){

        return this.data?.dataTitles?.[index] ?? `Data Point ${index + 1}`
    }

    renderXAxisLabel(dataIndex, x, width){

        if(this.bNoXAxisLabels || this.maxXAxisSize === 0) return;

        const maxFontSize = 1.6;

        let fontSize = this.state.xAxisFontSize;

        let fontOffset = 0;

        if(fontSize > maxFontSize){
            fontSize = maxFontSize;
        }

        if(!this.state.bNoCenterXAxisLabels){
            fontOffset = ((fontSize - this.state.xAxisLabelWidth) * 0.5) - fontSize;
        }else{
            fontOffset = -(fontSize * 0.5);
        }


        if(fontSize < 0.6){
            return;
        }

        this.drawText({
            "x": x - fontOffset, 
            "y": this.plotArea.y + this.plotArea.height + 0.5, 
            "textAlign": "left", 
            "rotate": 90, 
            "fontSize": fontSize, 
            "maxWidth": this.maxXAxisSize,
            "text": this.getDataEntryTitle(dataIndex), 
            "fillStyle": "rgb(230,230,230)",
        });
    }

    renderDisplayingPageInfo(){

        if(this.state.totalPages <= 1) return;
        if(this.state.bDisplayAllData) return;


        const fontSize = 3;

        this.drawText({
            "x": this.plotArea.x + 30 + 8.5, 
            "y": this.plotArea.y - this.buttonHeight + fontSize * 0.5, 
            "fillStyle": 
            "rgba(200,200,200)", 
            "textAlign": "center",
            fontSize,
            "maxWidth": 15,
            "text": `Page ${this.state.page + 1} of ${this.state.totalPages}`
        });
        
    }

    renderTitle(){

        if(this.data.title === undefined || this.bNoMainTitle) return;
        const titleFontSize = this.mainTitleFontSize;

        this.drawText({
            "text": this.data.title, 
            "x": 50, "y": this.mainTitleMarginY, 
            "fontSize": titleFontSize, 
            "textAlign": "center", 
            "fillStyle": "white",
            "bold": true,
            "maxWidth": 100
        });
        
    }

    render(){}
    
}


class CanvasButton{

    constructor(graphCanvas, dimensions, display, callback){

        this.graphCanvas = graphCanvas;
        this.display = display;
        this.callback = callback;
        this.bIgnoreEvents = false;

        this.setDimensions(dimensions);
    }


    setDimensions(dimensions){

        const requiredDimensions = ["x","y","width","height"];

        const dKeys = Object.keys(dimensions);

        for(let i = 0; i < requiredDimensions.length; i++){

            if(requiredDimensions.indexOf(dKeys[i]) === -1){
                throw new Error(`ToggleButton dimensions is missing key ${requiredDimensions[i]}`);
            }
        }

        this.startX = dimensions.x;
        this.startY = dimensions.y;
        this.width = dimensions.width;
        this.height = dimensions.height;
        this.endX = dimensions.x + dimensions.width;
        this.endY = dimensions.y + dimensions.height;

        this.fontSize = dimensions.fontSize ?? this.height * 0.8;
    }

    bMouseOver(mouse){

        if(mouse.x >= this.startX && mouse.x <= this.endX){
            if(mouse.y >= this.startY && mouse.y <= this.endY){
                return true;
            }  
        }

        return false;
    }

    createGradient(){

        const context = this.graphCanvas.context;
        const canvas = this.graphCanvas.canvas;

        const gradient = context.createLinearGradient(
            scale(canvas, "x", this.startX), 
            scale(canvas, "y", this.startY), 
            scale(canvas, "x", this.startX), 
            scale(canvas, "y", this.endY)
        );
        
        gradient.addColorStop(0, "rgba(0, 0, 0, 0.1)");
        gradient.addColorStop(1, "rgba(0,0,0,0.4)");

        return gradient;
    }

    render(overrideBgColor, overrideText){

        const context = this.graphCanvas.context;
        const canvas = this.graphCanvas.canvas;
        const mouse = this.graphCanvas.mouse;

        const textAlign = "center";
  
        const nonActiveBGColor = "rgb(0,120,200)";

        const gradient = this.createGradient();


        const bMouseOver = this.bMouseOver(mouse);

        if(bMouseOver && !this.bIgnoreEvents){
            //this.graphCanvas.canvas.style.cssText = "cursor:pointer";
        }else if(bMouseOver && this.bIgnoreEvents){

            //this.graphCanvas.canvas.style.cssText = "cursor:not-allowed";
        }

        const bgColor = (!this.bIgnoreEvents) ? (overrideBgColor ?? nonActiveBGColor) : "rgb(0,0,0,0.2)";
        const fontColor = (this.bIgnoreEvents) ? "rgba(200,0,0,0.2)" : (bMouseOver) ? "yellow" : "white";

        this.graphCanvas.drawRect({
            "x": this.startX, 
            "y": this.startY, 
            "width": this.width, 
            "height": this.height, 
            "fillStyle": bgColor,
            "type": "both",
            "strokeStyle": "black",
            "lineWidth": 0.2
        });

        this.graphCanvas.drawRect({
            "x": this.startX, 
            "y": this.startY, 
            "width": this.width, 
            "height": this.height,  
            "fillStyle": gradient
        });

        this.graphCanvas.drawText({
            "text": (overrideText !== undefined) ? overrideText : this.display, 
            "x": this.startX + this.width * 0.5, 
            "y": this.startY + this.height * 0.5, 
            "fillStyle": fontColor,
            "fontSize": this.fontSize,
            "maxWidth": this.width * 0.9,
            "textBaseline": "middle",
            textAlign
        });

        return {context ,canvas, mouse, textAlign, fontColor, gradient, bgColor}
    }
}

class PaginationButton extends CanvasButton{

    constructor(graphCanvas, dimensions, display, callback, perPage, totalPages, currentPage){

        super(graphCanvas, dimensions, display, callback);


        this.perPage = perPage;
        this.totalPages = totalPages;
        this.currentPage = currentPage;
    }

    render(){

        

        if(this.graphCanvas.state.bDisplayAllData){
            this.bIgnoreEvents = true;
           // return;
        }else{
            this.bIgnoreEvents = false;
        }


        super.render();

    }
}

class ToggleButton extends CanvasButton{

    constructor(graphCanvas, dimensions, displayTrue, displayFalse, stateKey, callback){

        super(graphCanvas, dimensions, displayTrue, callback);
        
        this.displayTrue = displayTrue;
        this.displayFalse = displayFalse;
        
        this.stateKey = stateKey;

    }


    render(){

        
        const stateValue = this.graphCanvas.state[this.stateKey];

        let overrideColor = "rgb(0,120,200)";
        if(this.stateKey === "bLargeView" && this.graphCanvas.state.bFullScreen){
            overrideColor = "rgba(0,0,0,0.2)";   
            this.bIgnoreEvents = true;    
        }else{
            this.bIgnoreEvents = false
        }

        let displayText = (stateValue) ? this.displayTrue : this.displayFalse;

        super.render(overrideColor, displayText);


        
    }
}

class CanvasGraphKey{

    constructor(graphCanvas, text, options){

        this.graphCanvas = graphCanvas;
        this.options = options;
        this.text = text;
        this.bHidden = false;

        const requiredOptions = [
            "x", "y", 
            "keyIconWidth", "keyIconHeight", 
            "fontColor", "bgColor", 
            "bgStrokeColor", "textAlign",
            "fontSize",
            "maxWidth",
            "keyLabelPaddingX"
        ];

        const foundKeys = Object.keys(options);

        for(let i = 0; i < requiredOptions.length; i++){

            const r = requiredOptions[i];

            if(foundKeys.indexOf(r) === -1){
                throw new Error(`${r} is required for CanvasGraphKeyOptions`);
            }
        }
    }

    bMouseOver(){

        const {x, y, keyIconWidth, keyIconHeight} = this.options;

        const mouse = this.graphCanvas.mouse;

        if(mouse.x >= x && mouse.x <= x + keyIconWidth){

            if(mouse.y >= y && mouse.y <= y + keyIconHeight){

                return true;
            }
        }

        return false;
    }
    

    render(){


        const { 
            x, y, keyWidth, keyHeight, 
            keyLabelPaddingX, fontSize, 
            bold, type, maxWidth, 
            bgColor, bgStrokeColor, keyIconHeight, keyIconWidth
        } = this.options;

        const bMouseOver = this.bMouseOver();

        const hiddenColor = "rgba(120,120,120,0.5)";

        this.graphCanvas.drawText({
            "text": this.text, 
            "x": x + keyWidth + keyLabelPaddingX * 0.5, 
            "y": y,
            "textAlign": "left",
            "fillStyle": (this.bHidden && !bMouseOver) ? hiddenColor : (bMouseOver) ? "yellow" :"white",
            "fontSize": fontSize,
            "type": "fill",
            "bold": true,
            "maxWidth": maxWidth
        });

        this.graphCanvas.drawRect({
            "x": x,
            "y": y,
            "width": keyIconWidth,
            "height": keyIconHeight,
            "type": "both",
            "fillStyle": (this.bHidden) ? hiddenColor : bgColor,
            "strokeStyle": (this.bHidden) ? hiddenColor : bgStrokeColor,
            "lineWidth": 0.25
        });

    
    }
}

class BarChartGraph extends GraphCanvas{

    /**
     * 
     * @param {*} parent 
     * @param {*} graphId 
     * @param {*} width 
     * @param {*} height 
     * @param {*} data 
     * @param {*} maxDataPerPage set to null to remove pagination
     * @param {*} maxMinValue The max value the lowest value can be as a plot point
     * @param {*} minMaxValue The min value the highest value can be as a plot point
     */
    constructor(parent, graphId, width, height, data, overrideOptions){

        super(parent, graphId, width, height, data, overrideOptions);

        this.createButtons();    
        this.createKeys();   

        this.render();
    };

    

    createColumns(){

        const plotArea = this.plotArea;
        const data = this.data;

        this.barPaddingX = 0;
        const barWidth = (plotArea.width - this.barPaddingX * this.dataPointsPerPage) / this.dataPointsPerPage;
        
        const barHeightPercent = plotArea.height / data.range; 


        const entries = data.data;
        //sort entries by value so smaller graphs not hidden behind largers ones
        //display from largest to smallest

        this.columns = [];

        this.mouseOverData = [];
        const hoverData = [];

        const {dataEntryStart, dataEntryEnd} = this.getDataStartEnd();

        for(let i = 0; i < entries.length; i++){

            const entry = entries[i];

            const startX = plotArea.x;
            const startY = plotArea.y + plotArea.height;
            const endY = plotArea.y;

            let currentX = startX;
            
            const endX = currentX + barWidth;
            
            for(let z = dataEntryStart; z < dataEntryEnd; z++){

                const d = entry.data[z] ?? 0;

                const currentHoverIndex = z - dataEntryStart;
                
                if(hoverData[currentHoverIndex] === undefined){

                    hoverData[currentHoverIndex] = {
                        "title": this.getDataEntryTitle(z),
                        "data": []
                    };
                }

                const offsetToMin = d - data.minValue

                let height = (barHeightPercent * offsetToMin);
                height = (height < plotArea.height) ? height : plotArea.height;

                let y = (startY - height <= plotArea.y + plotArea.height) ? startY - height : plotArea.y - plotArea.height;

                hoverData[currentHoverIndex].data.push({"entry": entries[i], "value": parseFloat(d)});

                const barOptions = {
                    "x": currentX, 
                    y,
                    "width": barWidth, 
                    "height": height, 
                    "dataName": entries[i].name
                }

                if(this.columns[currentHoverIndex] === undefined){
                    //use this for hoverdata later
                    this.columns[currentHoverIndex] = {
                        "maxSize": {
                            "startX": currentX,
                            "endX": currentX + barWidth,
                            "startY": plotArea.y,
                            "endY": plotArea.y + plotArea.height 
                        },
                        "data": []
                    };
                }


                if(entry.fillStyle !== undefined) barOptions.fillStyle = entry.fillStyle;
                this.columns[currentHoverIndex].data.push(barOptions);
                currentX += barWidth + this.barPaddingX;
                
            } 

        }

        this.mouseOverData = hoverData;


        for(let i = 0; i < this.columns.length; i++){

            const bar = this.columns[i].data;

            bar.sort((a, b) =>{
                return b.height - a.height;
            });
            
        }
    }

    renderData(){

        if(this.data.maxDataPoints === 0) return;

        const {dataEntryStart, dataEntryEnd} = this.getDataStartEnd();
   

        for(let i = 0; i < this.columns.length; i++){

            const c = this.columns[i].data;

            for(let x = 0; x < c.length; x++){

                if(x === 0) this.renderXAxisLabel(dataEntryStart + i, c[x].x, c[x].width);

                const keyInfo = this.getGraphKeyByName(c[x].dataName);
                if(keyInfo.bHidden) continue;

                this.drawRect({...c[x], "type": "fill"});
                const test = {...c[x], "type": "fill"}

                const testStartX = scale(this.canvas, "x", c[x].x);
                const testEndX = scale(this.canvas, "x", c[x].x + c[x].width);
                const testStartY = scale(this.canvas, "y", c[x].y);
                const testEndY = scale(this.canvas, "y", c[x].y + c[x].height);

                const g = this.context.createLinearGradient(testStartX, testStartY, testEndX, testStartY);
                g.addColorStop(1, "rgba(0,0,0,0.0)")
                g.addColorStop(0, "rgba(0,0,0,0.3)")
                test.fillStyle = g;
                this.drawRect(test);
                
            }
        }
    }


    /**
     * Get the largest column size from the current dataset
     * @param {*} targetData 
     * @returns 
     */
    getLargestNonHiddenColumnSize(targetData){

        let maxWidth = 0;
        let maxHeight = 0;
        let x = 0;
        let y = 0;

        for(let i = 0; i < targetData.length; i++){

            const d = targetData[i];

            if(i === 0){
                x = d.x;
                y = d.y;
            }

            const keyInfo = this.getGraphKeyByName(d.dataName);

            if(keyInfo === undefined) throw new Error(`Failed To Get Keyinfo`);

            if(keyInfo.bHidden) continue;

            if(d.width > maxWidth) maxWidth = d.width;
            if(d.height > maxHeight) maxHeight = d.height;
        }


        return {x, y, "width": maxWidth, "height": maxHeight};

    }

    renderHighlightBar(columnData){

        const highlightColumnInfo = this.getLargestNonHiddenColumnSize(columnData);

        this.drawRect({
            "x": highlightColumnInfo.x,
            "y": this.plotArea.y + this.plotArea.height - highlightColumnInfo.height,
            "width": highlightColumnInfo.width,
            "height": highlightColumnInfo.height,
            "fillStyle": `rgba(255,255,255,0.25)`
        });

    }

    getMouseOverData(){

        let mouseOverData = null;
        let mouseOverTitle = "title";

        let entryData = null;

        for(let i = 0; i < this.columns.length; i++){

            const {maxSize, data} = this.columns[i];

            if(this.mouse.x >= maxSize.startX && this.mouse.x <= maxSize.endX + this.barPaddingX){
 
                mouseOverData = this.mouseOverData[i].data;
                mouseOverTitle = this.mouseOverData[i].title;
                entryData = data;
                break;
            }
        }

        return {mouseOverData, mouseOverTitle, entryData};
    }


    renderHoverData(){


        if(!this.bRenderHoverData()) return;

        const {mouseOverData, mouseOverTitle, entryData} = this.getMouseOverData();

        if(mouseOverData === null){
            return;
            //throw new Error("Failed to find mouse over data");
        }

        this.renderHighlightBar(entryData);

        this.renderMouseOverMainBox();

    }


    render(){

        this.setPlotAreaSize();
        this.createColumns();

        

        this.toDefaultTextBaseLine();
        this.drawRect({
            "x": 0, "y": 0, 
            "width": 100, 
            "height": 100, 
            "fillStyle": "rgb(32,32,32)",
        });

        this.renderTitle();

       
        this.renderPlotArea();
        this.renderData();

        this.renderLabels();
        

        this.drawText({
            "text": this.data.yAxisLabel,
            "x": 1, "y": 50,
            "fontSize": 2.2,
            "textAlign": "center",
            "fillStyle": "white",
            "bold": "true",
            "rotate": -90
        });

        this.renderButtons();

        this.renderDisplayingPageInfo();

        this.copyCurrentImageToHiddenCanvas();
        this.renderKeys();

        this.renderCrosshair();


        if(!this.bCreatedMouseMoveEvent){

            this.bCreatedMouseMoveEvent = true;
            
            this.canvas.addEventListener("mousemove", () =>{

                this.renderMouseMove();    
        
            });
        }
    }
}


class LineGraph extends GraphCanvas{

    constructor(parent, graphId, defaultWidth, defaultHeight, data, overrideOptions){

        super(parent, graphId, defaultWidth, defaultHeight, data, overrideOptions);

        this.bDisablePagination = false;


        this.state.bNoCenterXAxisLabels = true;

        this.columns = [];
        
        this.createButtons();    
        this.createKeys();  
        

        this.render();
    }

    createMouseOverData(){

        
        const startY = this.plotArea.y + this.plotArea.height;

        const {bit, dataOffsetX} = this.getDataOffsetXAndBit();

        const startX = this.plotArea.x + dataOffsetX;

        const {dataEntryStart, dataEntryEnd} = this.getDataStartEnd();
        
        this.hoverData = [];

        for(let i = 0; i < this.data.data.length; i++){

            const {data: dataSet, name, fillStyle} = this.data.data[i];

            let currentX = startX;

            for(let x = dataEntryStart; x < dataEntryEnd; x++){

                if(this.hoverData[x - dataEntryStart] === undefined){

                    this.hoverData[x - dataEntryStart] = {
                        "title": x,
                        "entries": [], 
                        "startX": currentX, 
                        "endX": currentX + dataOffsetX 
                    };
                }

                const d = dataSet[x];

                this.hoverData[x - dataEntryStart].entries.push({
                    name, 
                    fillStyle, 
                    "value": d,
                });

                currentX += dataOffsetX;
            }
        }
    }

    getMouseOverData(){

        const {dataEntryStart, dataEntryEnd} = this.getDataStartEnd();

        for(let i = 0; i < this.hoverData.length; i++){

            const h = this.hoverData[i];
  
            const data = this.hoverData[i].entries;

            if(this.mouse.x >= h.startX && this.mouse.x < h.endX){
     
                const mouseOverData = data.map((d) =>{
                    return {"value": d.value, "entry": d}
                });         

                return {
                    "mouseOverTitle": this.getDataEntryTitle(dataEntryStart + i), 
                    "entryData": data, 
                    "mouseOverData": mouseOverData
                };
            }
     
        }


        return {"mouseOverTitle": "Error", "columnData": {}, "mouseOverData": null};
    }

    renderHoverData(){


        if(!this.bRenderHoverData()) return;
        this.renderMouseOverMainBox();

    }


    getDataOffsetXAndBit(){

        const bit = this.plotArea.height / this.data.range;

        let perPage = (!this.state.bDisplayAllData) ? this.maxDataPerPage + 1 : this.data.maxDataPoints + 1;


        const dataOffsetX = this.plotArea.width / (perPage);

        return {dataOffsetX, bit};
    }
    

    renderData(){


        const lineWidth = 0.3;

        const startY = this.plotArea.y + this.plotArea.height;

        const {bit, dataOffsetX} = this.getDataOffsetXAndBit();

        //add dataOffsetX to allow more room for hover data
        const startX = this.plotArea.x + dataOffsetX;

        const {dataEntryStart, dataEntryEnd} = this.getDataStartEnd();


        let bFirstIndex = true;
        
        for(let i = 0; i < this.data.data.length; i++){

            const {name, data, fillStyle} = this.data.data[i];

            const keyInfo = this.getGraphKeyByName(name);

            if(keyInfo === null) throw new Error(`Failed to get keyInfo for ${name}`);

            const linePoints = [];
            
            if(keyInfo.bHidden) continue;
            
            for(let x = dataEntryStart; x < dataEntryEnd; x++){

                const d = data[x];


                if(bFirstIndex){
                    this.renderXAxisLabel(x, startX + (dataOffsetX * linePoints.length), dataOffsetX);
                }

                if(keyInfo.bHidden) continue;
                
                const currentX = startX + dataOffsetX * linePoints.length;


                const zeroed = Math.abs(d - this.data.minValue)

                const currentY = startY - bit * zeroed + lineWidth * 0.5;

                

                linePoints.push([currentX, currentY]);
        
            }

            //prevent keys not being rendered if first data set is hiddem
            bFirstIndex = false;

            this.drawLine({
                "points": linePoints,
                "strokeStyle": fillStyle,
                "lineWidth": lineWidth,
                "bUseHeightLineWidth": true    
            });
        }
    }

    

    render(){

        this.setPlotAreaSize();
        this.createMouseOverData();
     

        this.toDefaultTextBaseLine();

        this.drawRect({
            "x": 0, "y": 0, 
            "width": 100, 
            "height": 100, 
            "fillStyle": "rgb(32,32,32)",
        });

        this.renderTitle();
        
 
        this.renderPlotArea();
        this.renderData();

        this.renderLabels();
        
        this.drawText({
            "text": this.data.yAxisLabel,
            "x": 1, "y": 50,
            "fontSize": 2.2,
            "textAlign": "center",
            "fillStyle": "white",
            "bold": "true",
            "rotate": -90
        });

        this.renderButtons();

        

        this.renderDisplayingPageInfo();

        this.copyCurrentImageToHiddenCanvas();
        this.renderKeys();

        if(!this.bCreatedMouseMoveEvent){

            this.bCreatedMouseMoveEvent = true;
            
            this.canvas.addEventListener("mousemove", () =>{

                this.renderMouseMove();    
        
            });
        }
    }
}