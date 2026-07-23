import { restoreDefaultSettings } from "./src/siteSettings.mjs";
import { installPlayerSettings } from "./src/players.mjs";

await restoreDefaultSettings();

await installPlayerSettings();

process.exit();