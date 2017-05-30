var dashboardView = {
  templateUrl: require("../views/dashboard.html"),

  init: function (app, $scope) {
    $scope.cameras = app.cameras;
    $scope.noCamera = function () { return Object.keys(app.cameras).length === 0; }
  }
};

module.exports = dashboardView;
