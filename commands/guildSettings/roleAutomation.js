const { SlashCommandBuilder } = require('discord.js');
const db = require('../../services/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setyear')
    .setDescription('Set your year to be given a role')
    .addStringOption((option) =>
      option
        .setName('year')
        .setDescription('Your uni year')
        .setRequired(true)
        .addChoices(
          { name: 'First Year', value: '1' },
          { name: 'Second Year', value: '2' },
          { name: 'Third Year', value: '3' },
          { name: 'Fourth Year', value: '4' },
        ),
    ),
  async execute(interaction) {
    const year = interaction.options.getString('year');

    const roleData = await db.query(
      'SELECT role_id FROM roles WHERE guild_id=? AND role_name=?',
      [interaction.guild.id, year],
    );

    if (roleData.length === 0) {
      return await interaction.reply(
        `<@${interaction.member.id}>, an administrator hasn't setup that role yet and configured it on the bot.`,
      );
    }

    const role = await interaction.guild.roles.fetch(roleData[0].role_id);

    await interaction.member.roles.add(role);

    await interaction.reply(
      `<@${interaction.member.id}>, you have been given the ${role.name} role!`,
    );
  },
};
