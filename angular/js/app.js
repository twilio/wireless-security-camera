'use strict';

const APP_CONFIGURATION_DOCUMENT_NAME = "app.configuration";
function CAMERA_SNAPSHOT_DOCUMENT_NAME(cameraId) { return "cameras." + cameraId + ".snapshot"; }
function CAMERA_CONTROL_MAP_NAME(cameraId) { return "cameras." + cameraId + ".control"; }
function CAMERA_ALERTS_LIST_NAME(cameraId) { return "cameras." + cameraId + ".alerts"; }
function CAMERA_ARCHIVES_LIST_NAME(cameraId, alertId) { return "cameras." + cameraId + ".archives." + alertId; }

module.exports = function(callbacks) {
  const $ = require("jquery");
  const crypto = require("crypto");
  const SyncClient = require("twilio-sync").SyncClient;
  var syncClient;
  var token;
  var auth = "username=twilio&pincode=928462";
  var configDocument;

  var cameras = {};

  function randomString(len) {
      var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      var randomString = '';
      for (var i = 0; i < len; i++) {
          var randomPoz = Math.floor(Math.random() * charSet.length);
          randomString += charSet.substring(randomPoz,randomPoz+1);
      }
      return randomString;
  }

  function fetchSnapshotTmpUrl(mcs_url, callback) {
    $.ajax({
      type: "GET",
      url: mcs_url,
      dataType: 'json',
      beforeSend: function (xhr) { xhr.setRequestHeader('X-Twilio-Token', token); },
      success: function (data, status, xhr) {
        callback(data.links.content_direct_temporary);
      }
    });
  }

  function fetchCameraSnapshotTmpUrl(camera) {
    fetchSnapshotTmpUrl(camera.snapshot.mcs_url, function (snapshotTmpUrl) {
        camera.snapshot.img_url = snapshotTmpUrl;
        callbacks.refresh();
    });
  }

  function fetchSnapshot(camera) {
    syncClient.document(CAMERA_SNAPSHOT_DOCUMENT_NAME(camera.info.id)).then(function (doc) {
      camera.snapshotDocument = doc;
      camera.snapshot = doc.value;
      fetchCameraSnapshotTmpUrl(camera);
      doc.on("updated", function (data) {
        console.log("camera snapshot updated", camera.info.id, JSON.stringify(data));
        camera.snapshot = data;
        fetchCameraSnapshotTmpUrl(camera);
      });
    });
  }

  function fetchControl(camera) {
    syncClient.map(CAMERA_CONTROL_MAP_NAME(camera.info.id)).then(function (map) {
      Promise.all([
        map.get("preview"),
        map.get("alarm"),
        map.get("arm")
      ]).then(function (items) {
        camera.controlMap = map;
        camera.control = {
          preview : items[0].value,
          alarm : items[1].value,
          arm : items[2].value,
        };
        console.log("camera control fetched", camera.info.id, JSON.stringify(camera.control));
        map.on("itemUpdated", function (data) {
          console.log("camera control updated", camera.info.id, data.key, JSON.stringify(data.value));
          camera.control[data.key] = data.value;
          callbacks.refresh();
        });
        callbacks.refresh();
      });
    });
  }

  function loadCameras() {
    var invalidCameras = [];

    for (var cameraId in configDocument.value.cameras) {
      var camera = configDocument.value.cameras[cameraId];
      if (camera.id === cameraId &&
          typeof (camera.name) === "string" &&
          typeof(camera.contact_number) === "string" &&
          typeof(camera.twilio_sim_sid) === "string") {
        if (cameraId in cameras) {
          if (camera.name !== cameras[cameraId].info.name ||
              camera.contact_number !== cameras[cameraId].info.contact_number ||
              camera.twilio_sim_sid !== cameras[cameraId].info.twilio_sim_sid) {
            console.log("Updating camera", camera);
            cameras[cameraId].info = camera;
          }
        } else {
          console.log("Loading new camera", camera);
          cameras[cameraId] = {
            info: camera
          };
          fetchSnapshot(cameras[cameraId]);
          fetchControl(cameras[cameraId]);
        }
      } else {
        console.warn("Invalid camera configuration, removing from the list: ", cameraId, camera);
        invalidCameras.push(cameraId);
      }
    }
    for (var cameraId in cameras) {
      if (!(cameraId in configDocument.value.cameras)) {
        console.log("Deleting camera", camera);
        if (cameras[cameraId].snapshotDocument) {
          cameras[cameraId].snapshotDocument.removeAllListeners('updated');
        }
        if (cameras[cameraId].controlMap) {
          cameras[cameraId].controlMap.removeAllListeners('itemUpdated');
        }
        delete cameras[cameraId];
      }
    }

    return invalidCameras;
  }

  function cameraInfoCheck(camera, callback) {
    if (!camera.id || !camera.id.match(/^[a-zA-Z0-9]+$/))  { callback("camera id is invalid: " + camera.id); return false; }
    if (!camera.name) { callback("camera name is not specified"); return false; }
    if (!camera.contact_number || !camera.contact_number.match(/^[0-9]+$/)) { callback("camera contact number is invalid(only digits allowed): " + camera.contact_number); return false; }
    if (!camera.twilio_sim_sid || !camera.twilio_sim_sid.match(/^DE[a-z0-9]{32}$/)) { callback("camera sim SID is invalid: " + camera.twilio_sim_sid); return false; }
    return true;
  }

  function genToken() {
    var token = randomString(16);
    var hash = crypto.createHash('sha512').update(token).digest("hex");
    return { token: token, hash: hash };
  }

  return {
  initialized: $.Deferred(),

  cameras: cameras,

  updateToken: function (cb) {
    var that = this;
    return $.get("/userauthenticate?" + auth, function (result) {
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
    return syncClient.document(APP_CONFIGURATION_DOCUMENT_NAME).then(function (doc) {
      configDocument = doc;
      var newDoc = null;
      var invalidCameras;

      if (doc.value.cameras) {
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
      return newDoc;
    }).then(function (newDoc) {
      if (newDoc !== null) {
        return configDocument.set(newDoc).then(function () {
          console.log("app configuration updated with new value:", newDoc);
        });
      }
    });
  },

  addCamera: function (newCamera, callback) {
    if (!cameraInfoCheck(newCamera, callback)) return;
    if (newCamera.id in configDocument.value.cameras) return callback("Camera with the same ID exists");
    newCamera.created_at = (new Date()).getTime();

    var t = genToken();
    newCamera.hash = t.hash;

    configDocument.mutate(function (remoteData) {
      if (!remoteData.cameras) remoteData.cameras = {};
      remoteData.cameras[newCamera.id] = newCamera;
      return remoteData;
    }).then(function () {
      // create necessary objects
      return Promise.all([
        syncClient.map(CAMERA_CONTROL_MAP_NAME(newCamera.id)).then(function (controlMap) {
          return Promise.all[
            controlMap.set('alarm', { id: -1 }),
            controlMap.set('arm', { enabled: true, responded_alarm: -1}),
            controlMap.set('preview', { enabled : false })
          ];
        }),
        syncClient.list(CAMERA_ALERTS_LIST_NAME(newCamera.id)),
      ]);
    }).then(function () {
      loadCameras();
      // make token temporarily visible
      callback(null, $.extend(true, cameras[newCamera.id].info, { token: t.token }));
      callbacks.refresh();
    }).catch(function (err) {
      callback(err);
    });
  },

  updateCamera: function (updatedCamera, callback) {
    configDocument.mutate(function (remoteData) {
      if (updatedCamera.id in remoteData.cameras) {
        remoteData.cameras[updatedCamera.id] = $.extend(true, updatedCamera, {
            hash: remoteData.cameras[updatedCamera.id].hash
          });
      } else {
        callback("Camera is not in the list");
      }
      return remoteData;
    }).then(function () {
      loadCameras();
      callback(null);
      callbacks.refresh();
    }).catch(function (err) {
      callback(err);
    });
  },

  regenToken: function (cameraId, callback) {
    var t = genToken();
    configDocument.mutate(function (remoteData) {
      if (cameraId in remoteData.cameras) {
        remoteData.cameras[cameraId].hash = t.hash;
      } else {
        throw "unknown camera: " + cameraId;
      }
      return remoteData;
    }).then(function () {
      loadCameras();
      // make token temporarily visible
      callback($.extend(true, cameras[cameraId].info, { token: t.token }));
      callbacks.refresh();
    }).catch(function (err) {
      // ignore error
      console.error("regenToken", err);
    });
  },

  deleteCamera: function (cameraId) {
    configDocument.mutate(function (remoteData) {
      delete remoteData.cameras[cameraId];
      return remoteData;
    }).then(function () {
      loadCameras();
      callbacks.refresh();
    }).then(function () {
      syncClient.map(CAMERA_CONTROL_MAP_NAME(cameraId)).then(function (map) { map.removeMap(); });
      syncClient.list(CAMERA_ALERTS_LIST_NAME(cameraId)).then(function (list) { list.removeList(); });
    });
  },

  controlPreview: function (cameraId) {
    var camera = cameras[cameraId];
    camera.controlMap.set("preview", camera.control.preview)
    .then(function () {
      console.log("switchPreview updated", cameraId, camera.control.preview);
    }).catch(function (err) {
      console.err("switchPreview failed", err);
    });
  },

  controlArm: function (cameraId) {
    var camera = cameras[cameraId];
    camera.controlMap.set("arm", camera.control.arm)
    .then(function () {
      console.log("switchArm updated", cameraId, camera.control.arm);
    }).catch(function (err) {
      console.err("switchArm failed", err);
    });
  },

  disarm: function (cameraId) {
    var camera = cameras[cameraId];
    camera.controlMap.set("arm", {
      enabled: camera.control.arm.enabled,
      responded_alarm: camera.control.alarm.id
    })
    .then(function () {
      console.log("disarm updated", cameraId, camera.control.arm);
    }).catch(function (err) {
      console.err("disarm failed", err);
    });
  },

  getAlerts: function (cameraId, callback) {
    syncClient.list(CAMERA_ALERTS_LIST_NAME(cameraId)).then(function (list) {
      return list.getItems({ order: "desc" }).then(function (page) {
        console.log("getAlerts", page);
        callback(page.items);
      });
    }).catch(function (err) {
      console.error("getAlerts failed", err);
    });
  },

  getNextArchivedSnapshot: function (cameraId, alertId, archiveId, callback) {
    syncClient.list(CAMERA_ARCHIVES_LIST_NAME(cameraId, alertId)).then(function (list) {
      return list.get(archiveId);
    }).then(function (item) {
      fetchSnapshotTmpUrl(item.data.value.mcs_url, function (snapshotTmpUrl) {
        callback(snapshotTmpUrl);
      });
    }).catch(function (err) {
      console.info("getNextArchivedSnapshot failed", err);
      callback(null);
    });
  },

  init: function () {
    var that = this;
    this.updateToken(function (token) {
      that.fetchConfiguration().then(function () {
        callbacks.refresh();
      }).then(function () {
        that.initialized.resolve();
      });
    });
  }
  };
};
