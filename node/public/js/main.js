var Main = function() {
	return {
    all_maps: {},
    datapoint_totals: {},
    current_infowindow: null,
    infowindows: {},
    next_id: 0,
    init: function (data) {
      Main.initSockets();
      $('.add-camera-show').click(function() {
        $(this).hide();
        $('.add-camera').fadeIn(333);
      });
      $('.add-camera-cancel').click(function() {
        $('.add-camera').hide();
        $('.add-camera-show').fadeIn(333);
      });
    },
    initActive: function(vehicles) {

    },
  	initSockets: function () {
      Main.socket = io.connect('/client');
      Main.socket.on("connect", function(){});

      Main.socket.on("new:photo", function(data) {
        console.log('.camera-'+data.camera_id+'-feed');
        $('.camera-'+data.id+'-feed').attr('src', 'data:image/jpg;base64,'+data.image);
        if(!$('.camera'+data.id).length && $('.no-cameras').length) {
          $('h3').remove();
          $('.container-content').append('<div class="jumbotron camera camera'+data.id+'"> \
                                    <h3> \
                                    '+data.name+' \
                                    <a href="/camera/'+data.id+'">(see more)</a> \
                                    </h3> \
                                      <div class="row"> \
                                        <div class="col-lg-8 col-lg-offset-2"> \
                                          <img class="camera-1-feed" src="data:image/jpg;base64,'+data.image+'"> \
                                        </div> \
                                      </div> \
                                      <div class="row motion_stats"> \
                                        <div class="col-lg-4 col-lg-offset-4"> \
                                          <div class="alert alert-dismissible alert-success"><strong>No People detected</strong></div> \
                                      </div> \
                                    </div> \
                                  </div>');
        }

        if(data.motion_detected) {
          $('.motion_stats .alert').removeClass('alert-success').addClass('alert-danger');
          $('.motion_stats .alert').html("<strong>People Detected</strong>");
        } else {
          $('.motion_stats .alert').removeClass('alert-danger').addClass('alert-success');
          $('.motion_stats .alert').html("<strong>No People detected</strong>")
        }
      });
    }

	};
}();