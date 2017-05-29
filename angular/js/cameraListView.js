require("../views/camera_list.html");

var $ = require("jquery");

var cameraListView = {
  init: function () {
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
  },
};

module.exports = cameraListView;
