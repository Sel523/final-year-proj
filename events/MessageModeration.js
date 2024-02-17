const {Events} = require('discord.js');
const ContentSafetyClient = require("@azure-rest/ai-content-safety").default,
  { isUnexpected } = require("@azure-rest/ai-content-safety");
const { AzureKeyCredential } = require("@azure/core-auth");


module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(msg) {
    if (msg.author.bot) {
      return
    }
    if (msg.content.length <= 0) {
      return
    }
    const msgViolation = await analyzeMessageText(msg.content);

    if (msgViolation.block !== true) {
      return
    }
    await msg.delete();
    await msg.channel.send(`A message has been deleted due to it violating these rules: ${msgViolation.violations.join(', ')}`)
  },
};

const textViolationThresholds = {
  'Hate': 3,
  'Sexual': 3,
  'Violence': 4,
  'SelfHarm': 4
}
const combinedViolationThreshold = 4

async function analyzeMessageText(text) {
  const endpoint = process.env["azureContentSafetyEndpoint"] || "<endpoint>";
  const key = process.env["azureContentSafetyApiKey"] || "<key>";

  const credential = new AzureKeyCredential(key);
  const client = ContentSafetyClient(endpoint, credential);

  const analyzeTextOption = { text: text };
  const analyzeTextParameters = { body: analyzeTextOption };

  const result = await client.path("/text:analyze").post(analyzeTextParameters);

  if (isUnexpected(result)) {
    throw result;
  }

  let violations = [];
  let totalViolations = [];
  let totalSeverity = 0;

  for (let category of result.body.categoriesAnalysis) {
    if (category.severity >= textViolationThresholds[category.category]) {
      violations.push(category.category)
    }
    if (category.severity > 0) {
      totalViolations.push(category.category)
    }
    totalSeverity += category.severity
  }

  return {
    block: (violations.length > 0) || (totalSeverity >= combinedViolationThreshold),
    violations: totalViolations
  }
}
