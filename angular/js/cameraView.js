var $ = require("jquery");

var cameraView = {
  templateUrl: require("../views/camera_view.html"),

  init: function (app, cameraId, $scope) {
    $scope.camera = app.cameras[cameraId];
    $scope.selectedAlertChanged = function () {
      console.log("selectedAlertChanged", $scope.selectedAlertId);
      $scope.selectedArchiveId = 0;
      $scope.selectNewArchiveId(0);
      $scope.snapshotTmpUrl = null;
    };
    $scope.selectNewArchiveId = function (newArchiveId) {
      console.log("selectNewArchiveId start", $scope.selectedAlertId, newArchiveId);
      app.getNextArchivedSnapshot(cameraId, $scope.selectedAlertId, newArchiveId, function (snapshotTmpUrl) {
        if (snapshotTmpUrl) {
          console.log("selectNewArchiveId accepted", $scope.selectedAlertId, snapshotTmpUrl);
          $scope.selectedArchiveId = newArchiveId;
          $scope.snapshotTmpUrl = snapshotTmpUrl;
          $scope.$apply();
        } else {
          console.log("selectNewArchiveId rejected", $scope.selectedAlertId);
        }
      });
    };
    $scope.selectPreviousArchive = function () {
      if ($scope.selectedArchiveId > 0) {
        $scope.selectNewArchiveId($scope.selectedArchiveId - 1);
      }
    };
    $scope.selectNextArchive = function () {
        $scope.selectNewArchiveId($scope.selectedArchiveId + 1);
    };
    app.getAlerts(cameraId, function (alerts) {
      $scope.alerts = alerts;
      $scope.selectedAlertId = alerts[0].data.index+"";
      $scope.$apply();
      $scope.selectedAlertChanged();
    });
  }
};

module.exports = cameraView;
