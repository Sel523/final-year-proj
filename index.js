require('dotenv').config();
const variables = process.env;
const { token } = variables;
const fs = require('fs').promises;
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

async function loadFunctions() {
  try {
    const functionFolders = await fs.readdir('./functions');
    for (const folder of functionFolders) {
      const functionFiles = (await fs.readdir(`./functions/${folder}`)).filter(
        (file) => file.endsWith('.js'));
      for (const file of functionFiles) {
        require(`./functions/${folder}/${file}`)(client);
      }
    }
  } catch (err) {
    console.error(`Error while loading functions: ${err}`);
  }
}


client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

async function startBot() {
  try {
    await loadFunctions();
    await client.login(token);
  } catch (err) {
    console.error(err);
  }
  client.handleEvents();
  client.handleCommands();
}

startBot().catch(console.error);
