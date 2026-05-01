"use server"
import { sha256 } from 'js-sha256';
import {salt} from "../salt.mjs";
import {simpleQuery, sqlInsertOnDuplicateUpdate, sqlSingleUpdateReturnChanged} from "./database.mjs";
import { createRandomString } from "./generic.mjs";
import { maxLoginAttempts, maxLoginBanPeriod, loginExpireTime } from '../config.mjs';

async function getUserName(id){

    const query = `SELECT name FROM nstats_users WHERE id=?`;

    const result = await simpleQuery(query, [id])

    if(result.length > 0){
        return result[0].name;
    }

    return null;
}

async function bAccountActive(id){

    const query = `SELECT activated FROM nstats_users WHERE id=?`;

    const result = await simpleQuery(query, [id]);

    if(result.length === 0) throw new Error(`There is no user with the account id of ${id}`);

    if(result[0].activated === 1) return true;

    return false;
}

async function bNameTaken(username){

    const query = `SELECT COUNT(*) as total_users FROM nstats_users WHERE name=?`;

    const result = await simpleQuery(query, [username]);

    if(result[0].total_users > 0) return true;

    return false;
}

async function createAccount(username, password){

    let bActive = 0;

    const bAnyUsers = await bAnyAccounts();

    if(!bAnyUsers){
        bActive = 1;
    }

    const query = `INSERT INTO nstats_users VALUES(NULL, ?,?,?)`;

    await simpleQuery(query, [username, password, bActive]);

}

async function bAnyAccounts(){

    const query = `SELECT COUNT(*) as total_users FROM nstats_users`;

    const result = await simpleQuery(query);

    return result[0].total_users >= 1;

}


export function clearUserCookies(res){

    res.clearCookie("nstats_name",  {"httpOnly": true, "path": "/"});
    res.clearCookie("nstats_userid", {"httpOnly": true, "path": "/"});
    res.clearCookie("nstats_sid",  {"httpOnly": true, "path": "/"});
}

export async function register(req, res, sessionStore){

    
    if(req.cookies.nstats_sid !== undefined){

        if(await bSessionExist(sessionStore, req.cookies.nstats_sid)){
            throw new Error(`LOGGED IN ALREADY`);
        }else{
            //delete current sessionId cookie as its no longer valid
            clearUserCookies(res);    
        }
    }

    const minNameLength = 1;
    const minPassLength = 6;

    const username = req.body?.username ?? null;
    const pass1 = req.body?.password ?? null;
    const pass2 = req.body?.password2 ?? null;

    if(username === null) throw new Error(`Username was not set`);
    if(pass1 === null) throw new Error(`Password was not set`);
    if(pass2 === null) throw new Error(`Password(Again) was not set`);

    if(username.length < minNameLength){
        throw new Error(`Username must be at least ${minNameLength} characters long.`);
    }

    if(await bNameTaken(username)){
        throw new Error(`Username has already been taken, please choose another one.`);
    }

    if(pass1 !== pass2){
        throw new Error("The passwords you have entered do not match.");
    }

    if(pass1.length < minPassLength){
        throw new Error(`Your password must be at least ${minPassLength} characters long.`);
    }

    const passHash = sha256(`${salt}${pass1}`);

    await createAccount(username, passHash);

    return res.redirect("/?message=account-created");
    //return {"message": "Account created, you may have to wait for an admin to activate your account before you can login.", "error": null};

}


async function setSessionUserId(sId, userId){

    const query = `UPDATE nstats_sessions SET user_id=? WHERE session_id=?`;

    return await simpleQuery(query, [userId, sId]);
}


function updateExpireDates(res, sId, userId, userName, expires){

    res.cookie("nstats_name", userName, {expires, "httpOnly": true, "path": "/", "sameSite": true});
    res.cookie("nstats_userid", userId, {expires, "httpOnly": true, "path": "/", "sameSite": true});
    res.cookie("nstats_sid", sId, {expires, "httpOnly": true, "path": "/", "sameSite": true});
}

async function updateUserSession(res, sessionStore, sId, userId, userIp, userName, expires){

    const columns = ["session_id", "created", "expires", "user_id", "user_ip", "session_data"];

    const updateTest = await sqlSingleUpdateReturnChanged("UPDATE nstats_sessions SET expires=? WHERE session_id=? AND user_id=?", [expires, sId, userId]);

    let rowsChanged = 0;

    if(updateTest === "sqlite"){

        const a = `SELECT id FROM nstats_sessions WHERE session_id=? AND user_id=? AND expires=? LIMIT 1`;
        const b = await simpleQuery(a, [sId, userId, expires]);

        rowsChanged = b.length;
    }else{
        rowsChanged = updateTest;
    }

    if(rowsChanged === 0){

        await simpleQuery("INSERT INTO nstats_sessions VALUES(NULL,?,?,?,?,?,?)", [sId, expires, expires, userId, userIp, "{}"]);

    }

    updateExpireDates(res, sId, userId, userName, expires);

    //const update = await simpleQuery("UPDATE nstats_sessions SET expires=? WHERE session_id=?", [expires, sId]);
    //console.log(update);

    /*return await sessionStore.set(sId, {"name": userName, "user_id": userId, "session_id": sId}, async (err) =>{

        if(err) throw new Error(err.message);

        await setSessionUserId(sId, userId);

        updateExpireDates(res, sId, userId, userName, expires); 
    });*/
}

export async function bSessionExist(sessionStore, sId){


    return await testBSessionExists(sId);

    /*const result = await sessionStore.get(sId);

    if(result === null) return false;

    return true;*/
    
}


async function addFailedLoginAttempt(name, ip){

    const query = `INSERT INTO nstats_user_login_attempts VALUES(NULL,?,?,?)`;
    const now = new Date(Date.now());

    await simpleQuery(query, [now, name, ip]);
}

async function getFailedLoginAttempts(ip){

    const query = `SELECT COUNT(*) as total_rows FROM nstats_user_login_attempts WHERE ip=? AND date>=?`;

    const timestamp = Math.floor(Date.now() * 0.001);
    const cutoff = new Date((timestamp - maxLoginBanPeriod) * 1000);
    
    const result = await simpleQuery(query, [ip, cutoff]);

    return result[0].total_rows;

}

function getExpireDate(){

    const hour = 60 * 60 * 1000;

    return new Date(Date.now() + hour * loginExpireTime);
}

export async function login(req, res, sessionStore){

    const failedLogins = await getFailedLoginAttempts(req.ip);

    if(maxLoginAttempts < failedLogins){
        //throw new Error(`You have exceeded the maximum amount of failed login attempts in a timeframe, please try again later.`);
        return res.redirect("/?message=banned");
    }

    if(req.cookies.nstats_sid !== undefined){

        if(await bSessionExist(sessionStore, req.cookies.nstats_sid)){
            //throw new Error(`You are already logged in`);
            return res.redirect("/?message=already");
        }
    }

    if(req.body.username === undefined) throw new Error("No username entered");
    if(req.body.password === undefined) throw new Error("No password entered");

    const username = req.body.username; //formData.get("username");
    let password = req.body.password;//formData.get("password");

    password = sha256(`${salt}${password}`);
    const query = `SELECT id FROM nstats_users WHERE name=? AND password=?`;

    const result = await simpleQuery(query, [username, password]);

    if(result.length === 0){
        await addFailedLoginAttempt(username, req.ip);
        return res.redirect("/login/?error=incorrect");
        //throw new Error("Incorrect username or password");
    }

    const userId = result[0].id;

    //if(permissions.banned === 1) throw new Error("User account has been banned.");
    if(!await bAccountActive(userId)){
        return res.redirect("/login/?error=not-active");
       // throw new Error("User account has not been activated.");
    }

    const expires = getExpireDate();

    const part1 = createRandomString(200);
    const sid = sha256(`${part1}`);

    await updateUserSession(res, sessionStore, sid, userId, req.ip, username, expires);

    res.redirect("/?message=login");
    
    //return true;

}


async function destroySession(id){

    const query = `DELETE FROM nstats_sessions WHERE session_id=?`;

    return await simpleQuery(query, [id]);
}

export async function logout(req, res, sessionStore){

    const id = req.cookies?.nstats_sid ?? null;

    if(id === null) throw new Error(`You are not logged in`);


    await destroySession(id);

    /*await sessionStore.destroy(id, (err) =>{

        if(err) throw new Error(err.message);

        clearUserCookies(res);
    } );*/

    clearUserCookies(res);
    
    
    return true;

}


async function testBSessionExists(sessionId){

    const result = await simpleQuery(`SELECT session_id FROM nstats_sessions WHERE session_id=? LIMIT 1`, [sessionId]);

    return result.length > 0;
}

export async function getSessionInfo(res, req, sessionStore){


    const userId = req.cookies?.nstats_userid ?? null;
    const sessionId = req.cookies?.nstats_sid ?? null;


    if(userId === null || sessionId === null) return null; 

    if(!await bSessionExist(sessionStore, sessionId)) return null;


   // if(!await bSessionExist(sessionStore, sessionId)){
    //    return null;
    //}

    const bActive = await bAccountActive(userId);
    const username = await getUserName(userId);

    if(!bActive) return null; 

    const expires = getExpireDate();
    await updateUserSession(res, sessionStore, sessionId, userId, req.ip, username, expires);
    updateExpireDates(res, sessionId, userId, username, expires);

    return {username}
}