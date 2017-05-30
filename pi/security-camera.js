'use strict';

const fs = require('fs');
const request = require('request');

const SyncClient = require('twilio-sync');
const RaspiCam = require("raspicam");
const CV = require('opencv');

const cameraId = 'your-camera-id';
const cameraPin = '12345';
const presenceRefereshInterval = 10000; // in milliseconds

let clientToken;
let clientBootstrapUrl = 'https://your-domain.twil.io/authenticate';
let imageUploadUrl;

let cameraSnapshot;
let cameraAlerts;

let stateCapturing = false;
let statePreviewing = false;
let stateArmed = false;

let captureSettings = {
  width: 640,
  height: 360,
  mode: "timelapse",
  awb: 'cloud',
  output: '/tmp/camera%02d.jpg',
  q: 80,
  rot: 180,
  nopreview: true,
  timeout: 600000,
  timelapse: 200,
  th: "0:0:0"
};

let capturer = new RaspiCam(captureSettings);
let previousImage;

function bootstrapClient(cameraId) {
  return new Promise(resolve => {
    request(clientBootstrapUrl + '?username=' + cameraId + '&pincode=' + cameraPin, (err, res) => {
      let response = JSON.parse(res.body);
      console.log('Got configuration for username:', response.username);
      if (err) {
        throw new Error(res.text);
      }
      resolve(response);
    });
  });
}

function refreshPresence(map) {
  map.set(cameraId, {
    date_updated: new Date().toUTCString(),
    battery_level: 42
  }).then(item => console.log('Reported presence:', item.value));
  setTimeout(refreshPresence, presenceRefereshInterval, map);
}

function updateCameraState(state) {
  statePreviewing = state.preview;
  stateArmed = state.armed;
  if (!stateCapturing && (statePreviewing || stateArmed)) {
    // start capturing images
    console.log("Starting camera capture");
    capturer.start();
    stateCapturing = true;
  } else if (stateCapturing && (!statePreviewing && !stateArmed)) {
    // stop capturing images
    console.log("Stopping camera capture");
    capturer.stop();
    stateCapturing = false;
  }
}

function uploadImage(file, token) {
  return new Promise(resolve => {
    request({
      url: imageUploadUrl,
      method: 'POST',
      body: fs.createReadStream(file),
      headers: {
        'X-Twilio-Token': token,
        'Content-Type': 'image/jpeg'
      }
    }, (err, res) => {
      let response = JSON.parse(res.body);
      if (err) {
        throw new Error(res.text);
      }
      resolve({ media: response, location: res.headers.location });
    });
  });
}

capturer.on("read", function(err, timeStamp, fileName) {
  console.log('Frame captured:', err, timeStamp, fileName);
  if (!fileName.endsWith('~')) {
    let filePath = '/tmp/' + fileName;
    uploadImage(filePath, clientToken).then(res => {
      console.log('Uploaded:', res.media.sid, res.location);
      cameraSnapshot.set({
        date_captured: new Date(timeStamp).toUTCString(),
        mcs_sid: res.media.sid,
        mcs_url: res.location
      });
    });
    CV.readImage(filePath, (err, im) => {
      console.log('CV loaded:', filePath, im)
      if (previousImage && im.width() > 1 && im.height() > 1) {
        CV.ImageSimilarity(im, previousImage, function (err, dissimilarity) {
          console.log('Dissimilarity:', dissimilarity);
          previousImage = im;
        });
      } else {
        previousImage = im;
      }
    });
  }
});

capturer.on("exit", function(timestamp) {
  console.log('Stopping camera timelapse')
  capturer.stop();
});

bootstrapClient(cameraId)
  .then(function(config) {
    imageUploadUrl = config.upload_url;
    clientToken = config.token;
    return new SyncClient(config.token);
  })
  .then(client => {
    client.map('camera.presence').then(map => {
      console.log('Camera presense map:', map.sid);
      refreshPresence(map);
    });
    client.document('cameras.' + cameraId + '.snapshot').then(doc => {
      console.log('Snapshot document:', doc.sid);
      cameraSnapshot = doc;
    });
    client.document('cameras.' + cameraId + '.control').then(doc => {
      console.log('Control document:', doc.sid);
      updateCameraState(doc.value);
      doc.on('updated', value => {
        console.log('Remote control:', value);
        updateCameraState(value);
      });
    });
    client.list('cameras.' + cameraId + '.alerts').then(list => {
      console.log('Alert list:', list.sid);
      cameraAlerts = list;
    });
  })
  .catch(function(error) {
    console.error("Failed initializing:", error);
  });
