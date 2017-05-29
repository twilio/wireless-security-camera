'use strict';

const MOMENT_FORMAT = "MMM DD YYYY @ hh:mm";

var moment = require("moment");

module.exports = function(callbacks) {
  var $ = require("jquery");
  var SyncClient = require("twilio-sync").SyncClient;
  var syncClient;
  var token;
  var auth = "username=trump&pincode=928462";

  var cameras = {};

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
        var newDoc = null;

        if (typeof(doc.value.cameras) === "object") {
            for (cameraId in doc.value.cameras) {
                var camera = doc.value.cameras[cameraId];
                if (typeof (camera.info.name) === "string") {
                    console.warn("Invalid camera configuration, removing from the list: ", cameraId, camera);
                    cameras[cameraId] = {
                        info: camera.info
                    };
                } else {
                    if (null ===  newDoc) newDoc = $.extend(true, doc.value, {});
                    delete newDoc.cameras[cameraId];
                }
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

  init: function () {
    var that = this;
    this.updateToken(function (token) {
      that.fetchConfiguration();
    });
  }
  };
};
