const { Events } = require('discord.js');
const ContentSafetyClient = require('@azure-rest/ai-content-safety').default;
const { isUnexpected } = require('@azure-rest/ai-content-safety');
const { AzureKeyCredential } = require('@azure/core-auth');

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(msg) {
    if (msg.author.bot) {
      return;
    }

    if (msg.attachments.length <= 0) {
      return;
    }
    let imageUrls = [];
    for (let attachment of msg.attachments) {
      if (attachment[1].contentType.startsWith('image')) {
        imageUrls.push(attachment[1].url);
      }
    }

    for (let img of imageUrls) {
      let result = await analyzeMessageImage(img);
      if (result.block === true) {
        await msg.delete();
        return await msg.channel.send(`An image has been deleted due to it violating these rules: ${result.violations.join(', ')}`);
      }
    }
  },
};

const imgViolationThresholds = {
  Hate: 3,
  Sexual: 3,
  Violence: 4,
  SelfHarm: 4,
};
const combinedViolationThreshold = 4;

async function analyzeMessageImage(imageUrl) {
  const endpoint = process.env.azureContentSafetyEndpoint || '<endpoint>';
  const key = process.env.azureContentSafetyApiKey || '<key>';

  const credential = new AzureKeyCredential(key);
  const client = ContentSafetyClient(endpoint, credential);

  const analyzeImageOption = { image: { blobUrl: imageUrl } };
  const analyzeImageParameters = { body: analyzeImageOption };

  const result = await client.path('/image:analyze').post(analyzeImageParameters);

  if (isUnexpected(result)) {
    throw result;
  }

  for (let i = 0; i < result.body.categoriesAnalysis.length; i++) {
    const imageCategoriesAnalysisOutput = result.body.categoriesAnalysis[i];
    console.log(
      imageCategoriesAnalysisOutput.category,
      ' severity: ',
      imageCategoriesAnalysisOutput.severity,
    );
  }

  let violations = [];
  let totalViolations = [];
  let totalSeverity = 0;

  for (let category of result.body.categoriesAnalysis) {
    if (category.severity >= imgViolationThresholds[category.category]) {
      violations.push(category.category);
    }
    if (category.severity > 0) {
      totalViolations.push(category.category);
    }
    totalSeverity += category.severity;
  }

  return {
    block: (violations.length > 0) || (totalSeverity >= combinedViolationThreshold),
    violations: totalViolations,
  };
}
