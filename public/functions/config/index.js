const settings = require("./settings.json");

const dsOauthServer = settings.production
  ? "https://account.docusign.com"
  : "https://account-d.docusign.com";

exports.config = {
  dsOauthServer,
  ...settings,
};
