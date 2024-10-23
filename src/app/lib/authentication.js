"use server"
import { sha256 } from 'js-sha256';
import {salt} from "../../../salt.mjs";
import {simpleQuery} from "./database.mjs";
import { cookies } from 'next/headers';
import { createRandomString } from "./generic.mjs";

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



async function createSession(userId, hash, expires){

    const query = `INSERT INTO nstats_sessions VALUES(NULL,?,?,?)`;

    expires = Math.floor(expires * 0.001);
    await simpleQuery(query, [ userId, hash, "0.0.0.0"]);
}

async function deleteSession(userId, sId){

    const query = `DELETE FROM nstats_sessions WHERE user=? AND hash=?`;

    return await simpleQuery(query, [userId, sId]);
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

export async function register(currentState, formData){

    try{

        const minNameLength = 1;
        const minPassLength = 6;

        const username = formData.get("username");
        const pass1 = formData.get("password");
        const pass2 = formData.get("password2");

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

        return {"message": "Account created, you may have to wait for an admin to activate your account before you can login.", "error": null};

    }catch(err){
        console.trace(err);

        return {"message": null, "error": err.toString()};
    }
}


export async function login(currentState, formData){

    try{

        const username = formData.get("username");
        let password = formData.get("password");

        if(username === null || username === "") throw new Error("No username entered");
        if(password === null || password === "") throw new Error("No password entered");

        password = sha256(`${salt}${password}`);
        const query = `SELECT id FROM nstats_users WHERE name=? AND password=?`;

        const result = await simpleQuery(query, [username, password]);
    
        if(result.length === 0) throw new Error("Incorrect username or password");

        const userId = result[0].id;

        //if(permissions.banned === 1) throw new Error("User account has been banned.");
        if(!await bAccountActive(userId)) throw new Error("User account has not been activated.");

        const expires = new Date(Date.now() + 60 * 60 * 1000);

        const part1 = createRandomString(100);
        const part2 = createRandomString(100);
        const sid = sha256(`${part1}${part2}`);

        await createSession(userId, sid, expires);

        cookies().set("nstats_name", username,{expires, "httpOnly": true, "path": "/"});
        cookies().set("nstats_userid", userId,{expires, "httpOnly": true, "path": "/"});
        cookies().set("nstats_sid", sid,{expires, "httpOnly": true, "path": "/"});
        return {"message": "ok", "error": null};
    }catch(err){
        //console.trace(err);
        return {"error": err.toString(), "message": null};
    }
}

export async function logout(){

    try{

        
        const cookieStore = await cookies();

        cookieStore.delete("nstats_name");
        cookieStore.delete("nstats_sid");
        cookieStore.delete("nstats_userid");

        return {"message": "done"};
    }catch(err){
        console.trace(err);
    }
}

export async function bSessionValid(userId, sessionId){

    const query = `SELECT COUNT(*) as total_sessions FROM nstats_sessions WHERE user=? AND hash=?`;

    const result = await simpleQuery(query, [userId, sessionId]);

    if(result.length > 0){

        const r = result[0].total_sessions;
        return r > 0;
    }

    return false;
}


export async function updateSession(){

    try{

        const cookieStore = await cookies();

        const sId = cookieStore.get("nstats_sid");

        if(sId === undefined) return null;

        const userId = cookieStore.get("nstats_userid");
        //const userName = cookieStore.get("nstats_name");

        if(!await bSessionValid(userId.value, sId.value)){

            await deleteSession(userId.value, sId.value);
            cookieStore.delete("nstats_name");
            cookieStore.delete("nstats_userid");
            cookieStore.delete("nstats_sid");
            
            
            return;
            //throw new Error("Not a valid session");   
        }

        const expires = new Date(Date.now() + 60 * 60 * 24 * 1000);

        const userName = await getUserName(userId.value);

        if(userName === null){
            throw new Error("There is no user account with that id");
        }


       cookieStore.set("nstats_name", userName, {expires, "httpOnly": true, "path": "/"});
       cookieStore.set("nstats_userid", userId.value, {expires, "httpOnly": true, "path": "/"});
       cookieStore.set("nstats_sid", sId.value, {expires, "httpOnly": true, "path": "/"});

       return userName;

    }catch(err){
        console.trace(err);
        return null;
    }
}


export async function getSessionInfo(){

    const cookieStore = await cookies();

    const userId = cookieStore.get("nstats_userid")?.value;
    const sessionId = cookieStore.get("nstats_sid")?.value;

    if(userId === undefined || sessionId === undefined) return null; 

    if(!await bSessionValid(userId, sessionId)){
        return null;
    }

    const bActive = await bAccountActive(userId);
    const username = await getUserName(userId);

    if(!bActive) return null; 


    return {username}
}