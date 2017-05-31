var $ = require("jquery");

var cameraListView = {
  templateUrl: require("../views/camera_list.html"),

  init: function (app, $scope) {
    $scope.cameras = app.cameras;
    $scope.newCamera = {};
    $scope.addCamera = function () {
      app.addCamera(angular.copy($scope.newCamera), function (err, cameraAdded) {
        if (err) {
          $('#add-camera-failed').text(JSON.stringify(err));          
        } else {
          $scope.editedCameraInfo = cameraAdded;
          $('.add-camera').hide();
          $('.add-camera-show').fadeIn(333);          
          $scope.$apply();
        }
      });
    };
    $scope.editCamera = function (cameraId) {
      $scope.editedCameraInfo = app.cameras[cameraId].info;
      $('.edit-camera').fadeIn(333);
    };
    $scope.updateCamera = function () {
      app.updateCamera(angular.copy($scope.editedCameraInfo), function (err) {
        if (err) {
          $('#edit-camera-failed').text(JSON.stringify(err));          
        } else {
          $('.edit-camera').hide();
          $scope.$apply();
        }
      });
    };
    $scope.deleteCamera = function (cameraId) {
      app.deleteCamera(cameraId);
    };
    $scope.regenTokenForCamera = function (cameraId) {
      app.regenToken(cameraId, function (cameraUpdated) {
        $scope.editedCameraInfo = cameraUpdated;
      });
    };

    $('.add-camera-show').click(function() {
      $(this).hide();
      $('.add-camera').fadeIn(333);
    });
    $('.add-camera-cancel').click(function() {
      $('.add-camera').hide();
      $('.add-camera-show').fadeIn(333);
    });

    $('.edit-camera-cancel').click(function() {
      $scope.editedCameraInfo = null;
      $('.edit-camera').hide();
      $scope.$apply();
    });
  },
};

module.exports = cameraListView;
