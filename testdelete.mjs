import { deleteMatch } from "./src/app/lib/matches.mjs";

(async () =>{

    await deleteMatch(19);
    process.exit();
})();