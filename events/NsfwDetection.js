const { Events, EmbedBuilder } = require('discord.js');
const ContentSafetyClient = require('@azure-rest/ai-content-safety').default;
const { isUnexpected } = require('@azure-rest/ai-content-safety');
const { AzureKeyCredential } = require('@azure/core-auth');
const db = require('../services/db');
const { defaultImgViolationThresholds } = require('../config/thresholds');

const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/gi; // regex to match urls

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(msg) {
    if (msg.author.bot) {
      return;
    }

    let urls = msg.content.match(urlRegex); // get all urls in the message
    if (!urls) {
      urls = [];
    }

    if (msg.attachments.length <= 0 && urls.length <= 0) {
      return;
    }
    const imageUrls = [...urls]; // create a new array with the urls
    for (const attachment of msg.attachments) { // loop through the attachments
      if (attachment[1].contentType.startsWith('image')) { // if the attachment is an image
        imageUrls.push(attachment[1].url); // add the url to the imageUrls array
      }
    }

    const thresholds = await getImgThresholds(msg.guild.id); // get the image detection thresholds for the guild
    for (const img of imageUrls) {
      const result = await analyzeMessageImage(img, thresholds); // analyze the image
      if (result.block === true) { // if the image should be blocked
        await msg.delete(); // delete the message
        const logChannel = await db.query('SELECT channel_id FROM log_channels WHERE guild_id=?', [msg.guild.id]); // get the log channel for the guild
        if (logChannel.length > 0) {
          const channel = await msg.client.channels.fetch(logChannel[0].channel_id); // fetch the log channel

          const embed = new EmbedBuilder()
            .setTitle('AI Image Detection')
            .addFields(
              { name: 'Message Author', value: `<@${msg.author.id}>` },
              { name: 'Message Violations', value: result.violations.join(', ') },
            )
            .setImage(img);

          await channel.send({ embeds: [embed] }); // send an embed to the log channel with the message author and the violations
        }
        return await msg.channel.send(`An image has been deleted due to it violating these rules: ${result.violations.join(', ')}`);
      }
    }
  },
};

async function analyzeMessageImage(imageUrl, thresholds) {
  const endpoint = process.env.azureContentSafetyEndpoint || '<endpoint>';
  const key = process.env.azureContentSafetyApiKey || '<key>';

  const credential = new AzureKeyCredential(key);
  const client = ContentSafetyClient(endpoint, credential);

  const analyzeImageOption = { image: { blobUrl: imageUrl } }; // create an object with the image url to analyse the image with the AI
  const analyzeImageParameters = { body: analyzeImageOption }; // create an object with the parameters for the AI

  try {
    const result = await client.path('/image:analyze').post(analyzeImageParameters); // analyse the image with the AI

    if (isUnexpected(result)) {
      throw result;
    }

    for (let i = 0; i < result.body.categoriesAnalysis.length; i++) { // loop through the categories analysis
      const imageCategoriesAnalysisOutput = result.body.categoriesAnalysis[i]; // get the category analysis output
      console.log(
        imageCategoriesAnalysisOutput.category,
        ' severity: ',
        imageCategoriesAnalysisOutput.severity,
      );
    }

    const violations = [];
    const totalViolations = [];
    let totalSeverity = 0;

    for (const category of result.body.categoriesAnalysis) {
      if (category.severity >= thresholds[category.category]) { // if the severity of the category is greater than the threshold for the category add it to the violations array
        violations.push(category.category);
      }
      if (category.severity > 0) {
        totalViolations.push(category.category);
      }
      totalSeverity += category.severity;
    }

    return {
      block: (violations.length > 0) || (totalSeverity >= thresholds.combined), // if there are any violations or the total severity is greater than the combined threshold return true
      violations: totalViolations,
    };
  } catch (err) {
    return {
      block: false,
    };
  }
}

// eslint-disable-next-line camelcase
async function getImgThresholds(guild_id) {
  // eslint-disable-next-line camelcase
  const thresholds = await db.query('SELECT name, value FROM image_detection_thresholds WHERE guild_id=?', [guild_id]); // get the image detection thresholds for the guild

  const hateThreshold = thresholds.find(obj => obj.name === 'Hate')?.value ?? defaultImgViolationThresholds.Hate; // get the hate image threshold for the guild
  const sexualThreshold = thresholds.find(obj => obj.name === 'Sexual')?.value ?? defaultImgViolationThresholds.Sexual;
  const violenceThreshold = thresholds.find(obj => obj.name === 'Violence')?.value ?? defaultImgViolationThresholds.Violence;
  const selfHarmThreshold = thresholds.find(obj => obj.name === 'SelfHarm')?.value ?? defaultImgViolationThresholds.SelfHarm;

  return { // return an object with the thresholds
    Hate: hateThreshold,
    Sexual: sexualThreshold,
    Violence: violenceThreshold,
    SelfHarm: selfHarmThreshold,
    combined: Math.ceil((hateThreshold + sexualThreshold + violenceThreshold + selfHarmThreshold) / 4),
  };
}
