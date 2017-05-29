'use strict';

const MOMENT_FORMAT = "MMM DD YYYY @ hh:mm";

var moment = require("moment");

module.exports = function(callbacks) {
  var $ = require("jquery");
  var SyncClient = require("twilio-sync").SyncClient;
  var syncClient;
  var token;
  var auth = "username=trump&pincode=928462";
  var configDocument;

  var cameras = {};

  function loadCameras() {
    var invalidCameras = [];

    for (var member in cameras) delete cameras[member];
    for (var cameraId in configDocument.value.cameras) {
      var camera = configDocument.value.cameras[cameraId];
      if (typeof (camera.name) === "string") {
        console.log("Loaded camera", camera);
        cameras[cameraId] = {
          id: cameraId,
          info: camera
        };
      } else {
        console.warn("Invalid camera configuration, removing from the list: ", cameraId, camera);
        invalidCameras.push(cameraId);
      }
    }

    return invalidCameras;
  }

  return {
  cameras: cameras,

  updateToken: function (cb) {
    var that = this;
    return $.get("/authenticate?" + auth, function (result) {
      if (result.success) {
        console.log("token updated:", result);
        token = result.token;
        if (syncClient) {
            syncClient.updateToken(token);
        } else {
            syncClient = new SyncClient(token);
        }
        if (cb) cb(token);
        setTimeout(that.updateToken.bind(that), result.ttl*1000 * 0.96); // update token slightly in adance of ttl
      } else {
        console.error("failed to authenticate the user: ", result.error);
      }
    }).fail(function (jqXHR, textStatus, error) {
      console.error("failed to send authentication request:", textStatus, error);
      setTimeout(that.updateToken.bind(that), 10000); // retry in 10 seconds
    });
  },

  fetchConfiguration: function () {
    syncClient.document("app.configuration").then(function (doc) {
      configDocument = doc;
      var newDoc = null;
      var invalidCameras;

      if (doc.value.cameras.constructor === Object) {
        invalidCameras = loadCameras();
        if (invalidCameras.length) {
          if (null ===  newDoc) newDoc = $.extend(true, doc.value, {});
          invalidCameras.forEach(function (idOfInvalidCamera) {
            delete newDoc.cameras[idOfInvalidCamera];
          });
        }
      } else {
        console.warn("cameras is not configured, creating an empty list");
        if (null ===  newDoc) newDoc = $.extend(true, doc.value, {});
        newDoc.cameras = {};
      }

      if (newDoc !== null) {
        doc.update(newDoc).then(function () {
            console.log("app configuration updated with new value:", newDoc);
        });
      }

      callbacks.refresh();    
    });
  },

  addCamera: function (newCamera, callback) {
    if (!newCamera.id || !newCamera.id.match(/^[a-zA-Z0-9]+$/)) return callback("camera id is invalid: " + newCamera.id);
    if (!newCamera.name) return callback("camera name is not specified");
    if (!newCamera.contact_number || !newCamera.contact_number.match(/^[0-9]+$/)) return callback("camera contact number is invalid(only digits allowed): " + newCamera.contact_number);
    if (!newCamera.twilio_sim_sid || !newCamera.twilio_sim_sid.match(/^DE[a-z0-9]{32}$/)) return callback("camera sim SID is invalid: " + newCamera.twilio_sim_sid);
    newCamera.created_at = moment().format(MOMENT_FORMAT);

    configDocument.mutate(function (remoteData) {
      if (!remoteData.cameras) remoteData.cameras = {};
      remoteData.cameras[newCamera.id] = newCamera;
      return remoteData;
    }).then(function () {
      loadCameras();
      callback(null, cameras[newCamera.id]);
      callbacks.refresh();    
    }).catch(function (err) {
      callback(err);
    });
  },

  deleteCamera: function (cameraId) {
    configDocument.mutate(function (remoteData) {
      delete remoteData.cameras[cameraId];
      return remoteData;
    }).then(function () {
      loadCameras();
      callbacks.refresh();    
    });
  },

  init: function () {
    var that = this;
    this.updateToken(function (token) {
      that.fetchConfiguration();
    });
  }
  };
};
