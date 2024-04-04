import {simpleQuery} from "./database.mjs";

export async function getPlayerMasterId(playerName){

    const query = `SELECT id FROM nstats_players WHERE name=?`;

    const result = await simpleQuery(query, [playerName]);
    console.log(result);

    if(result.length === 0) return null;

    return result[0].id;
}

export async function getNamesByIds(targetIds){

    if(targetIds === undefined) return {};

    const query = `SELECT id,name FROM nstats_player_totals WHERE id IN (?)`;
    const result = await simpleQuery(query, [targetIds]);

    const idsToNames = {};

    for(let i = 0; i < result.length; i++){

        const {id, name} = result[i];

        idsToNames[id] = name;
    }

    return idsToNames;
}