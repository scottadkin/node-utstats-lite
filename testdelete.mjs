import { deleteMatch } from "./src/app/lib/matches.mjs";

(async () =>{

    await deleteMatch(2);
    process.exit();
})();