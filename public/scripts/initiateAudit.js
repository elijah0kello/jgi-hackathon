document.addEventListener("DOMContentLoaded", function () {
  try {
    // initialise firebase
    let app = firebase.app();

    // Sending the pdf to storage
    var files, fileName;
    document.getElementById("uploadBTN").addEventListener("change", (e) => {
      document.getElementById("upload").hidden = false;
      files = e.target.files;
      console.log(files[0]);
      var theDate = Date.now();
      console.log(theDate);
      // fileName = app.auth().currentUser.email;
      fileName = JSON.stringify(theDate) + ".pdf";
      Object.defineProperty(files[0], "name", {
        writable: true,
        value: fileName,
      });
      files[0].name = fileName;
      console.log(files[0].name);
      var extension = files[0].name.split(".").pop();
      console.log(extension);

      try {
        var storage = firebase.storage();
        // storage.useEmulator("localhost", 9199);
        // create a storage ref
        var pdfRef = storage.ref(files[0].name);
        //upload file
        pdfRef.put(files[0]).then((snapshot) => {
          document.getElementById("submitSignerTrigger").hidden = false;
          document.getElementById("upload").innerHTML = "Done";
        });
      } catch (error) {
        console.log(error);
      }
    });

    // Remove an input field
    document.getElementById("removeField").addEventListener("click", () => {
      var fieldContainer = document.getElementById("signers-container");
      var containerChildren = fieldContainer.childNodes;
      var elementToRemove = containerChildren[containerChildren.length - 1];
      elementToRemove.remove();
    });

    // Event Handler to add a new email input field
    document
      .getElementById("addSignerTrigger")
      .addEventListener("click", () => {
        // create the input fields
        var newEmailInput = document.createElement("input");
        var newNameInput = document.createElement("input");

        // create the container
        var divContainer = document.createElement("div");

        newEmailInput.type = "email";
        newEmailInput.id = "signerEmail";
        newEmailInput.placeholder = "Another Stakeholder's Email";
        newEmailInput.className = "email-input";
        newEmailInput.required = true;

        newNameInput.type = "text";
        newNameInput.id = "signerName";
        newNameInput.placeholder = "Another Stakeholder's Full Name";
        newNameInput.className = "name-input";
        newNameInput.required = true;

        divContainer.className = "signerData";
        divContainer.appendChild(newEmailInput);
        divContainer.appendChild(newNameInput);

        var newCenteredDiv = document.createElement("div");
        newCenteredDiv.id = "realSignerDataContainer";
        newCenteredDiv.className = "realSignerDataContainer";
        newCenteredDiv.appendChild(divContainer);

        document
          .getElementById("signers-container")
          .appendChild(newCenteredDiv);
        document.getElementById("removeField").hidden = false;
      });

    // Send data to server
    const sendSignature = async (dataToSend) => {
      var data = JSON.stringify(dataToSend);

      var config = {
        method: "post",
        url: "https://us-central1-master-bruin-319711.cloudfunctions.net/initiateSigning",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };

      axios(config)
        .then(function (response) {
          console.log(JSON.stringify(response.data));
          if (response.data.status) {
            location.replace("/dashboard.html");
          } else {
            if (alert("Something went wrong: Please try again")) {
              // location.replace("/initiatiteAudit.html");
            }
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    };

    // Event Handler to serialize the form data
    document
      .getElementById("submitSignerTrigger")
      .addEventListener("click", async () => {
        document.getElementById("submitSignerCTA").innerHTML = "Sending...";
        var signerEmails = document.getElementById("signers-container");
        var nodeCollection = signerEmails.childNodes;
        // Getting data from the form
        var signersArray = [];
        for (var i = 0; i < nodeCollection.length; i++) {
          if (nodeCollection[i].id == "realSignerDataContainer") {
            var signerEmail, signerName;
            for (var j = 0; j < nodeCollection[i].childNodes.length; j++) {
              //outerDiv realSignerDataContainer
              if (nodeCollection[i].childNodes[j].nodeName == "DIV") {
                for (
                  var k = 0;
                  k < nodeCollection[i].childNodes[j].childNodes.length;
                  k++
                ) {
                  // innerDiv signerData
                  if (
                    nodeCollection[i].childNodes[j].childNodes[k].nodeName ==
                    "INPUT"
                  ) {
                    if (
                      nodeCollection[i].childNodes[j].childNodes[k].id ==
                      "signerEmail"
                    ) {
                      console.log(
                        "Email: " +
                          nodeCollection[i].childNodes[j].childNodes[k].value
                      );
                      signerEmail =
                        nodeCollection[i].childNodes[j].childNodes[k].value;
                    } else if (
                      nodeCollection[i].childNodes[j].childNodes[k].id ==
                      "signerName"
                    ) {
                      console.log(
                        "Name: " +
                          nodeCollection[i].childNodes[j].childNodes[k].value
                      );
                      signerName =
                        nodeCollection[i].childNodes[j].childNodes[k].value;
                    }
                  } else {
                    continue;
                  }
                }
              } else {
                continue;
              }
            }
            signersArray.push({ email: signerEmail, name: signerName });
            console.log(JSON.stringify(signersArray));
          } else {
            continue;
          }
        }
        var payLoadObj = { signers: signersArray };

        var authedUser = app.auth().currentUser;
        payLoadObj.initiatorEmail = authedUser.email;
        payLoadObj.initiatorName =
          document.getElementById("initiatorName").value;
        payLoadObj.docName = fileName;
        payLoadObj.isFinal = document.getElementById("finalAudit").checked
          ? true
          : false;
        console.log(JSON.stringify(payLoadObj));
        // call the sendSignature function
        var docDate = Date.now();
        var docName = JSON.stringify(docDate);

        app
          .firestore()
          .collection("environment")
          .doc("counter")
          .get()
          .then((doc) => {
            app
              .firestore()
              .collection("audits")
              .doc(`${docName}`)
              .set({
                initiator: app.auth().currentUser.email,
                name: document.getElementById("auditName").value,
                id: doc.data().auditPK + 1,
                isComplete: false,
                fileName: fileName,
                time: Date.now(),
              });

            app
              .firestore()
              .collection("docNames")
              .doc(`Doc ${docName}`)
              .set({
                id: doc.data().auditPK + 1,
                docName: docName,
              });

            app
              .firestore()
              .collection("environment")
              .doc("counter")
              .set({ auditPK: doc.data().auditPK + 1 }, { merge: true });

            signersArray.forEach((element) => {
              app
                .firestore()
                .collection("audits")
                .doc(`${docName}`)
                .collection("stakeholders")
                .doc(`${element.name}`)
                .set({
                  email: element.email,
                  name: element.name,
                });
            });
          })
          .catch((error) => {
            console.log("Firebase Firestore Error: " + error);
          });
        // sendSignature(payLoadObj);
      });

    app.auth().onAuthStateChanged(async (user) => {
      if (user) {
        return;
      } else {
        location.replace("/auth.html");
      }
    });
  } catch (error) {
    console.error();
  }
});
