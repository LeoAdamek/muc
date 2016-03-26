define(['jquery', 'socketio', 'moment'], function($, io, moment) {
    console.log("[APP] Initializing");  
    
    var WS = io();
    
    WS.on('connection', function() {
        console.log("[RT] Connected to WS endpoint.");
    });
    
    WS.on('user connected', function(event) {
        console.log("[RT] User Connected: " + event);
    });

    WS.on('message', function(message) {
        $('#console').append($('<span>').text('[' + moment().format('YYYY-MM-DD HH:mm:ss.SSS') + '] ' + message));
    });

});