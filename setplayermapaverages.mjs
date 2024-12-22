import { setAllPlayerMapAverages } from "./src/app/lib/players.mjs";

(async () =>{

    await setAllPlayerMapAverages();

    process.exit();
})();