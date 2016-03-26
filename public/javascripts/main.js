define(function() {
    console.log("Initializing");
    
    console.log("Configuring RequireJS");
    requirejs.config({
        baseUrl: '/javascripts/lib',
        paths: {
            app: "../app",
            jquery: 'jquery-2.2.2',
            socketio: '/socket.io/socket.io'
        }
    });
    
    console.log("Loading Modules");
    requirejs(["app/main"])
});


