'use strict';

const fs = require('fs');
const request = require('request');
const uuid = require('uuid/v4');

const TwilioCommon = require('twilio-common');
const SyncClient = require('twilio-sync');
const RaspiCam = require("raspicam");
const CV = require('opencv');

const cameraId = 'your-camera-id';
const cameraSecret = 'your-camera-secret';
const clientBootstrapUrl = 'https://your-domain.twil.io/cameraauthenticate';
const imageDirectory = '/home/pi/camera/images/';

let accessManager;
let config;

let cameraSnapshot;
let stateCapturing = false;
let statePreviewing = false;
let stateArmed = false;

let pendingAlarm = -1;
let respondedAlarm = -1;

let captureSettings = {
  width: 640, height: 360,
  mode: "timelapse",
  awb: 'cloud',
  output: imageDirectory + 'camera%03d.jpg',
  q: 80, rot: 180, th: '0:0:0',
  nopreview: true,
  timeout: 1800000,  // camera runs for 30 minutes by default
  timelapse: 250     // camera runs at roughly 4 fps
};

let capturer = new RaspiCam(captureSettings);
let previousImage;

function bootstrapClient(id, secret) {
  return new Promise(resolve => pollConfiguration(id, secret, resolve));
}

function pollConfiguration(id, secret, resolve) {
  request(clientBootstrapUrl + '?camera_id=' + id + '&camera_token=' + secret, (err, res) => {
    if (!err) {
      let response = JSON.parse(res.body);
      console.log('Got configuration for camera:', response.camera_id);
      resolve(response);
    } else {
      console.log('Failed fetching camera configuration:', err);
      setTimeout(() => pollConfiguration(id, secret, resolve), 2000);
    }
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
      qs: {
        MessageSid: 'ME' + uuid().replace(/-/g, ''),
        ChannelSid: cameraSnapshot.sid
      },
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
    let filePath = imageDirectory + fileName;
    CV.readImage(filePath, (err, im) => {
      console.log('CV loaded:', filePath, im)
      if (previousImage && im.width() > 1 && im.height() > 1) {
        CV.ImageSimilarity(im, previousImage, function (err, dissimilarity) {
          console.log('Dissimilarity:', dissimilarity);
          previousImage = im;

          let changesDetected = dissimilarity > 0; // silly change detector
          if (statePreviewing || changesDetected || pendingAlarm != respondedAlarm) {
            // upload the image either if the preview is enabled
            // or the image has artifacts and an unresponded alarm is pending
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

bootstrapClient(cameraId, cameraSecret)
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
    accessManager = new TwilioCommon.AccessManager(config.token);
    accessManager.on('tokenUpdated', am => {
      config.token = am.token;
      client.updateToken(am.token);
    });
    accessManager.on('tokenExpired', () => {
      bootstrapClient(cameraId, cameraSecret)
        .then(cfg => accessManager.updateToken(cfg.token));
    });
  })
  .catch(function(error) {
    console.error("Failed initializing:", error);
  });
