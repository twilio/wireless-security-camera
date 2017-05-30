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
  .controller('DashboardViewCtrl', ['$scope', function ($scope) {
    $currentViewScope = $scope;
    currentView = dashboardView;
    dashboardView.init(app, $scope);
  }])
  .controller('CameraListViewCtrl', ['$scope', function ($scope) {
    $currentViewScope = $scope;
    currentView = cameraListView;
    cameraListView.init(app, $scope);
  }])
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/dashboard', { controller: 'DashboardViewCtrl', templateUrl: dashboardView.templateUrl } )
      .when('/cameras', { controller: 'CameraListViewCtrl', templateUrl: cameraListView.templateUrl } )
      .otherwise({ redirectTo: '/dashboard' }); 
  }]);
