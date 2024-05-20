const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const db = require('../../services/db');
const { defaultTextViolationThresholds, defaultImgViolationThresholds } = require('../../config/thresholds')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('detectionthresholds') // create a new command called detectionthresholds
    .setDescription('See the threshold for AI detection')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // only allow administrators to use this command
  async execute(interaction) {
    const textThresholds = await db.query('SELECT name, value FROM text_detection_thresholds WHERE guild_id=?', [interaction.guild.id]); // get the text detection thresholds for the guild
    const imgThresholds = await db.query('SELECT name, value FROM image_detection_thresholds WHERE guild_id=?', [interaction.guild.id]);

    const hateTextThreshold = textThresholds.find(obj => obj.name === 'Hate')?.value ?? defaultTextViolationThresholds['Hate']; // get the hate text threshold for the guild
    const sexualTextThreshold = textThresholds.find(obj => obj.name === 'Sexual')?.value ?? defaultTextViolationThresholds['Sexual'];
    const violenceTextThreshold = textThresholds.find(obj => obj.name === 'Violence')?.value ?? defaultTextViolationThresholds['Violence'];
    const selfHarmTextThreshold = textThresholds.find(obj => obj.name === 'SelfHarm')?.value ?? defaultTextViolationThresholds['SelfHarm'];

    const hateImgThreshold = imgThresholds.find(obj => obj.name === 'Hate')?.value ?? defaultImgViolationThresholds['Hate']; // get the hate image threshold for the guild
    const sexualImgThreshold = imgThresholds.find(obj => obj.name === 'Sexual')?.value ?? defaultImgViolationThresholds['Sexual'];
    const violenceImgThreshold = imgThresholds.find(obj => obj.name === 'Violence')?.value ?? defaultImgViolationThresholds['Violence'];
    const selfHarmImgThreshold = imgThresholds.find(obj => obj.name === 'SelfHarm')?.value ?? defaultImgViolationThresholds['SelfHarm'];

    const embed = new EmbedBuilder() // create a new embed
      .setTitle('Current AI Thresholds') // set the title of the embed
      .setDescription(`__**Text Detection**__
      **Hate:** ${hateTextThreshold} Default: ${defaultTextViolationThresholds['Hate']} // display the hate text threshold for the guild
      **Sexual:** ${sexualTextThreshold} Default: ${defaultTextViolationThresholds['Sexual']}
      **Violence:** ${violenceTextThreshold} Default: ${defaultTextViolationThresholds['Violence']}
      **Self Harm:** ${selfHarmTextThreshold} Default: ${defaultTextViolationThresholds['SelfHarm']}

      __**Image Detection**__
      **Hate:** ${hateImgThreshold} Default: ${defaultImgViolationThresholds['Hate']} // display the hate image threshold for the guild
      **Sexual:** ${sexualImgThreshold} Default: ${defaultImgViolationThresholds['Sexual']}
      **Violence:** ${violenceImgThreshold} Default: ${defaultImgViolationThresholds['Violence']}
      **Self Harm:** ${selfHarmImgThreshold} Default: ${defaultImgViolationThresholds['SelfHarm']}
      `);


    await interaction.reply({embeds: [embed] }); // send the embed as a reply
  },
};