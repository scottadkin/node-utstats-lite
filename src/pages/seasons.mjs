import { getAllSeasons } from "../seasons.mjs";

export async function renderSeasonsPage(req, res){

    const seasons = await getAllSeasons();



    return res.json(seasons);
}