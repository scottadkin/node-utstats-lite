import { deleteMatch } from "./src/app/lib/matches.mjs";

(async () =>{

    await deleteMatch(3);
    process.exit();
})();