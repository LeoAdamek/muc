define('main', [], function() {
    requirejs.config({
        baseUrl: '/js/lib',
        paths: {
            app: "../app",
            jquery: 'jquery-2.2.2',
            socketio: '/socket.io/socket.io',
            color_parser: 'color-parser',
            color_convert: 'color-convert'
        }
    });
    
    require(["app/main"])
});
