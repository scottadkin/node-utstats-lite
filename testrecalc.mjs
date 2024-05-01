import { recalculateAll } from "./src/app/lib/rankings.mjs";

(async () =>{



    await recalculateAll();

    process.exit();
})();