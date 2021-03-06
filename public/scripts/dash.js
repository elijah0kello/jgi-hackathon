document.addEventListener("DOMContentLoaded", () => {
  try {
    let app = firebase.app();
    // Get a reference to the storage service, which is used to create references in your storage bucket
    var storage = firebase.storage();
    // storage.useEmulator("localhost", 9199);

    // Create a storage reference from our storage service
    var storageRef = storage.ref();

    // Function to send reply
    function sendFeedBack(email, id) {
      document.getElementById("messageSubmitBTN").className = "fa fa-spinner";
      var docName = Date.now();
      app
        .firestore()
        .collection("environment")
        .doc("feedback")
        .get()
        .then((doc) => {
          app
            .firestore()
            .collection("feedBackItems")
            .doc(`${docName} comment ${email}`)
            .set({
              audit: id,
              comment: document.getElementById("messageReply").value,
              id: doc.data().feedbackPK + 1,
              isBeingSentToInitiator: false,
              sender: email,
              time: Date.now(),
            });

          app
            .firestore()
            .collection("environment")
            .doc("feedback")
            .set({
              feedbackPK: doc.data().feedbackPK + 1,
            });
          setTimeout(() => {
            location.replace("/dashboard.html");
          }, 4000);
        })
        .catch((error) => {
          console.log(error);
        });
    }
    // Event handler to close messages
    document.getElementById("close-message").addEventListener("click", () => {
      document.getElementById("feedbacker-viewer").hidden = true;
      document.getElementById("feedback-list-div").hidden = false;
      document.getElementById("messageViewer").hidden = true;
      document
        .getElementById("sendout-Final-Container")
        .querySelectorAll("div.message-input-container")
        .forEach((element) => {
          element.remove();
        });
    });
    // Event handler to cloz message
    document.getElementById("cloz-message").addEventListener("click", () => {
      document.getElementById("messageViewer").hidden = true;
      document.getElementById("feedback-list-div").hidden = false;
      document.getElementById("feedbacker-viewer").hidden = true;
      document
        .getElementById("sendout-Final-Container")
        .querySelectorAll("div.message-input-container")
        .forEach((element) => {
          element.remove();
        });
    });
    // show message list
    function showMessageList(id) {
      document
        .getElementById("feedback-list-div")
        .querySelectorAll("p,a.final-audit")
        .forEach((element) => {
          element.remove();
        });

      document
        .getElementById("sendout-Final-Container")
        .querySelectorAll("div.message-input-container")
        .forEach((element) => {
          element.remove();
        });

      document.getElementById("messageViewer").hidden = true;
      document.getElementById("feedback-list-div").hidden = false;
      document.getElementById("feedbacker-viewer").hidden = true;

      var feedbackHead = document.createElement("p");
      feedbackHead.innerHTML = "FEEDBACK FROM STAKEHOLDERS";
      feedbackHead.className = "auditHeading";
      document.getElementById("feedback-list-div").appendChild(feedbackHead);
      var linkToAudit = document.createElement("a");
      linkToAudit.href = "./map.html";
      linkToAudit.className = "final-audit";
      linkToAudit.target = "_blank";
      linkToAudit.innerHTML = `Send out Final Envelope <i class="bi bi-arrow-up-right-square-fill"></i>`;
      document.getElementById("feedback-list-div").appendChild(linkToAudit);

      app
        .firestore()
        .collection("docNames")
        .where("id", "==", id)
        .get()
        .then((docSnaphot) => {
          docSnaphot.forEach((element) => {
            app
              .firestore()
              .collection("audits")
              .doc(`${element.data().docName}`)
              .collection("stakeholders")
              .get()
              .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                  // console.log(doc.data());
                  var MyfeedbackmessageDiv = document.createElement("div");
                  MyfeedbackmessageDiv.className =
                    "audit-message-container-feedback";
                  var spandataHolder = document.createElement("span");
                  spandataHolder.innerHTML = doc.data().email;
                  spandataHolder.hidden = true;
                  var feedBackSpan = document.createElement("p");
                  feedBackSpan.className = "feedback-item";
                  feedBackSpan.innerHTML = `${doc.data().name} | ${
                    doc.data().email
                  }`;
                  var feedBackIcon = document.createElement("i");
                  feedBackIcon.className = "bi bi-dot";
                  feedBackSpan.appendChild(feedBackIcon);
                  feedBackSpan.appendChild(spandataHolder);
                  MyfeedbackmessageDiv.appendChild(feedBackSpan);
                  document
                    .getElementById("feedback-list-div")
                    .appendChild(MyfeedbackmessageDiv);
                  MyfeedbackmessageDiv.addEventListener("click", () => {
                    showMessageDetail(spandataHolder.innerHTML, id);
                  });
                });
              })
              .catch((error) => {
                console.log(error);
              });
          });
        })
        .catch((error) => {
          console.log(error);
        });
    }
    // Messaging detail logic
    function showMessageDetail(email, id) {
      // remove the previous elements
      document
        .getElementById("messageViewer")
        .querySelectorAll("div,p,a.final-audit")
        .forEach((element) => {
          element.remove();
        });
      document
        .getElementById("sendout-Final-Container")
        .querySelectorAll("div.message-input-container")
        .forEach((element) => {
          element.remove();
        });
      // hide the unneeded divs
      document.getElementById("messageViewer").hidden = false;
      document.getElementById("feedback-list-div").hidden = true;
      document.getElementById("feedbacker-viewer").hidden = true;

      // Print the name of AUDIT
      app
        .firestore()
        .collection("audits")
        .where("id", "==", id)
        .get()
        .then((snapShot) => {
          snapShot.forEach((doc) => {
            var auditHeading = document.createElement("p");
            auditHeading.className = "auditHeading";
            auditHeading.innerHTML = doc.data().name;
            document.getElementById("messageViewer").appendChild(auditHeading);
          });
        })
        .catch((error) => {
          console.log(error);
        });
      // Display the messages
      app
        .firestore()
        .collection("feedBackItems")
        .where("sender", "==", email)
        .get()
        .then((snapShot) => {
          snapShot.forEach((doc) => {
            if (doc.data().audit == id) {
              if (doc.data().isBeingSentToInitiator) {
                var messageDiv = document.createElement("div");
                messageDiv.className = "audit-message-container-me";
                var message = document.createElement("p");
                message.innerHTML = doc.data().comment;
                message.className = "audit-message";
                messageDiv.appendChild(message);
                var fileRef = storageRef.child(`${doc.data().fileName}`);
                fileRef
                  .getDownloadURL()
                  .then((url) => {
                    var fileLink = document.createElement("a");
                    fileLink.href = url;
                    fileLink.target = "_blank";
                    fileLink.innerHTML = `<br>View Edits <i class="bi bi-arrow-up-right-square-fill"></i>`;
                    fileLink.className = "audit-message-link";
                    message.appendChild(fileLink);
                  })
                  .catch((error) => {
                    console.log(error);
                  });
                document
                  .getElementById("messageViewer")
                  .appendChild(messageDiv);
              } else {
                var messageDiv = document.createElement("div");
                messageDiv.className = "audit-message-container";
                var message = document.createElement("p");
                message.innerHTML = doc.data().comment;
                message.className = "audit-message";
                messageDiv.appendChild(message);
                document
                  .getElementById("messageViewer")
                  .appendChild(messageDiv);
              }
            }
          });
        })
        .catch((error) => {
          console.log(error);
        });

      var messageInputContainer = document.createElement("div");
      messageInputContainer.className = "message-input-container";
      messageInputContainer.id = "messageInputContainer";
      var messageInput = document.createElement("input");
      messageInput.placeholder = "Your Reply";
      messageInput.type = "text";
      messageInput.id = "messageReply";
      messageInput.className = "message-reply";
      var messageSubmitBTN = document.createElement("i");
      messageSubmitBTN.id = "messageSubmitBTN";
      messageSubmitBTN.className = "bi bi-telegram";
      var messageDataHolder = document.createElement("span");
      messageDataHolder.hidden = true;
      messageDataHolder.innerHTML = `${email}`;
      messageDataHolder.id = `${id}`;
      messageSubmitBTN.addEventListener("click", () => {
        sendFeedBack(messageDataHolder.innerHTML, messageDataHolder.id);
      });
      messageInputContainer.appendChild(messageInput);
      messageInputContainer.appendChild(messageSubmitBTN);
      document
        .getElementById("sendout-Final-Container")
        .appendChild(messageInputContainer);
    }

    // show user chat
    function showMyChat(id) {
      document
        .getElementById("feedbacker-viewer")
        .querySelectorAll("div,a.final-audit")
        .forEach((element) => {
          element.remove();
        });

      document
        .getElementById("sendout-Final-Container")
        .querySelectorAll("div.message-input-container")
        .forEach((element) => {
          element.remove();
        });

      document.getElementById("messageViewer").hidden = true;
      document.getElementById("feedback-list-div").hidden = true;
      document.getElementById("feedbacker-viewer").hidden = false;

      app
        .firestore()
        .collection("feedBackItems")
        .where("audit", "==", id)
        .get()
        .then((snapShot) => {
          snapShot.forEach((element) => {
            if (element.data().sender == app.auth().currentUser.email) {
              if (element.data().isBeingSentToInitiator) {
                var MymessageDiv = document.createElement("div");
                MymessageDiv.className = "audit-message-container-me";
                var Mymessage = document.createElement("p");
                Mymessage.innerHTML = element.data().comment;
                Mymessage.className = "audit-message";
                MymessageDiv.appendChild(Mymessage);
                var fileRef = storageRef.child(`${element.data().fileName}`);
                fileRef
                  .getDownloadURL()
                  .then((url) => {
                    var MyfileLink = document.createElement("a");
                    MyfileLink.href = url;
                    MyfileLink.target = "_blank";
                    MyfileLink.innerHTML = `<br>View Edits <i class="bi bi-arrow-up-right-square-fill"></i>`;
                    MyfileLink.className = "audit-message-link";
                    Mymessage.appendChild(MyfileLink);
                  })
                  .catch((error) => {
                    console.log(error);
                  });
                document
                  .getElementById("feedbacker-viewer")
                  .appendChild(MymessageDiv);
              } else {
                var MessageDiv = document.createElement("div");
                MessageDiv.className = "audit-message-container";
                var Message = document.createElement("p");
                Message.innerHTML = element.data().comment;
                Message.className = "audit-message";
                MessageDiv.appendChild(Message);
                var fileRef = storageRef.child(`${element.data().fileName}`);
                fileRef
                  .getDownloadURL()
                  .then((url) => {
                    var FileLink = document.createElement("a");
                    FileLink.href = url;
                    FileLink.target = "_blank";
                    FileLink.innerHTML = `<br>View Edits <i class="bi bi-arrow-up-right-square-fill"></i>`;
                    FileLink.className = "audit-message-link";
                    Message.appendChild(FileLink);
                  })
                  .catch((error) => {
                    console.log(error);
                  });
                document
                  .getElementById("feedbacker-viewer")
                  .appendChild(MessageDiv);
              }
            }
          });
        })
        .catch((error) => {
          console.log(error);
        });
    }
    // Add the data to the ongoing and complete list
    app
      .firestore()
      .collection("audits")
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          if (doc.data().isComplete) {
            var doneListItem = document.createElement("p");
            doneListItem.innerHTML = doc.data().name;
            doneListItem.id = "doneListItem";
            doneListItem.className = "li-cont-p";
            var dataHolder = document.createElement("span");
            dataHolder.innerHTML = doc.data().id;
            dataHolder.id = `audit-${doc.data().id}`;
            dataHolder.hidden = true;
            doneListItem.appendChild(dataHolder);
            document
              .getElementById("doneListContainer")
              .appendChild(doneListItem);
          } else if (doc.data().initiator != app.auth().currentUser.email) {
            var pendingListItem = document.createElement("p");
            pendingListItem.innerHTML = doc.data().name;
            pendingListItem.id = "doneListItem";
            pendingListItem.className = "li-cont";
            var DataHolder = document.createElement("span");
            DataHolder.innerHTML = doc.data().id;
            DataHolder.id = `audit-${doc.data().id}`;
            DataHolder.hidden = true;
            pendingListItem.appendChild(DataHolder);
            document
              .getElementById("pendingListContainer")
              .appendChild(pendingListItem);
            pendingListItem.addEventListener("click", () => {
              showMyChat(DataHolder.innerHTML);
            });
          }
        });
      })
      .catch((error) => {
        console.log(error);
      });

    // Add data to the my audits list
    app
      .firestore()
      .collection("audits")
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          if (
            doc.data().isComplete == false &&
            doc.data().initiator == app.auth().currentUser.email
          ) {
            var mypendingListItem = document.createElement("p");
            mypendingListItem.innerHTML = doc.data().name;
            mypendingListItem.id = "doneListItem";
            mypendingListItem.className = "li-cont";
            var myDataHolder = document.createElement("span");
            myDataHolder.innerHTML = doc.data().id;
            myDataHolder.id = `audit-mine${doc.data().id}`;
            myDataHolder.hidden = true;
            mypendingListItem.appendChild(myDataHolder);
            document
              .getElementById("yourPendingAudits")
              .appendChild(mypendingListItem);
            mypendingListItem.addEventListener("click", () => {
              showMessageList(doc.data().id);
            });
          }
        });
      })
      .catch((error) => {
        console.log(error);
      });
    // logout event handler
    document.getElementById("logoutTrigger").addEventListener("click", () => {
      app
        .auth()
        .signOut()
        .then(() => {
          // Sign-out successful.
          console.log("Sign out Successful");
          location.replace("/auth.html");
        })
        .catch((error) => {
          // An error happened.
          console.log(error);
        });
    });

    app.auth().onAuthStateChanged((user) => {
      if (user) {
        document.getElementById("username").innerHTML = `${user.displayName}`;
        document.getElementById("useremail").innerHTML = user.email;
        return;
      } else {
        location.replace("/auth.html");
      }
    });
  } catch (error) {
    console.log(error);
  }
});
