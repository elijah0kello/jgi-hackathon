const functions = require("firebase-functions");
const dsConfig = require("./config/index").config;
const axios = require("axios");
const FormData = require("form-data");
const { Firestore } = require("@google-cloud/firestore");
const admin = require("firebase-admin");
const docusign = require("docusign-esign");

// Initilaize Firebase
admin.initializeApp();

// Create new firestore client
const firestore = new Firestore();

// Function to authenticate the Application
/**
@param {req} // Request Object
@param {res} // Response Object
*/
exports.authenticator = functions.https.onRequest((request, response) => {
  // Scopes to be granted.
  const consentScopes = "signature impersonation";

  // Setting up the consent url
  const consentUrl =
    `${dsConfig.dsOauthServer}/oauth/auth?response_type=code&` +
    `scope=${consentScopes}&client_id=${dsConfig.dsintegrationKey}&` +
    `redirect_uri=${dsConfig.appUrl}/callback.html`;

  // Set the response header
  response.setHeader("Content-Type", "Application/Json");
  response.setHeader("Access-Control-Allow-Origin", `${dsConfig.appUrl}`);
  response.send(JSON.stringify({ url: consentUrl }));
});

// // Function for Docusign to receive the access token
exports.getToken = functions.https.onRequest(async (resquest, response) => {
  var data = new FormData();
  data.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
  data.append(
    "assertion",
    "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI0ZWM4MDZjZS0yMzFjLTQ4MzMtOWIzMy1hOGQ0OGJlYjA5YWMiLCJzdWIiOiI0MjQyNzJkMS00MjkzLTQwMTUtYjFhOS1jNjQ1YzFlMTkyNWYiLCJhdWQiOiJhY2NvdW50LWQuZG9jdXNpZ24uY29tIiwiaWF0IjoxNjI3Mzc2OTQ2LCJleHAiOjE2NTg5MDY1NTAsInNjb3BlIjoic2lnbmF0dXJlIn0.nNGCwj_JG92xX63cirN-zEkqgxMvG05tHkPuAOxK-tHnqM_r4_qTwtwyk8exusNpX5WOuVsaPWjCYHwh5hmtMxLAUCRI7iPbTsnqiN8BdyyvgR_FMp8cDwcUBFmkdUb0gT5RHNkMxtDS4w8tP5qwC5K9fMAgK-YCoDjmRz8RTlyx2QrAsGD6zVGAHiWAhq0tIID-Ak06IotN1ggu1eArbG-0Ip3B535sJWk-10N4ApP7xpSGuLY5__Ud9J3ZUn2GuDzN6sbRhzoDbTECf1Uq_HJp7-K7U8a5dviP4PATKEvhCnOGTyXHbhXsMKbQ0EZ4FLhiEyXbbA0VfyZLyUsW7A"
  );

  var config = {
    method: "post",
    url: dsConfig.dsOauthServer + "/oauth/token",
    headers: {
      ...data.getHeaders(),
    },
    data: data,
  };

  axios(config)
    .then(async function (res) {
      var issueDate = new Date();
      var expirationDate = issueDate.setSeconds(issueDate.getSeconds() + 3600);
      // console.log(JSON.stringify(response.data));

      // Store the token
      const document = firestore.doc("environment/config");

      await document.update({
        acc_token: res.data.access_token,
        appIsAuthenticated: true,
        tokenExpirationDate: expirationDate,
      });

      // Set response Headers
      response.setHeader("Content-Type", "Application/Json");
      response.setHeader("Access-Control-Allow-Origin", `${dsConfig.appUrl}`);
      response.send(JSON.stringify({ status: true }));
    })
    .catch(function (error) {
      console.log(error);
      response.setHeader("Content-Type", "Application/Json");
      response.setHeader("Access-Control-Allow-Origin", `${dsConfig.appUrl}`);
      response.send(JSON.stringify({ status: false, error: error }));
    });
});

function document1(data) {
  // Data for this method
  // args.signerEmail
  // args.signerName
  // args.ccEmail
  // args.ccName

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
    </head>
    <body style="font-family:sans-serif;margin-left:2em;">
    <h1 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
        color: darkblue;margin-bottom: 0;">World Wide Corp</h1>
    <h2 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
      margin-top: 0px;margin-bottom: 3.5em;font-size: 1em;
      color: darkblue;">Order Processing Division</h2>
    <h4>Ordered by ${data.initiatorName}</h4>
    <p style="margin-top:0em; margin-bottom:0em;">Email: ${data.initiatorEmail}</p>
    <p style="margin-top:3em;">
  Candy bonbon pastry jujubes lollipop wafer biscuit biscuit. Topping brownie sesame snaps sweet roll pie. Croissant danish biscuit soufflé caramels jujubes jelly. Dragée danish caramels lemon drops dragée. Gummi bears cupcake biscuit tiramisu sugar plum pastry. Dragée gummies applicake pudding liquorice. Donut jujubes oat cake jelly-o. Dessert bear claw chocolate cake gummies lollipop sugar plum ice cream gummies cheesecake.
    </p>
    <!-- Note the anchor tag for the signature field is in white. -->
    <h3 style="margin-top:3em;">Agreed: <span style="color:white;">**signature_1**/</span></h3>
    </body>
  </html>`;
}

//Make envelope Function
function makeEnvelope(data) {
  console.log("Data Make Env Signers: " + data);
  // Data for this method
  // args.signerEmail
  // args.signerName
  // args.ccEmail
  // args.ccName
  // args.status
  // demoDocsPath (module constant)
  // doc2File (module constant)
  // doc3File (module constant)
  // document 1 (html) has tag **signature_1**
  // document 2 (docx) has tag /sn1/
  // document 3 (pdf) has tag /sn1/
  //
  // The envelope has two recipients.
  // recipient 1 - signer
  // recipient 2 - cc
  // The envelope will be sent first to the signer.
  // After it is signed, a copy is sent to the cc person.
  // create the envelope definition
  let env = new docusign.EnvelopeDefinition();
  env.emailSubject = "Please sign this document set";
  // add the documents
  let doc1 = new docusign.Document(),
    doc1b64 = Buffer.from(document1(data)).toString("base64");
  doc1.documentBase64 = doc1b64;
  doc1.name = "Order acknowledgement"; // can be different from actual file name
  doc1.fileExtension = "html"; // Source data format. Signed docs are always pdf.
  doc1.documentId = "1"; // a label used to reference the doc
  // The order in the docs array determines the order in the envelope
  env.documents = [doc1];
  // create a signer recipient to sign the document, identified by name and email
  // We're setting the parameters via the object constructor
  var signersArray = [];
  for (var i = 0; i < data.signers.length; i++) {
    signersArray[i] = docusign.Signer.constructFromObject({
      email: data.signers[i].email,
      name: data.signers[i].name,
      recipientId: `${i + 1}`,
      routingOrder: `${i + 1}`,
    });
  }
  // Create signHere fields (also known as tabs) on the documents,
  // We're using anchor (autoPlace) positioning
  //
  // The DocuSign platform searches throughout your envelope's
  // documents for matching anchor strings. So the
  // signHere2 tab will be used in both document 2 and 3 since they
  // use the same anchor string for their "signer 1" tabs.
  let signHere1 = docusign.SignHere.constructFromObject({
    anchorString: "**signature_1**",
    anchorYOffset: "10",
    anchorUnits: "pixels",
    anchorXOffset: "20",
  });
  // Tabs are set per recipient / signer
  // Create the tab
  let signerTab = docusign.Tabs.constructFromObject({
    signHereTabs: [signHere1],
  });
  // Assign the tabs
  for (var j = 0; j < signersArray.length; j++) {
    signersArray[j].tabs = signerTab;
  }
  // Add the recipients to the envelope object
  let recipients = docusign.Recipients.constructFromObject({
    signers: signersArray,
  });
  env.recipients = recipients;
  // Requestrequestuest that the envelope be sent by setting |status| to "sent".
  // To requestuest that the envelope be created as a draft, set to "created"
  env.status = "sent";
  console.log("Returning data in Make Document");
  return env;
}

// function to call the e-signature api
const eSignFunc = async (basePath, accessToken, data) => {
  // Data for this method
  // args.basePath
  // args.accessToken
  // args.accountId
  // console.log("Base Path: " + basePath + " Acc: " + accessToken);

  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient);

  // Step 1. Make the envelope requestuest body
  try {
    let envelope = makeEnvelope(data);

    // Step 2. call Envelopes::create API method
    // Exceptions will be caught by the calling function
    let results = await envelopesApi.createEnvelope(dsConfig.apiAccountId, {
      envelopeDefinition: envelope,
    });
    let envelopeId = results.envelopeId;

    console.log(`Envelope was created. EnvelopeId ${envelopeId}`);
    if (results.status == "sent") {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log("DS API CALL FAILED: " + error);
    return false;
  }
};

// Function to get the user info
const getUserInfo = async (theToken, data) => {
  var config = {
    method: "get",
    url: dsConfig.dsOauthServer + "/oauth/userinfo",
    headers: {
      Authorization: "Bearer " + theToken,
    },
  };
  await axios(config)
    .then(function (res) {
      let userData = res.data;
      // console.log(userData);
      try {
        var result = eSignFunc(userData.accounts[0].base_uri, theToken, data);
        if (result) {
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.log(error);
        return false;
      }
    })
    .catch(function (error) {
      console.log(error);
      return false;
    });
};

// Retrieve the token from the db
const retrieveToken = (data) => {
  const docRef = firestore.doc("environment/config");
  docRef
    .get()
    .then((doc) => {
      if (doc.exists) {
        // console.log("Retrieve:  " + data.signers.length);
        try {
          var result = getUserInfo(doc.data().acc_token, data);
          if (result) {
            return true;
          } else {
            return false;
          }
        } catch (error) {
          console.log(error);
          return false;
        }
      } else {
        console.log("Doc doesn't exist");
        return false;
      }
    })
    .catch((error) => {
      console.log(error);
      return false;
    });
};

// INITIATE SIGNING
const runTimeOptions = { timeoutSeconds: 420 };
exports.initiateSigning = functions
  .runWith(runTimeOptions)
  .https.onRequest(async (request, response) => {
    const data = request.body;
    const docRef = firestore.doc("environment/config");

    response.setHeader("Content-Type", "Application/Json");
    response.setHeader("Access-Control-Allow-Headers", "*");
    response.setHeader("Access-Control-Allow-Origin", `${dsConfig.appUrl}`);
    docRef
      .get()
      .then(async (doc) => {
        if (doc.exists) {
          var now = new Date();
          // Check token expiration
          if (now >= doc.data().tokenExpirationDate) {
            /**********Token Acquisition**********/
            await axios
              .get(
                "http://localhost:5001/master-bruin-319711/us-central1/getToken"
              )
              .then((res) => {
                if (res.data.status) {
                  console.log(data);
                  try {
                    var result = retrieveToken(data);
                    if (result) {
                      console.log("Token acquired");
                      response.send(JSON.stringify({ status: true }));
                    } else {
                      console.log("Token acquisition was not successful");
                      response.send(
                        JSON.stringify({
                          status: false,
                          reason: "Token acquisition was not successful",
                        })
                      );
                    }
                  } catch (error) {
                    console.log(error);
                    response.send(
                      JSON.stringify({
                        status: false,
                      })
                    );
                  }
                } else {
                  console.log("Token acquisition was not successful");

                  response.send(
                    JSON.stringify({
                      status: false,
                      reason: "Token acquisition was not successful",
                    })
                  );
                }
              })
              .catch((error) => {
                console.log(error);
                response.send(JSON.stringify({ status: false }));
              });
            /**********Token Acquisition**********/
          } else {
            console.log("Using Old token");
            console.log(data);
            var result = retrieveToken(data);
            console.log("Using old token");
            response.send(JSON.stringify({ status: true, result: result }));
          }
        } else {
          console.log("No such doc");
          response.send(JSON.stringify({ status: false }));
        }
      })
      .catch((error) => {
        console.log(error);
        response.send(JSON.stringify({ status: false }));
      });
  });
