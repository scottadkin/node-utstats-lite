## Node UTStats Lite
Unreal Tournament stats website for the https://github.com/rxut/UTStatsLite mutator

## Main Features
### Match Reports 
Covering various events like CTF summary, Domiation summary, Frags summary, Special events, Weapon events, Damage summary(requires optional mutator), Kills match up, and many more. 
### Match Screenshots System 
Website pages can display screenshots based on match data to recreate the scoreboards in Unreal Tournament.
### Player Profiles 
Displaying various detailed stats, from gametype totals, winrates, match records, ctf stats with various filtering options, ctf league, rankings, recent matches, item & weapon summaries.
### Players Page
Search for players and order results by various options.
### Records Page
There are numerous different record types for both lifetime totals and single match records, such as most kills, deaths, longest spree, best multi kill, headshots and more. Records are also split by gametype and lifetime for more useful data.
### Maps Page
Search for a map by name.
### Map Page
Each map has it's own page displaying items such as basic summary, weapons summary, player rankings, player ctf league, recent matches, top player averages based on events per minute.
### Home Page 
Displays recent matches, servers, maps, players, social media links, and a customizable welcome message.
### Watchlist Page
Displays your saved matches and players, you can add matches or players by clicking add to my watchlist buttons on match reports or player profiles. Data is saved to your browsers localstorage.
### Player Rankings System 
Players are rewarded points for certain events in matches and then divided by playtime, you can be compared with other players for unique gametypes, and maps. 
The values for these events are customizable in the admin area, you can also set time penalities to reduce player scores if they are under different playtimes, add minimum matches played before players are visible in a table, gametypes and maps have separate minimum matches played settings. 
### CTF League System 
Players can compete with each other to try and top a football inspired league table system awarding 3 points for a win, 1 point for a draw, and 0 points for a loss. There are multiple customizable settings like last active, max matches(only the most recent games in the range are counted) to prevent players who have just played the most matches from being on top of the table. There are tables for gametypes, maps, and lifetime(any ctf gametype and any map). This works best in a pug environment.
### Admin Control Panel
Admins can add ftp/sftp servers, adjust page settings, upload map screenshots, adjust ranking settings.
### SFTP & FTP Support
You can use both FTP and SFTP to download utstats logs in regular intervals, there is no limit to how many servers you can add. Each server also has customizable settings like: ignore duplicate logs, ignore bots, append team sizes to gametype names, minimum players, and minimum playtime.
### Customizable Pages 
Admins can decide what is displayed, how many of said item displays, and what display method such as table view or rich view.
### Basic Metadata
Each page, match report, player profile, map page, have unique info about them for better link sharing, matches is also display a simplified map screenshot of the match result in apps such as discord.

## Critical Vulnerability v1.2.0-v1.8.0(Next.js Website) React2Shell
Multiple version of node-ustats-lite were affected by React and Next.js vulnerability https://github.com/advisories/GHSA-9qr9-h5gf-34mp
**It's critical that you upgrade to prevent hijacks/attacks on your server.**
Affected node-utstats-lite Versions:
v1.8.0, v1.7.0_fix, v1.7.0, v1.6.0, v1.5.1, v1.5.0, v1.4.0, v1.3.0, v1.2.0

## Requirements 
- MYSQL Server
- Node.js 18.X or later

**Note:** If you are upgrading from a version prior to v1.5.1 you also need to update the utstats-lite-mutator

## Upgrade Restrictions
- Versions 1.0.0 -> 1.8.x are compatible with each other(Next.js Website).
- Versions 2.0.0 and greater are compatible with each other.(Express.js Website)


## Installing
- Extract the contents of the archive into a folder.
- Open a terminal in the folder you extracted to.
- Run the command **npm install** to install all dependencies.
- Open **config.mjs** and change the settings to connect to your mysql server.
- If you are using an **ARM OS** you will have to follow this(https://github.com/Automattic/node-canvas?tab=readme-ov-file#compiling) additional step to get the canvas package to install otherwise you will get an error message
- Run the command **node install.mjs** to create the database and other settings.


## How to change website port
- Open confi.mjs and edit **websitePort** accordingly, you have to restart the website for the changes to take effect.

## Starting The Website
- Open a terminal in the folder you installed to.
- Run the command **node app.mjs** to start the website.
- Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
- To Create an admin account go to [http://localhost:3000/register](http://localhost:3000/register), the first account is auto activated, every following account needs to be activated.
- To Login go to [http://localhost:3000/login](http://localhost:3000/login)
- To go to the admin area go to [http://localhost:3000/admin](http://localhost:3000/admin)
- In the admin you can then add S/FTP servers to the importer list. ![ftp admin image](https://i.imgur.com/gA2WpT4.png "FTP Admin Image")
- If you want to separate gametypes by team sizes, for example CTF 1v1, CTF 2v2 there is now a setting for each ftp server and logs folder called **append team sizes**, if the all teams have the same amount of players the importer will now append the team sizes to the end of the gametype to keep rankings/records separate. 

## Running The Log Importer
- Open a terminal in the folder you installed to.
- Run the command **node importer.mjs**.

## Optional Damage Mutator
You can enable basic damage tracking for players by adding [this mutator](https://github.com/scottadkin/UTStats-Lite-Damage)
So far there is only match player data displayed for damage.

## Classic UTStats Damage Support
- There is also basic support for classic UTStats logs damage mutator that is displayed on match reports only.