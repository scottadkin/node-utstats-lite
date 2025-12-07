## Node UTStats Lite
Unreal Tournament stats website for the https://github.com/rxut/UTStatsLite

**Note:** If you are upgrading from a version prior to v1.5.1 you also need to update the utstats-lite-mutator

### Security Issue v1.2.0-v1.8.0
Multiple version of node-ustats-lite were affected by Next.js vulnerability https://github.com/advisories/GHSA-9qr9-h5gf-34mp

Affected node-utstats-lite Versions:
- https://github.com/scottadkin/node-utstats-lite/tree/v1.8.0
- https://github.com/scottadkin/node-utstats-lite/releases/tag/v1.7.0_fix
- https://github.com/scottadkin/node-utstats-lite/releases/tag/v1.6.0
- https://github.com/scottadkin/node-utstats-lite/releases/tag/v1.5.1
- https://github.com/scottadkin/node-utstats-lite/releases/tag/v1.5.0
- https://github.com/scottadkin/node-utstats-lite/releases/tag/v1.4.0
- https://github.com/scottadkin/node-utstats-lite/releases/tag/v1.3.0
- https://github.com/scottadkin/node-utstats-lite/releases/tag/v1.2.0

## Requirements 
- MYSQL Server
- Node.js 18.17 or later.

## Installing
- Extract the contents of the archive into a folder.
- Open a terminal in the folder you extracted to.
- Run the command **npm install** to install all dependencies.
- Open **config.mjs** and change the settings to connect to your mysql server.
- If you are using an **ARM OS** you will have to follow this(https://github.com/Automattic/node-canvas?tab=readme-ov-file#compiling) additional step to get the canvas package to install otherwise you will get an error message
- Run the command **node install.mjs** to create the database and other settings.


## How to change website port
- Open package.json in the main directory.
- Find the "scripts" block.
- Find the line ```"start": "next start",```.
- To change the port simply add **-p portnumber** after next start, for example ```"start": "next start -p 8080",``` will run the website on port 8080.
- You can also do the same with the dev mode ```"dev": "next dev",``` -> "dev": "next dev -p 8080",

## Starting The Website
- Open a terminal in the folder you installed to.
- Run the command **npm run build** to build the website.
- Once the website has been built, run the command **npm run start**
- Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
- To Create an admin account go to [http://localhost:3000/register](http://localhost:3000/register), the first account is auto activated, every following account needs to be activated.
- To Login go to [http://localhost:3000/login](http://localhost:3000/login)
- To go to the admin area go to [http://localhost:3000/admin](http://localhost:3000/admin)
- In the admin you can then add S/FTP servers to the importer list. ![ftp admin image](https://i.imgur.com/gA2WpT4.png "FTP Admin Image")
- If you want to separate gametypes by team sizes, for example CTF 1v1, CTF 2v2 there is now a setting for each ftp server and logs folder called **append team sizes**, if the all teams have the same amount of players the importer will now append the team sizes to the end of the gametype to keep rankings/records separate. 

## Running The Log Importer
- Open a terminal in the folder you installed to.
- Run the command **node importer.mjs**.

## Converting Node UTStats 2 FTP Settings To Lite
- If you want to insert all your ftp settings from node utstats-2 you need to create a backup with the node utstats 2 admin tool.
- Open the archive.
- Place **nstats_ftp.json** in the main directory of your node utstats lite folder.
- Run the command **node nutsftptolite.mjs**
- You should now see the settings added in the admin area.


## Match JSON API
You can fetch json data of matches via match ids or **permahashes(recommended)** by using the following path **/api/json/match/?id=matchid**.
You have options to ignore certain data by appending a comma separated list **&ignore=type1,type2**
An example for ignoring player weapon stats and multikills,sprees would be https://example.com/api/json/match/?id=1337&ignore=weapons,special
Valid Ignore types are: 
- **weapons**(ignores player weapon kill/death/teamkills stats)
- **kills**
- **basic**(ignore map,server,gametype name and ,date,playtime,match winner)
- **special**(ignores Killing sprees, Multi Kills, first blood)
- **pickups**(ignores armour,udamage,jump boots ect)
- **players**(this will automatically ignore weapons,special,pickups)

- **Fetch Match Basic Info** Returns team scores, winner, map, gametype, server names, total players, playtime https://example.com/api/json/match/?id=1337&mode=basic
- **Fetch Match Players Info** https://example.com/api/json/match/?id=1337&mode=players
- **Fetch Match Detailed Kills** This includes timestamps, weapons held by each player https://example.com/api/json/match/?id=1337&mode=kills-detailed
- **Fetch Match Basic Kills** The returns just killer,victim pairs https://example.com/api/json/match/?id=1337&mode=kills-basic

## Optional Damage Mutator
You can enable basic damage tracking for players by adding [this mutator](https://github.com/scottadkin/UTStats-Lite-Damage)
So far there is only match player data displayed for damage.