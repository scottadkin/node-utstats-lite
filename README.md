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
- To Create an admin account go to [http://localhost:3000/register](http://localhost:3000/register), the first account is auto activated, every following account needs to be activated.
- To Login go to [http://localhost:3000/login](http://localhost:3000/login)
- To go to the admin area go to [http://localhost:3000/admin](http://localhost:3000/admin)
- In the admin you can then add S/FTP servers to the importer list. ![ftp admin image](https://i.imgur.com/gA2WpT4.png "FTP Admin Image")

## Running The Log Importer
- Open a terminal in the folder you installed to.
- Run the command **node importer.mjs**.