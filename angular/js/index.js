'use strict';

const angular = require("angular");
const ngRoute = require("angular-route");

// style sheets
require("bootstrap-webpack");
require("../scss/main.scss");

// index.html
require("../index.html");

const dashboardView = require("./dashboardView");

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
  .config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/dashboard', { controller: 'DashboardViewCtrl', templateUrl: "views/dashboard.html" } )
      .otherwise({ redirectTo: '/dashboard' }); 
  }]);
