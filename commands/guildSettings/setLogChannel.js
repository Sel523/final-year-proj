const { SlashCommandBuilder, PermissionFlagsBits  } = require('discord.js');
const db = require('../../services/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlogchannel')
    .setDescription('Set the log channel')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel to log events')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');

    await db.query('INSERT INTO log_channels (guild_id, channel_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE channel_id=?', [interaction.guild.id, channel.id, channel.id]);

    await interaction.reply(
      `<@${interaction.member.id}>, you have set the log channel to ${channel.name}!`
    );
  },
};