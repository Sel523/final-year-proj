const { Events } = require('discord.js');
const db = require('../services/db');

module.exports = {
  name: Events.GuildMemberAdd, // listen for the guildMemberAdd event
  once: false,
  async execute(member) {
    if (member.bot) { // if the member is a bot, return
      return;
    }

    const welcomeChannel = await db.query(
      'SELECT channel_id FROM welcome_channels WHERE guild_id=?', // get the welcome channel for the guild
      [member.guild.id],
    );

    if (welcomeChannel.length > 0) {
      const channel = await member.client.channels.fetch( // fetch the welcome channel
        welcomeChannel[0].channel_id,
      );

      await channel.send(
        `Welcome <@${member.id}>! Please choose your year to be assigned a role with /setyear`, // send a welcome message
      );
    }
  },
};
