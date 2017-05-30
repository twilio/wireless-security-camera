'use strict';

const $ = require("jquery");
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
    // update snapshot tmp urls
    for (var cameraId in app.cameras) {
      var camera = app.cameras[cameraId];
      if (camera.snapshot && !camera.snapshot.img_url) {
        (function (camera) {
          $.ajax({
            type: "GET",
            url: camera.snapshot.mcs_url,
            dataType: 'json',            
            beforeSend: function (xhr) { xhr.setRequestHeader('X-Twilio-Token', app.getToken()); },
            success: function (data, status, xhr) {
              camera.snapshot.img_url = data.links.content_direct_temporary;
              $currentViewScope.$apply();          
            }
          });
        })(camera);
      }
    }
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
    $scope.noCamera = function () { return Object.keys(app.cameras).length === 0; }
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
