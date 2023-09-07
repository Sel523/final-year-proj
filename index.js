require('dotenv').config();
const variables = process.env;
const { token } = variables;
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');


const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

async function loadFunctions() {
  const functionFolders = await fs.readdir('./functions');
  for (const folder of functionFolders) {
    const functionFiles = (await fs.readdir(`./functions/${folder}`)).filter(
      (file) => file.endsWith('.js'),
    );
    for (const file of functionFiles) {
      require(`./functions/${folder}/${file}`)(client);
    }
  }
}

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token);
