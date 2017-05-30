var $ = require("jquery");

var cameraListView = {
  templateUrl: require("../views/camera_list.html"),

  init: function (app, $scope) {
    $scope.cameras = app.cameras;
    $scope.newCamera = {};
    $scope.addCamera = function () {
      app.addCamera(angular.copy($scope.newCamera), function (err, cameraAdded) {
        if (err) {
          cameraListView.onCameraAddingFailed(err);
        } else {
          $scope.cameraAdded = cameraAdded;
          cameraListView.onCameraAdded();
          $scope.$apply();
        }
      });
    };
    $scope.deleteCamera = function (cameraId) {
      app.deleteCamera(cameraId);
    };

    $('.add-camera-show').click(function() {
      $(this).hide();
      $('.add-camera').fadeIn(333);
    });
    $('.add-camera-cancel').click(function() {
      $('.add-camera').hide();
      $('.add-camera-show').fadeIn(333);
    });
  },

  onCameraAddingFailed: function (err) {
    $('#add-camera-failed').text(JSON.stringify(err));        
  },

  onCameraAdded: function () {
      $('.add-camera').hide();
      $('.add-camera-show').fadeIn(333);
  },
};

module.exports = cameraListView;
