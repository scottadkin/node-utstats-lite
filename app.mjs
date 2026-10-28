import express from 'express';
import ejs from "ejs";
import { websitePort } from './config.mjs';
const app = express();
app.use(express.static('public'));
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

import serverMatchScreenshot from "./src/serverMatchScreenshot.mjs";
import JSONManager from './src/json/JSONManager.mjs';
import AdminJSONManager from './src/json/AdminJSONManager.mjs';
import { renderLoginPage } from './src/pages/login.mjs';
import { renderRegisterPage } from './src/pages/register.mjs';
import { getSessionInfo, login, logout, register } from './src/authentication.mjs';
import { renderAdminPage } from './src/pages/admin.mjs';
import { renderWatchlistPage } from './src/pages/watchlist.mjs';
import Message from './src/message.mjs';
import {renderSeasonsPage} from "./src/pages/seasons.mjs";
import cookieParser from 'cookie-parser';

import multer from 'multer';
const upload = multer({ dest: 'uploads/' })

import ApiJSON from './src/json/apiJSON.mjs';
import { renderJSONExamples } from './src/pages/jsonExamples.mjs';
import { renderSeasonPage } from './src/pages/season.mjs';
import { renderSeasonMatchesPage } from './src/pages/seasons/matches.mjs';
import { renderSeasonPlayersPage } from './src/pages/seasons/players.mjs';
import { renderSeasonMapsPage } from './src/pages/seasons/maps.mjs';
import { renderSeasonMatchPage } from './src/pages/seasons/match.mjs';
import { renderSeasonMapPage } from './src/pages/seasons/map.mjs';
import { renderSeasonRankingsPage } from './src/pages/seasons/rankings.mjs';
import { renderSeasonRecordsPage } from './src/pages/seasons/records.mjs';
import { renderSeasonCTFLeaguePage } from './src/pages/seasons/ctfLeague.mjs';
import { renderSeasonPlayerPage } from './src/pages/seasons/player.mjs';
import { getAllSeasons, getSeasonById } from './src/seasons.mjs';


new Message("Attempting To Start Node UTStats Lite Website","progress");

/**
 * If seasons are enabled get the current active one
 */
function getMostRelevantSeasonId(seasonList){

    const now = new Date();

    for(let i = 0; i < seasonList.length; i++){

        const s = seasonList[i];
        const startDate = new Date(s.start_date);
        const endDate = new Date(s.end_date);

        if(now >= startDate && now <= endDate){
            return s.id;
        }
    }

    return 0;

}

async function setSeasonsData(req, res, next){

    const initialSeasonId = (req.params.season !== undefined) ? parseInt(req.params.season) : -1;

    if(initialSeasonId !== initialSeasonId){
        return res.send("not a valid season");
    }

    const data = await getAllSeasons();

    data.sort((a, b) =>{
        a = a.end_date;
        b = b.end_date;
        if(a < b){
            return 1;
        }else if(a > b){
            return -1;
        }
        return 0;
    });

    res.locals.seasonList = data;

    if(data.length > 0 && initialSeasonId === -1){

        res.locals.season = getMostRelevantSeasonId(data);
    }else{
        res.locals.season = initialSeasonId;
    }

    let info = null;

    if(res.locals.season !== -1 && res.locals.season !== 0){
        info = await getSeasonById(res.locals.season);
        if(info === null) return res.send(`Season Doesn't exist`);
    }else{

        res.locals.season = 0;
        info = {"name": "All Time Totals", "start_date": null, "end_date": null, "id": 0}
    }


    res.locals.seasonInfo = info;

    

    next();
}


const sessionStore = null;

app.use(cookieParser());


app.engine('.html', ejs.__express);

async function setUserSession(req, res, next){

	const userSession = await getSessionInfo(res, req, sessionStore);
	req.userSession = userSession;
	next();
}

app.use(setUserSession);

app.get('/', async (req, res, next) => { await setSeasonsData(req, res, next)}, async (req, res) => {

	try{

        res.locals.bSkipSeasonLinks = true;
        renderSeasonPage(req, res);
       
		
	}catch(err){
		console.trace(err);
		res.send(err.toString());
	}
});


app.get('/match/:id',async (req, res, next) => { await setSeasonsData(req, res, next)},  async (req, res) => {


    res.locals.bSkipSeasonLinks = true;
    renderSeasonMatchPage(req, res);
 
});

app.get("/matches", async (req, res, next) => { await setSeasonsData(req, res, next)}, async (req, res) =>{
	
    res.locals.bSkipSeasonLinks = true;
    renderSeasonMatchesPage(req, res);

    
});

app.get("/players",async (req, res, next) => { await setSeasonsData(req, res, next)},  async (req, res) =>{
  
    
    res.locals.bSkipSeasonLinks = true;
    renderSeasonPlayersPage(req, res);
   
});

app.get("/rankings", async (req, res, next) => { await setSeasonsData(req, res, next)}, async (req, res) =>{


    res.locals.bSkipSeasonLinks = true;
    renderSeasonRankingsPage(req, res);

});

app.get("/ctfleague", async (req, res, next) => { await setSeasonsData(req, res, next)}, async (req, res) =>{
    
    res.locals.bSkipSeasonLinks = true;
    renderSeasonCTFLeaguePage(req, res)
  
});

app.get("/records",async (req, res, next) => { await setSeasonsData(req, res, next)},  async (req, res) =>{

    
    res.locals.bSkipSeasonLinks = true;
    renderSeasonRecordsPage(req, res);
    
});

app.get("/maps", async (req, res, next) => { await setSeasonsData(req, res, next)}, async (req, res) =>{

    
    res.locals.bSkipSeasonLinks = true;
    renderSeasonMapsPage(req, res);
    
});

app.get("/player/:id",async (req, res, next) => { await setSeasonsData(req, res, next)},  async (req, res) =>{
 

    res.locals.bSkipSeasonLinks = true;
    renderSeasonPlayerPage(req, res);
 
});

app.get("/map/:id",async (req, res, next) => { await setSeasonsData(req, res, next)},  async (req, res) =>{

    res.locals.bSkipSeasonLinks = true;
    renderSeasonMapPage(req, res);

});


app.get("/watchlist",async (req, res, next) => { await setSeasonsData(req, res, next)},  async (req, res) =>{

	renderWatchlistPage(req, res, req.userSession);
});

app.get("/jsonexamples",async (req, res, next) => { await setSeasonsData(req, res, next)},  async (req, res) =>{
  
	renderJSONExamples(req, res, req.userSession);
});

app.get("/matchshot/:id", async (req, res) =>{

	try{

		let id = req?.params?.id ?? 0;
		id = parseInt(id);
		if(id !== id || id === 0) throw new Error(`Not a valid match id.`);

		const s = new serverMatchScreenshot(id, 1200, 630);
		const image = await s.create();

		res.set("Content-type", "image/jpeg");
		res.send(Buffer.from(image));

	}catch(err){
		console.trace(err);
		res.status(500).send("Failed To Create Screenshot");
	}

});


app.get("/login", async (req, res, next) => { await setSeasonsData(req, res, next)}, async (req, res) =>{

	renderLoginPage(req, res, sessionStore, req.userSession);
});

app.post("/login", async (req, res) =>{

	try{

		await login(req, res, sessionStore);

	}catch(err){
		res.status(500).send(err.toString());
	}	
});

app.get("/logout", async (req, res) =>{

	try{

		await logout(req, res, sessionStore);
		res.redirect("/?message=logout");

	}catch(err){
		console.trace(err);
		res.status(500).send(err.toString());
	}
});


app.get("/register",async (req, res, next) => { await setSeasonsData(req, res, next)},  async (req, res) =>{
	renderRegisterPage(req, res, req.userSession);
});

app.post("/register",async (req, res, next) => { await setSeasonsData(req, res, next)},  async (req, res) =>{

	try{
		
		await register(req, res, sessionStore);

	}catch(err){
		console.trace(err);
		res.status(500).send(err.toString());
	}	
});


app.get("/admin", async (req, res, next) => { await setSeasonsData(req, res, next)}, async (req, res) =>{

	if(req.userSession === null){
		res.status(401).send("Access Denied");
	}else{

		renderAdminPage(req, res, req.userSession);
	}
});


/**
 * Use before using multer to prevent files being uploaded before auth check
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
async function checkUserIsAdmin(req, res, next){

	try{

		const m = new AdminJSONManager(req, res, sessionStore);
		await m.checkSession();
		next();

	}catch(err){
		console.trace(err);
		res.status(401).json({"error": err.message});
	}
}

app.post("/admin", checkUserIsAdmin, upload.any(), async (req, res, next) =>{

	try{

		const m = new AdminJSONManager(req, res, sessionStore);
		await m.init();

	}catch(err){
		res.json({"error": err.toString()});
	}
});


app.get("/json/:mode", async (req, res) =>{

	try{
		const j = new JSONManager(req, res, false);

		await j.init();
	}catch(err){
		res.send(err.toString());
	}
});

app.post("/json/:mode", async (req, res) =>{

	try{
		const j = new JSONManager(req, res, true);

		await j.init();
	}catch(err){
		res.send(err.toString());
	}
});

app.get("/api/json/:mode/:cat", async (req, res) =>{

	try{

		const j = new ApiJSON(req, res);

		await j.init();

	}catch(err){
		res.send({"error": err.toString()});
	}

});

app.listen(websitePort, () => {
	new Message(`Node UTStats Lite running on port ${websitePort}`,"pass");
	new Message(`Edit websitePort in config.mjs if you wish to change ports`,"note");
})


app.get("/seasons", 
    async (req, res, next) => { await setSeasonsData(req, res, next)}, 
    async (req, res) =>{

    try{

        renderSeasonsPage(req, res);

    }catch(err){
        res.json({"error": err.toString()});
    }
});



app.get("/season/:season", 
    async (req, res, next) => { await setSeasonsData(req, res, next)}, 
    async (req, res) =>{

    try{
        res.locals.bSkipSeasonLinks = false;
        await renderSeasonPage(req, res);

    }catch(err){
        res.json({"error": err.toString()});
    }
    
});

app.get("/season/:season/matches",
    async (req, res, next) => { await setSeasonsData(req, res, next)}, 
    async (req, res) =>{

    try{

        res.locals.bSkipSeasonLinks = false;
        await renderSeasonMatchesPage(req, res);

    
    }catch(err){
        res.json({"error": err.toString()});
    }
});


app.get("/season/:season/players", 
    async (req, res, next) => { await setSeasonsData(req, res, next)}, 
    async (req, res) =>{

    try{
        res.locals.bSkipSeasonLinks = false;
        await renderSeasonPlayersPage(req, res);
    
    }catch(err){
        res.json({"error": err.toString()});
    }
});

app.get("/season/:season/maps", 
    async (req, res, next) => { await setSeasonsData(req, res, next)}, 
    async (req, res) =>{

    try{
        res.locals.bSkipSeasonLinks = false;
        await renderSeasonMapsPage(req, res);
    
    }catch(err){
        res.json({"error": err.toString()});
    }
});

app.get('/season/:season/match/:id', 
    async (req, res, next) => { await setSeasonsData(req, res, next)}, 
    async (req, res) => {
	
    try{
        res.locals.bSkipSeasonLinks = false;
	    await renderSeasonMatchPage(req, res, req.userSession);
        
    }catch(err){

        res.json({"error": err.toString()});
    }
});

app.get("/season/:season/map/:id", 
    async (req, res, next) => { await setSeasonsData(req, res, next)}, 
    async (req, res) =>{

    try{
        res.locals.bSkipSeasonLinks = false;
        await renderSeasonMapPage(req, res);
    }catch(err){
        res.json({"error": err.toString()});
    }
});

app.get("/season/:season/rankings/", 
    async (req, res, next) => { await setSeasonsData(req, res, next)}, 
    async (req, res) =>{

    try{
        res.locals.bSkipSeasonLinks = false;
        await renderSeasonRankingsPage(req, res);
    }catch(err){
        res.json({"error": err.toString()});
    }
});

app.get("/season/:season/records/", 
    async (req, res, next) => { await setSeasonsData(req, res, next)}, 
    async (req, res) =>{

    try{
        res.locals.bSkipSeasonLinks = false;
        await renderSeasonRecordsPage(req, res);
    }catch(err){
        res.json({"error": err.toString()});
    }
});


app.get("/season/:season/ctfleague/",
    async (req, res, next) => { await setSeasonsData(req, res, next)}, 
    async (req, res) =>{

    try{
        res.locals.bSkipSeasonLinks = false;
        await renderSeasonCTFLeaguePage(req, res);
    }catch(err){
        res.json({"error": err.toString()});
    }
});

app.get("/season/:season/player/:id",
    async (req, res, next) => { await setSeasonsData(req, res, next)}, 
    async (req, res) =>{

    try{
        res.locals.bSkipSeasonLinks = false;
        await renderSeasonPlayerPage(req, res);
    }catch(err){
        res.json({"error": err.toString()});
    }
});