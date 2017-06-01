'use strict';

const fs = require('fs');
const request = require('request');

const SyncClient = require('twilio-sync');
const RaspiCam = require("raspicam");
const CV = require('opencv');

const cameraId = 'your-camera-id';
const cameraPin = 'your-camera-token';

let config;
let clientBootstrapUrl = 'https://your-domain.twil.io/cameraauthenticate';

let cameraSnapshot;
let stateCapturing = false;
let statePreviewing = false;
let stateArmed = false;

let pendingAlarm = -1;
let respondedAlarm = -1;

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
    request(clientBootstrapUrl + '?camera_id=' + cameraId + '&camera_token=' + cameraPin, (err, res) => {
      let response = JSON.parse(res.body);
      console.log('Got configuration for camera:', response.camera_id);
      if (err) {
        throw new Error(res.text);
      }
      resolve(response);
    });
  });
}

function updateCameraState(item) {
  switch (item.key) {
    case 'preview':
      statePreviewing = item.value.enabled;
      break;
    case 'arm':
      stateArmed = item.value.enabled;
      respondedAlarm = item.value.responded_alarm;
      break;
    case 'alarm':
      pendingAlarm = item.value.id;
      break;
  }
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
      url: config.links.upload_url,
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
    CV.readImage(filePath, (err, im) => {
      console.log('CV loaded:', filePath, im)
      if (previousImage && im.width() > 1 && im.height() > 1) {
        CV.ImageSimilarity(im, previousImage, function (err, dissimilarity) {
          console.log('Dissimilarity:', dissimilarity);
          previousImage = im;

          let changesDetected = dissimilarity > 0; // silly change detector
          // upload the image either if the preview is enabled
          // or the image has artifacts and an unresponded alarm is pending
          if (statePreviewing || changesDetected || pendingAlarm != respondedAlarm) {

            uploadImage(filePath, config.token).then(res => {
              console.log('Uploaded:', res.media.sid, res.location);
              cameraSnapshot.set({
                date_captured: new Date(timeStamp).toUTCString(),
                mcs_sid: res.media.sid,
                mcs_url: res.location,
                traits: { changes_detected: changesDetected }
              });
            });
          }
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
  .then(function(cfg) {
    config = cfg;
    return new SyncClient(config.token);
  })
  .then(client => {
    client.document(config.sync_objects.camera_snapshot_document).then(doc => {
      console.log('Snapshot document:', doc.sid);
      cameraSnapshot = doc;
    });
    client.map(config.sync_objects.camera_control_map).then(map => {
      console.log('Control map:', map.sid);
      map.get('arm')
        .then(item => updateCameraState(item))
        .catch(e => map.set('arm', { enabled: false }));
      map.get('preview')
        .then(item => updateCameraState(item))
        .catch(e => map.set('preview', { enabled: false }));
      map.get('alarm')
        .then(item => updateCameraState(item))
        .catch(e => console.log('Alarm state not initialized!'));
      map.on('itemUpdated', item => {
        console.log('Remote control:', item.key, item.value);
        updateCameraState(item);
      });
    });
  })
  .catch(function(error) {
    console.error("Failed initializing:", error);
  });
