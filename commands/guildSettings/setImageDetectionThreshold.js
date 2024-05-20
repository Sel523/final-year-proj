const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../services/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setimagedetectionthreshold')
    .setDescription('Set the threshold for AI image detection')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('The threshold to set')
        .setRequired(true)
        .addChoices(
          { name: 'Hate', value: 'Hate' },
          { name: 'Sexual', value: 'Sexual' },
          { name: 'Violence', value: 'Violence' },
          { name: 'Self Harm', value: 'SelfHarm' },
        )
    )
    .addIntegerOption((option) =>
      option
        .setName('threshold')
        .setDescription(
          'The threshold for the bot to take action, the lower the more sensitive it detects',
        )
        .setMaxValue(7)
        .setMinValue(1)
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const thresholdType = interaction.options.getString('type');
    const thresholdValue = interaction.options.getInteger('threshold');

    await db.query(
      'INSERT INTO image_detection_thresholds (guild_id, name, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value=?',
      [interaction.guild.id, thresholdType, thresholdValue, thresholdValue]
    );

    await interaction.reply(
      `<@${interaction.member.id}>, you have set the threshold for ${thresholdType} detections to ${thresholdValue}!`,
    );
  },
};
