import { deleteMatch } from "./src/app/lib/matches.mjs";

(async () =>{

    await deleteMatch(4);
    process.exit();
})();