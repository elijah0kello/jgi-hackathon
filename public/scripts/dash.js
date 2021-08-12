document.addEventListener("DOMContentLoaded", () => {
  try {
    let app = firebase.app();
    // Get a reference to the storage service, which is used to create references in your storage bucket
    var storage = firebase.storage();
    storage.useEmulator("localhost", 9199);

    // Create a storage reference from our storage service
    var storageRef = storage.ref();
    // Event handler to close messages
    document.getElementById("close-message").addEventListener("click", () => {
      document.getElementById("messageViewer").hidden = true;
      document.getElementById("feedback-list-div").hidden = false;
    });

    // show message list
    function showMessageList(id) {
      document
        .getElementById("feedback-list-div")
        .querySelectorAll("p")
        .forEach((element) => {
          element.remove();
        });

      document.getElementById("messageViewer").hidden = true;
      document.getElementById("feedback-list-div").hidden = false;
      document.getElementById("feedbacker-viewer").hidden = true;

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
                  var spandataHolder = document.createElement("span");
                  spandataHolder.innerHTML = doc.data().email;
                  spandataHolder.hidden = true;
                  var feedBackSpan = document.createElement("p");
                  feedBackSpan.className = "feedback-item";
                  feedBackSpan.innerHTML = doc.data().name;
                  var feedBackIcon = document.createElement("i");
                  feedBackIcon.className = "bi bi-dot";
                  feedBackSpan.appendChild(feedBackIcon);
                  feedBackSpan.appendChild(spandataHolder);
                  document
                    .getElementById("feedback-list-div")
                    .appendChild(feedBackSpan);
                  feedBackSpan.addEventListener("click", () => {
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
      document
        .getElementById("messageViewer")
        .querySelectorAll("div")
        .forEach((element) => {
          element.remove();
        });

      document.getElementById("messageViewer").hidden = false;
      document.getElementById("feedback-list-div").hidden = true;
      document.getElementById("feedbacker-viewer").hidden = true;

      app
        .firestore()
        .collection("feedBackItems")
        .where("sender", "==", email)
        .get()
        .then((snapShot) => {
          snapShot.forEach((doc) => {
            if (doc.data().audit == id) {
              var messageDiv = document.createElement("div");
              messageDiv.className = "audit-message-container";
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
              document.getElementById("messageViewer").appendChild(messageDiv);
            }
          });
        })
        .catch((error) => {
          console.log(error);
        });
    }

    // show user chat
    function showMyChat(id) {
      document
        .getElementById("feedbacker-viewer")
        .querySelectorAll("div")
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
                  .getElementById("feedbacker-viewer")
                  .appendChild(messageDiv);
              } else {
                var messageDiv = document.createElement("div");
                messageDiv.className = "audit-message-container";
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
                  .getElementById("feedbacker-viewer")
                  .appendChild(messageDiv);
              }
            }
          });
        })
        .catch((error) => {});
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
          } else {
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
