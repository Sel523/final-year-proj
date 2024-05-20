const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../services/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setyearrole')
    .setDescription('Set the roles given for each role')
    .addStringOption((option) =>
      option
        .setName('year')
        .setDescription('The uni year to set the role of')
        .setRequired(true)
        .addChoices(
          { name: 'First Year', value: '1' },
          { name: 'Second Year', value: '2' },
          { name: 'Third Year', value: '3' },
          { name: 'Fourth Year', value: '4' },
        ),
    )
    .addRoleOption((option) =>
      option
        .setName('role')
        .setDescription('The role to be given when users use that year')
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const year = interaction.options.getString('year');
    const role = interaction.options.getRole('role');

    await db.query('INSERT INTO roles (guild_id, role_name, role_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role_id=?', [interaction.guild.id, year, role.id, role.id]);

    await interaction.reply(
      `<@${interaction.member.id}>, you have set the role for this year to ${role.name}!`,
    );
  },
};
