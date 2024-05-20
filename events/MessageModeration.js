const { Events, EmbedBuilder } = require('discord.js');
const ContentSafetyClient = require('@azure-rest/ai-content-safety').default;
const { isUnexpected } = require('@azure-rest/ai-content-safety');
const { AzureKeyCredential } = require('@azure/core-auth');
const db = require('../services/db');
const { defaultTextViolationThresholds } = require('../config/thresholds');


module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(msg) {
    if (msg.author.bot) {
      return;
    }
    if (msg.content.length <= 0) {
      return;
    }

    const thresholds = await getTextThresholds(msg.guild.id);
    const msgViolation = await analyzeMessageText(msg.content, thresholds);

    if (msgViolation.block !== true) {
      return;
    }
    await msg.delete();
    await msg.channel.send(`A message has been deleted due to it violating these rules: ${msgViolation.violations.join(', ')}`);

    const logChannel = await db.query('SELECT channel_id FROM log_channels WHERE guild_id=?', [msg.guild.id]);
    if (logChannel.length > 0) {
      const channel = await msg.client.channels.fetch(logChannel[0].channel_id);

      const embed = new EmbedBuilder()
        .setTitle('AI Text Detection')
        .addFields(
          {name: 'Message Author', value: `<@${msg.author.id}>`},
          {name: 'Message Violations', value: msgViolation.violations.join(', ') },
          {name: 'Message Content', value: msg.content },
        )

      await channel.send({embeds: [embed]});
    }
  },
};

async function analyzeMessageText(text, thresholds) {
  const endpoint = process.env['azureContentSafetyEndpoint'] || '<endpoint>';
  const key = process.env['azureContentSafetyApiKey'] || '<key>';

  const credential = new AzureKeyCredential(key);
  const client = ContentSafetyClient(endpoint, credential);

  const analyzeTextOption = { text: text };
  const analyzeTextParameters = { body: analyzeTextOption };

  const result = await client.path('/text:analyze').post(analyzeTextParameters); // analyse the text

  if (isUnexpected(result)) {
    throw result;
  }

  const violations = []; // create an array to store the violations
  const totalViolations = []; //  create an array to store the total violations
  let totalSeverity = 0;

  for (let category of result.body.categoriesAnalysis) {
    if (category.severity >= thresholds[category.category]) {
      violations.push(category.category); // if the severity of the category is greater than the threshold for the category add it to the violations array
    }
    if (category.severity > 0) {
      totalViolations.push(category.category);
    }
    totalSeverity += category.severity; // add the severity of the category to the total severity
  }

  return {
    block: (violations.length > 0) || (totalSeverity >= thresholds['combined']),
    violations: totalViolations, // return the violations
  };
}

async function getTextThresholds(guild_id) {
  const thresholds = await db.query('SELECT name, value FROM text_detection_thresholds WHERE guild_id=?', [guild_id]); // get the text detection thresholds for the guild

  const hateThreshold = thresholds.find(obj => obj.name === 'Hate')?.value ?? defaultTextViolationThresholds['Hate']; // get the hate text threshold for the guild
  const sexualThreshold = thresholds.find(obj => obj.name === 'Sexual')?.value ?? defaultTextViolationThresholds['Sexual'];
  const violenceThreshold = thresholds.find(obj => obj.name === 'Violence')?.value ?? defaultTextViolationThresholds['Violence'];
  const selfHarmThreshold = thresholds.find(obj => obj.name === 'SelfHarm')?.value ?? defaultTextViolationThresholds['SelfHarm'];

  return { // return the thresholds
    Hate: hateThreshold,
    Sexual: sexualThreshold,
    Violence: violenceThreshold,
    SelfHarm: selfHarmThreshold,
    combined: Math.ceil((hateThreshold + sexualThreshold + violenceThreshold + selfHarmThreshold) / 4),
  };
}
