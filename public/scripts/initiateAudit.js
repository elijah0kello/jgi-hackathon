document.addEventListener("DOMContentLoaded", function () {
  try {
    // initialise firebase
    let app = firebase.app();

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
        newNameInput.placeholder = "Another Stakeholder's Name";
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
        url: "http://localhost:5001/master-bruin-319711/us-central1/initiateSigning",
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Headers": "*",
        },
        data: data,
      };

      axios(config)
        .then(function (response) {
          console.log(JSON.stringify(response.data));
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
        console.log(JSON.stringify(payLoadObj));
        // call the sendSignature function
        sendSignature(payLoadObj);
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
