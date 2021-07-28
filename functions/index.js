const functions = require("firebase-functions");
const dsConfig = require("./config/index").config;
const { Firestore } = require("@google-cloud/firestore");
// const axios = require("axios");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Import and initialize the Firebase Admin SDK
const admin = require("firebase-admin");
admin.initializeApp();

// Create new client
const firestore = new Firestore();

// Function to authenticate the Application
/**
@param {req} // Request Object
@param {res} // Response Object
*/
exports.authenticator = functions.https.onRequest((request, response, next) => {
  // Scopes to be granted.
  const consentScopes = "signature impersonation";

  // Setting up the consent url
  const consentUrl =
    `${dsConfig.dsOauthServer}/oauth/auth?response_type=code&` +
    `scope=${consentScopes}&client_id=${dsConfig.dsintegrationKey}&` +
    `redirect_uri=${dsConfig.appUrl}/callback.html`;

  // Set the response header
  response.setHeader("Content-Type", "Application/Json");
  response.send(JSON.stringify({ url: consentUrl }));
});

// // Callback function for Docusign to receive the access token
exports.callBackJGI = functions.https.onRequest(
  async (resquest, response, next) => {
    // Obtain document ref
    const document = firestore.doc("environment/conifgs");

    // Enter new data
    await document.set({
      callBack: true,
    });
    response.setHeader("Content-Type", "Application/Json");
    response.send(JSON.stringify({ success: true }));
  }
);

// exports.initiateSigning = functions.https.onRequest((req, res) => {
//   // E signature process initiation
// });
