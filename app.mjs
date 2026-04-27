import express from 'express';
import ejs from "ejs";
import mysql from "mysql2/promise";
import { websitePort, SQL_MODE } from './config.mjs';
const app = express();
app.use(express.static('public'));
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

import { renderMatchPage } from './src/pages/match.mjs';
import { renderMatchesPage } from './src/pages/matches.mjs';
import serverMatchScreenshot from "./src/serverMatchScreenshot.mjs";
import { renderHomePage } from './src/pages/home.mjs';
import { renderPlayersPage } from './src/pages/players.mjs';
import { renderPlayerPage } from './src/pages/player.mjs';
import { renderRankingsPage } from './src/pages/rankings.mjs';
import { renderCTFLeaguePage } from './src/pages/ctfLeague.mjs';
import { renderRecordsPage } from './src/pages/records.mjs';
import JSONManager from './src/json/JSONManager.mjs';
import AdminJSONManager from './src/json/AdminJSONManager.mjs';
import session from 'express-session';
import { renderLoginPage } from './src/pages/login.mjs';
import { renderRegisterPage } from './src/pages/register.mjs';
import { getSessionInfo, login, logout, register } from './src/authentication.mjs';
import {SESSION_SECRET} from "./secret.mjs";
import { renderAdminPage } from './src/pages/admin.mjs';
import { renderMapPage } from './src/pages/map.mjs';
import { renderWatchlistPage } from './src/pages/watchlist.mjs';
import Message from './src/message.mjs';

//import helmet from "helmet";
import { renderMapsPage } from './src/pages/maps.mjs';
import { createRandomString } from './src/generic.mjs';

import __MySQLStore from "express-mysql-session";
import cookieParser from 'cookie-parser';

import multer from 'multer';
const upload = multer({ dest: 'uploads/' })

import ApiJSON from './src/json/apiJSON.mjs';
import { renderJSONExamples } from './src/pages/jsonExamples.mjs';

new Message("Attempting To Start Node UTStats Lite Website","progress");

const MySQLStore = __MySQLStore(session);

import { mysqlPool } from './src/database.mjs';

const sessionStore = new MySQLStore({
	"createDatabaseTable": false,
	"schema": {
		"tableName": "nstats_sessions",
		"columnNames": {
			"session_id": "session_id",
			"expires": "expires",
			"data": "data",
		}
	}
}, mysqlPool);

app.use(session({
	"secret": SESSION_SECRET,
	"resave": false,
	"saveUninitialized": false,
	"cookie": {
		"sameSite": true,
		"httpOnly": true
	},
	"genid": function(req){
		return createRandomString(1024);
	}
}))

app.use(cookieParser());


app.engine('.html', ejs.__express);

async function setUserSession(req, res, next){

	const userSession = await getSessionInfo(res, req, sessionStore);
	req.userSession = userSession;
	next();
}

app.use(setUserSession);

app.get('/', async (req, res) => {

	try{

		renderHomePage(req, res, req.userSession);	
		
	}catch(err){
		console.trace(err);
		res.send(err.toString());
	}
});


app.get('/match/:id', async (req, res) => {
	
	renderMatchPage(req, res, req.userSession);
});

app.get("/matches", async (req, res) =>{
	
	renderMatchesPage(req, res, req.userSession);
});

app.get("/players", async (req, res) =>{
	renderPlayersPage(req, res, req.userSession);
});

app.get("/rankings", async (req, res) =>{
	renderRankingsPage(req, res, req.userSession);
});

app.get("/ctfleague", async (req, res) =>{
	renderCTFLeaguePage(req, res, req.userSession);
});

app.get("/records", async (req, res) =>{
	renderRecordsPage(req, res, req.userSession);
});

app.get("/maps", async (req, res) =>{
	renderMapsPage(req, res, req.userSession);
});

app.get("/player/:id", async (req, res) =>{
	renderPlayerPage(req, res, req.userSession);
});

app.get("/map/:id", async (req, res) =>{
	renderMapPage(req, res, req.userSession);
});


app.get("/watchlist", async (req, res) =>{
	renderWatchlistPage(req, res, req.userSession);
});

app.get("/jsonexamples", async (req, res) =>{

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
	//res.send("<b>test</b>");
});


app.get("/login", async (req, res) =>{

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


app.get("/register", async (req, res) =>{
	renderRegisterPage(req, res, req.userSession);
});

app.post("/register", async (req, res) =>{

	try{
		
		await register(req, res, sessionStore);

	}catch(err){
		console.trace(err);
		res.status(500).send(err.toString());
	}	
});


app.get("/admin", async (req, res) =>{

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
	new Message(`Node UTStats Lite is using ${(SQL_MODE === "sqlite") ? "SQLite" : "MYSQL"} database.`,"note");
})