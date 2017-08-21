'use strict';

const $ = require("jquery");
const angular = require("angular");
const moment = require("moment");
require("angular-route");

const MOMENT_FORMAT = "MMM DD YYYY @ hh:mm";

// style sheets
require("bootstrap-webpack");
require("../scss/main.scss");

// index.html
require("../index.html");

const dashboardView = require("./dashboardView");
const cameraListView = require("./cameraListView");
const cameraView = require("./cameraView");

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
    'ngRoute'
  ])
  .controller('DashboardViewCtrl', ['$scope', function ($scope) {
    $currentViewScope = $scope;
    currentView = dashboardView;
    $.when(app.initialized).done(function () {
      dashboardView.init(app, $scope);
    });
  }])
  .controller('CameraListViewCtrl', ['$scope', function ($scope) {
    $currentViewScope = $scope;
    currentView = cameraListView;
    $.when(app.initialized).done(function () {
      cameraListView.init(app, $scope);
    });
  }])
  .controller('CameraView', ['$routeParams', '$scope', function ($routeParams, $scope) {
    $currentViewScope = $scope;
    currentView = cameraView;
    $.when(app.initialized).done(function () {
      cameraView.init(app, $routeParams.id, $scope);
    });
  }])
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/dashboard', { controller: 'DashboardViewCtrl', templateUrl: dashboardView.templateUrl } )
      .when('/cameras', { controller: 'CameraListViewCtrl', templateUrl: cameraListView.templateUrl } )
      .when('/cameras/:id', { controller: 'CameraView', templateUrl: cameraView.templateUrl } )
      .otherwise({ redirectTo: '/dashboard' }); 
  }])
  .filter('moment', function () {
    return function (datestr) {
      return moment(datestr).format(MOMENT_FORMAT);
    };
  });
