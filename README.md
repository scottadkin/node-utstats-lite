## Node UTStats Lite
Unreal Tournament stats website for the [https://github.com/rxut/UTStatsLite](utstats-lite mutator).

## Requirements 
- MYSQL Server
- Node.js 18.17 or later.

## Installing
- Extract the contents of the archive into a folder.
- Open a terminal in the folder you extracted to.
- Run the command **npm install** to install all dependencies.
- Open **config.mjs** and change the settings to connect to your mysql server.
- Run the command **node install.mjs** to create the database and other settings.


## Starting The Website
- Open a terminal in the folder you installed to.
- Run the command **npm run build** to build the website.
- Once the website has been built, run the command **npm run start**
- Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


## Running The Log Importer
- Open a terminal in the folder you installed to.
- Run the command **node importer.mjs**.