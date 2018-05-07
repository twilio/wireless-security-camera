var dashboardView = {
  templateUrl: require("../views/dashboard.html"),

  init: function (app, $scope) {
    $scope.cameras = app.cameras;
    $scope.noCamera = function () { return Object.keys(app.cameras).length === 0; }
    $scope.changeCameraMode = function(camera) {
      app.syncCameraMode(camera.info.id);
    };
    $scope.img_oninit = function (camera) {
        camera.snapshotLoadingInProgress = false;
    };
    $scope.img_onloaded = function (camera) {
        console.info("Image loaded: " + camera.snapshot.img_url);
        camera.snapshotLoadingInProgress = false;
    };
    $scope.disarm = function (cameraId) {
      app.disarm(cameraId);
    };
  }
};

module.exports = dashboardView;
