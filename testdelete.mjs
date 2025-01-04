import { deleteMatch } from "./src/app/lib/matches.mjs";

(async () =>{

    await deleteMatch(1);
    process.exit();
})();