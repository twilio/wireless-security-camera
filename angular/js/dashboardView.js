var dashboardView = {
  templateUrl: require("../views/dashboard.html"),

  init: function (app, $scope) {
    $scope.cameras = app.cameras;
    $scope.noCamera = function () { return Object.keys(app.cameras).length === 0; }
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
