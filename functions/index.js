const functions = require("firebase-functions");
// const controllers = require("./lib/commonControllers");
const dsjwt = require("./lib/DSJwtAuth");

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

// Function to authenticate the Application
/**
@param {req} // Request Object
@param {res} // Response Object
*/
exports.authenticator = functions.https.onRequest((req, res, next) => {
  dsjwt.login(req, res, next);
});

// Callback function for Docusign to receive the access token
exports.callBackJGI = functions.https.onRequest(() => {
  // receive and store the access token
});

exports.initiateSigning = functions.https.onRequest((req, res) => {
  // E signature process initiation
});
