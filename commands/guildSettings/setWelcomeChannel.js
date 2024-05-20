const { SlashCommandBuilder, PermissionFlagsBits  } = require('discord.js');
const db = require('../../services/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setwelcomechannel')
    .setDescription('Set the welcome channel')
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel to welcome users')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');

    await db.query('INSERT INTO welcome_channels (guild_id, channel_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE channel_id=?', [interaction.guild.id, channel.id, channel.id]);

    await interaction.reply(
      `<@${interaction.member.id}>, you have set the welcome channel to ${channel.name}!`
    );
  },
};