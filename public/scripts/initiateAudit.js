document.addEventListener("DOMContentLoaded", function () {
  try {
    // initialise firebase
    let app = firebase.app();

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
        newEmailInput.placeholder = "Add another Signer's Email";
        newEmailInput.className = "email-input";

        newNameInput.type = "text";
        newNameInput.id = "signerName";
        newNameInput.placeholder = "Add another Signer's Name";
        newNameInput.className = "name-input";

        divContainer.className = "signerData";
        divContainer.appendChild(newEmailInput);
        divContainer.appendChild(newNameInput);

        document.getElementById("signers-container").appendChild(divContainer);
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
          if (nodeCollection[i].nodeName == "DIV") {
            for (var j = 0; j < nodeCollection[i].childNodes.length; j++) {
              // console.log("Inner Div loop iteration" + i);
              if (nodeCollection[i].childNodes[j].nodeName == "INPUT") {
                var signerEmail, signerName;
                if (nodeCollection[i].childNodes[j].id == "signerEmail") {
                  console.log(
                    "Signer Email: " + nodeCollection[i].childNodes[j].value
                  );
                  console.log(i);
                  signerEmail = nodeCollection[i].childNodes[j].value;
                } else if (nodeCollection[i].childNodes[j].id == "signerName") {
                  console.log(
                    "Signer Name: " + nodeCollection[i].childNodes[j].value
                  );
                  console.log(i);
                  signerName = nodeCollection[i].childNodes[j].value;
                  signersArray.push({ email: signerEmail, name: signerName });
                }
              } else {
                continue;
              }
            }
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
        // // call the sendSignature function
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
