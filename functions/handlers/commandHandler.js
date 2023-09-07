const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();
const variables = process.env;
const { token, clientId } = variables;
const commands = [];

module.exports = (client) => {
  client.handleCommands = async () => {
    const commandFoldersPath = path.join(__dirname, '../../commands');
    const commandFolders = fs
      .readdirSync(commandFoldersPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const folder of commandFolders) {
      const commandFilesPath = path.join(commandFoldersPath, folder);
      const commandFiles = fs
        .readdirSync(commandFilesPath)
        .filter((file) => file.endsWith('.js'));

      for (const file of commandFiles) {
        const command = require(path.join(commandFilesPath, file));
        commands.push(command.data.toJSON());
        await client.commands.set(command.data.name, command);
      }
    }
    const rest = new REST().setToken(token);

    // and deploy your commands!
    (async () => {
      try {
        console.log(
          `Started refreshing ${commands.length} application (/) commands.`,
        );

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(Routes.applicationCommands(clientId), {
          body: commands,
        });

        console.log(
          `Successfully reloaded ${data.length} application (/) commands.`
        );
      } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
      }
    })();
  };
};
