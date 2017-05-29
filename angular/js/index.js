'use strict';

const angular = require("angular");
const ngRoute = require("angular-route");

// style sheets
require("bootstrap-webpack");
require("../scss/main.scss");

// index.html
require("../index.html");

const dashboardView = require("./dashboardView");
const cameraListView = require("./cameraListView");

var currentView;
var $currentViewScope;

var App = require("./app");
window.app = new App({
    refresh: function () {
        $currentViewScope.$apply();
    }
});

angular
  .module("app", [
    ngRoute
  ])
  .controller('DashboardViewCtrl', ['$scope', '$timeout', function ($scope, $timeout) {
    $currentViewScope = $scope;
    currentView = dashboardView;
    $scope.cameras = app.cameras;
  }])
  .controller('CameraListViewCtrl', ['$scope', '$timeout', function ($scope, $timeout) {
    $currentViewScope = $scope;
    currentView = cameraListView;
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

    cameraListView.init();
  }])
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/dashboard', { controller: 'DashboardViewCtrl', templateUrl: "views/dashboard.html" } )
      .when('/cameras', { controller: 'CameraListViewCtrl', templateUrl: "views/camera_list.html" } )
      .otherwise({ redirectTo: '/dashboard' }); 
  }]);
