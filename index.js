/**********************************************
 * Checklist
 * ==================================
 * - [x] import packages
 * - [x] implement the middleware
 * - [x] select element
 *      - [x] js function
 * - [x] set up routes
 *      - [x] get route
 *      - [x] post route
 *      - [x] get image route
 *      - [x] get download route
 * - [x] readFile and writeFile function
 *      - [x] allows us to interact with our file system
 *      - [x] enables us to upload / download files from our directory
 ***********************************************/

// Import packages
const express = require("express");
const bodyParser = require("body-parser");
const expressFileUpload = require("express-fileupload");
// In built
const fs = require("fs");
const path = require("path");
// Set up express
const app = express();
// Port
const port = 3000;
// Uploaded directory
const uploadDirectory =
   __dirname + "/uploaded";

// implement the middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
    expressFileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    })
);
// Static pages
app.use(express.static("uploaded"));
// Records of files accessed before
let caches = {};

// Get route
app.get("/", (request, response) => {
    response.sendFile(__dirname + "/index.html");
  });
  // Write data to a file
  function writeFile(name, body) {
    return new Promise((resolve, reject) => {
      // fs.writeFile(location (x), body, callback)
      fs.writeFile(uploadDirectory + name, body, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(name);
        }
      });
    }).then(readFile);
  }

// Read the contents of the file
function readFile(name) {
    return new Promise((resolve, reject) => {
      // readfile(directoryname, callback)
      fs.readFile(uploadDirectory + name, (err, data) => {
        if (err) {
          console.log("error", err);
          reject(err);
        } else {
          resolve(data);
        }
      });
    }).catch((error) => {
      console.log("error", error);
    });
  }

  app.post("/files", (request, response) => {
    let file = request.files.dropbox;
    console.log("File received", file);
    console.log("Getting files in backend", file);
    // if there is more than one file to be uploaded
    if (file instanceof Array) {
      // loop through each item, grab the name and the data
      for (let i = 0; i < file.length; i++) {
        // writeFile promise to write the name and the data
        let fileName = file[i].name;
        let fileData = file[i].data;
        caches[fileName] = writeFile(fileName, fileData);
        caches[fileName].then((object) => {
          console.log("it works", object);
          response.send("it works!");
        });
      }
    } else {
      // if it's not an array
      let fileName = file.name;
      let fileData = file.data;
      // saving the filename and the data into our cache
      caches[fileName] = writeFile(fileName, fileData);
      caches[fileName]
        .then((object) => {
          console.log("it works");
          // #TODO: try send object back later
          response.send("it works!");
        })
        .catch((error) => {
          console.log("error", error);
        });
      // call the write file function
    }
  });

  app.get("/uploaded/:fileName", (request, response) => {
    let name = request.params.fileName;
    response.sendFile(path.join(__dirname, "uploaded", name));
  });
  
  // allows me to download that file onto my computer
  app.get("/cache/:name", (request, response) => {
    let url = request.params.name;
    caches[request.params.name] = readFile(
      request.params.name
    );
    caches[request.params.name]
      .then((data) => {
        response.send(data);
      })
      .catch((error) => {
        response.send(error);
      });
  });

  app.get("/download/:name", (request, response) => {
    let url = request.params.name;
    let object = {};
    readFile(request.params.name).then((object) => {
      response.send(object);
    });
  });
  
  app.listen(port, () => {
    console.log(`app listening on port ${port}`);
  });