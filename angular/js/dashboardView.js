var dashboardView = {
  templateUrl: require("../views/dashboard.html"),

  init: function (app, $scope) {
    $scope.cameras = app.cameras;
    $scope.modes = ["live-feed", "arm"];
    $scope.noCamera = function () { return Object.keys(app.cameras).length === 0; }
    $scope.update = function(value, camera) {
      if (value == "live-feed") {
        camera.control.preview.enabled = true;
        camera.control.arm.enabled = false;
      }
      else {
        camera.control.preview.enabled = false;
        camera.control.arm.enabled = true;        
      }
      app.controlPreview(camera.info.id);
      app.controlArm(camera.info.id);
      console.log(camera.info)
    };
    $scope.onload = function (camera) {
        console.info("Image loaded: " + camera.snapshot.img_url);
        camera.snapshotLoadingInProgress = false;
    };
    $scope.switchPreview = function (cameraId) {
      app.controlPreview(cameraId);
    };
    $scope.switchArm = function (cameraId) {
      app.controlArm(cameraId);
    };
    $scope.disarm = function (cameraId) {
      app.disarm(cameraId);
    };
  }
};

module.exports = dashboardView;
