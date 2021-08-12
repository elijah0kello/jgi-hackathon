const functions = require("firebase-functions");
const dsConfig = require("./config/index").config;
const axios = require("axios");
const FormData = require("form-data");
const docusign = require("docusign-esign");
const { Firestore } = require("@google-cloud/firestore");
var admin = require("firebase-admin");
const { Storage } = require("@google-cloud/storage");
const fs = require("fs");
const path = require("path");

// Initilaize Firebase
var serviceAccount = require("./config/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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
  data.append("assertion", "{ASSERTION}");

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
      // console.log("Token Acquisiton Response: " + JSON.stringify(res.data));
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
      console.log("Token acquisition Successful in GET TOKEN CLOUD FUNC");
      response.setHeader("Content-Type", "Application/Json");
      response.setHeader("Access-Control-Allow-Origin", `${dsConfig.appUrl}`);
      response.send(JSON.stringify({ status: true }));
    })
    .catch(function (error) {
      console.log("Token acquisition Failed in GET TOKEN CLOUD FUNC" + error);
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
          color: darkblue;margin-bottom: 0;">THE JANE GOODALL INSTITUTE</h1>
      <h2 style="font-family: 'Trebuchet MS', Helvetica, sans-serif;
      margin-top: 0px;margin-bottom: 3.5em;font-size: 1em;
      color: darkblue;">Chimpanzee Habitat Improvement Audit</h2>
      <h4>Ordered by ${data.initiatorName}</h4>
      <p style="margin-top:0em; margin-bottom:0em;">Email: ${data.initiatorEmail}</p>
      Below is a snapshot of the current map and changes made to it by ${data.initiatorName}. 
      </p>
      <p style="margin-top:0em; margin-bottom:0em;">If you wish to make changes to the map follow this <a href="https://google.com">link</a> but if you are okay with it please sign and agree</p>
      <!-- Note the anchor tag for the signature field is in white. -->
      <h3 style="margin-top:3em;">Agreed: <span style="color:white;">**signature_1**/</span></h3>
      </body>
  </html>`;
}

// function to call the e-signature api
const eSignFunc = async (basePath, accessToken, res, envelope) => {
  try {
    // console.log(JSON.stringify(envelope));
    var thedata = JSON.stringify(envelope);

    var config = {
      method: "post",
      url: `${basePath}/restapi/v2.1/accounts/${dsConfig.apiAccountId}/envelopes`,
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
        Cookie: "{COOKIE}",
      },
      data: thedata,
    };
    // Step 2. call Envelopes::create API method
    // Exceptions will be caught by the calling function
    axios(config)
      .then(function (response) {
        // console.log(JSON.stringify(response.data));
        // console.log(`Envelope was created. EnvelopeId ${envelopeId}`);
        if (response.data.status == "sent") {
          const directory = "docs";

          fs.readdir(directory, (err, files) => {
            if (err) throw err;

            for (const file of files) {
              fs.unlink(path.join(directory, file), (err) => {
                if (err) throw err;
              });
            }
          });
          res.send(JSON.stringify({ status: true }));
        } else {
          response.send(
            JSON.stringify({ status: false, error: "Call to the API failed" })
          );
        }
      })
      .catch(function (error) {
        // console.log(error);
        res.send(
          JSON.stringify({
            status: false,
            error: `Call to the API rasied exception${error}`,
          })
        );
      });
  } catch (error) {
    console.log("DS API CALL FAILED: " + error);
    res.send(
      JSON.stringify({ status: false, error: "DS API CALL FAILED: " + error })
    );
  }
};

//Make envelope Function
function makeEnvelope(basePath, accessToken, data, res) {
  try {
    // define the Google Cloud Storage bucket name
    const bucketName = "master-bruin-319711.appspot.com";

    // define the path and name of Google Cloud Storage object to download
    const srcFilename = data.docName;

    // define the destination folder of downloaded object
    const destFilename = `docs/${data.docName}`;

    // create a client
    const storage = new Storage();

    // define the function for file download
    const downloadFile = new Promise(async (resolve, rejected) => {
      // passing the options
      const options = {
        destination: destFilename,
        validation: false,
      };

      try {
        // download object from Google Cloud Storage bucket
        storage.bucket(bucketName).file(srcFilename).download(options);

        // [optional] a good log can help you in debugging
        console.log(
          "The object " +
            srcFilename +
            " coming from bucket " +
            bucketName +
            " has been downloaded to " +
            destFilename
        );

        resolve();
        // console.log(pdfFromStorage);
      } catch (error) {
        rejected(error);
      }
    });

    // call the download function and be ready to catch errors
    downloadFile
      .then(() => {
        var pdfFromStorage;
        try {
          setTimeout(() => {
            pdfFromStorage = fs.readFileSync(`docs/${data.docName}`);
            let env = new docusign.EnvelopeDefinition();
            env.emailSubject = "Please sign this document set";
            // add the documents
            let doc1 = new docusign.Document(),
              doc1b64 = Buffer.from(document1(data)).toString("base64"),
              doc2b64 = Buffer.from(pdfFromStorage).toString("base64");

            doc1.documentBase64 = doc1b64;
            doc1.name = "Order acknowledgement"; // can be different from actual file name
            doc1.fileExtension = "html"; // Source data format. Signed docs are always pdf.
            doc1.documentId = "1"; // a label used to reference the doc
            // The order in the docs array determines the order in the envelope

            // constructing the pdf
            let doc2 = new docusign.Document.constructFromObject({
              documentBase64: doc2b64,
              name: "Map Changes", // can be different from actual file name
              fileExtension: "pdf",
              documentId: "2",
            });

            // The order in the docs array determines the order in the envelope
            env.documents = [doc1, doc2];
            // create a signer recipient to sign the document, identified by name and email
            // We're setting the parameters via the object constructor
            var signersArray = [];
            console.log(JSON.stringify(data.signers));
            for (var i = 0; i < data.signers.length; i++) {
              signersArray[i] = docusign.Signer.constructFromObject({
                email: data.signers[i].email,
                name: data.signers[i].name,
                recipientId: `${i + 1}`,
                routingOrder: `${i + 1}`,
              });
              console.log(
                "EMAIL Example data in loop: " + data.signers[i].email
              );
              console.log("NAME Example data in loop: " + data.signers[i].name);
            }
            console.log("After the loop: " + JSON.stringify(signersArray));
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

            console.log(
              "After tab assignment: " + JSON.stringify(signersArray)
            );
            // Add the recipients to the envelope object
            let recipients = docusign.Recipients.constructFromObject({
              signers: signersArray,
            });
            env.recipients = recipients;
            console.log("Recipient: " + JSON.stringify(recipients));
            // Requestrequestuest that the envelope be sent by setting |status| to "sent".
            // To requestuest that the envelope be created as a draft, set to "created"
            env.status = "sent";
            console.log("Returning data in Make Document");
            eSignFunc(basePath, accessToken, res, env);
          }, 3000);
        } catch (error) {
          console.log("SET TIMEOUT ERROR");
        }
      })
      .catch((error) => {
        console.log("My Promise:" + error);
        res.send(JSON.stringify({ status: false, error: error }));
      });
  } catch (error) {
    console.log("Storage" + error);
    res.send(JSON.stringify({ status: false, error: error }));
  }
}

// Function to get the user info
const getUserInfo = async (theToken, data, response) => {
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
      console.log(userData.accounts[0].base_uri);
      try {
        makeEnvelope(userData.accounts[0].base_uri, theToken, data, response);
        // var me = true;
        // console.log(me);
        // response.send(JSON.stringify({ status: true }));
      } catch (error) {
        console.log("ERROR IN GET USER INFO" + error);
        response.send(JSON.stringify({ status: false, error: error }));
      }
    })
    .catch(function (error) {
      console.log(error);
      response.send(JSON.stringify({ status: false, error: error }));
    });
};

// Retrieve the token from the db
const retrieveToken = (data, response) => {
  const docRef = firestore.doc("environment/config");
  docRef
    .get()
    .then((doc) => {
      if (doc.exists) {
        console.log("Retrieve:  " + JSON.stringify(data.docName));
        try {
          getUserInfo(doc.data().acc_token, data, response);
          var mine = true;
          // response.send(JSON.stringify({ status: mine }));
        } catch (error) {
          console.log(error);
          response.send(JSON.stringify({ status: false, error: error }));
        }
      } else {
        console.log("Doc doesn't exist");
        response.send(
          JSON.stringify({ status: true, error: "Doc doesn't exist" })
        );
      }
    })
    .catch((error) => {
      console.log(error);
      response.send(JSON.stringify({ status: false, error: error }));
    });
};

// INITIATE SIGNING
const runTimeOptions = { timeoutSeconds: 420 };
exports.initiateSigning = functions
  .runWith(runTimeOptions)
  .https.onRequest(async (request, response) => {
    response.setHeader("Content-Type", "Application/Json");
    response.setHeader("Access-Control-Allow-Headers", "*");
    response.setHeader("Access-Control-Allow-Origin", `${dsConfig.appUrl}`);
    if (request.method == "POST") {
      const data = request.body;
      const docRef = firestore.doc("environment/config");
      docRef
        .get()
        .then(async (doc) => {
          if (doc.exists) {
            var now = new Date();
            // Check token expiration
            if (now >= doc.data().tokenExpirationDate) {
              /**********Token Acquisition**********/
              await axios
                .get("{GET TOKEN ENDPOINT}")
                .then((res) => {
                  if (res.data.status) {
                    console.log("Data from clent" + data.docName);
                    // response.send(JSON.stringify({ data: data }));
                    try {
                      // console.log(JSON.stringify(result));
                      retrieveToken(data, response);
                    } catch (error) {
                      console.log(error);
                      response.send(
                        JSON.stringify({
                          status: false,
                          error: "Call to retrieve token" + error,
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
                  response.send(
                    JSON.stringify({
                      status: false,
                      error: "Firestore promise" + error,
                    })
                  );
                });
              /**********Token Acquisition**********/
            } else {
              console.log("Using Old token");
              // console.log("Data from clent" + JSON.stringify(data.docName));
              try {
                retrieveToken(data, response);
              } catch (error) {
                console.log(error);
              }
            }
          } else {
            console.log("No such doc");
            response.send(
              JSON.stringify({ status: false, error: "No such doc" })
            );
          }
        })
        .catch((error) => {
          console.log(error);
          response.send(JSON.stringify({ status: false, error: error }));
        });
    } else {
      response.send(
        JSON.stringify({ status: false, error: "unsupported method" })
      );
    }
  });
