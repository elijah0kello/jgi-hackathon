document.addEventListener("DOMContentLoaded", () => {
  try {
    let app = firebase.app();
    app
      .firestore()
      .collection("audits")
      .where("isComplete", "==", false)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          // doc.data() is never undefined for query doc snapshots
          // console.log(doc.id, " => ", doc.data());
          var optionElement = document.createElement("option");
          optionElement.value = doc.data().id;
          optionElement.innerHTML = doc.data().name;
          document.getElementById("audit").appendChild(optionElement);
        });
      })
      .catch((error) => {
        console.log("Error getting documents: ", error);
      });
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
    // submit feedback
    document.getElementById("submitSignerCTA").addEventListener("click", () => {
      document.getElementById("submitSignerCTA").innerHTML = "Sending...";
      var comment = document.getElementById("initiatorName").value;
      var audit = document.getElementById("audit").value;
      var sender = app.auth().currentUser.email;

      var docDate = Date.now();
      var docName = JSON.stringify(docDate);
      app
        .firestore()
        .collection("environment")
        .doc("feedback")
        .get()
        .then((doc) => {
          app
            .firestore()
            .collection("feedBackItems")
            .doc(`${docName} comment ${sender}`)
            .set({
              id: doc.data().feedbackPK + 1,
              comment: comment,
              audit: audit,
              sender: sender,
              fileName: fileName,
              isBeingSentToInitiator: true,
              time: Date.now(),
            });

          app
            .firestore()
            .collection("environment")
            .doc("feedback")
            .set({ feedbackPK: doc.data().feedbackPK + 1 });
          setTimeout(() => {
            location.replace("/dashboard.html");
          }, 4000);
        })
        .catch((error) => {
          console.log(error);
        });
    });
  } catch (error) {
    console.log(error);
  }
});
