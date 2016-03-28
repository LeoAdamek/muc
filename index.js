var Express = require('express'),
    Routes = require('./routes'),
    HTTP = require('http'),
    R = require('rethinkdb'),
    Path = require('path');

var App = Express(),
    Server = HTTP.createServer(App),
    IO = require('socket.io')(Server);


R.connect("localhost", function(error, DB) {
    if (error) {
       console.error(error);
        process.exit(130);
    }
    DB.use("muc");

    // configure the App itself
    App.set('port', process.env.PORT || 3000);
    App.set('views', __dirname + '/views');
    App.set('view engine', 'jade');
    //App.use(require('serve-favicon'));
    App.use(require('morgan')('combined'));
    App.use(require('body-parser').urlencoded({extended: false}));
    // App.use(require('method-override'));
    App.use(require('cookie-parser')('a cookie secret'));
    //App.use(require('express-session')('a session secret'));
    // App.use(require('less-middleware')({src: __dirname + '/public'}));
    App.use(Express.static(Path.join(__dirname, 'public')));
    App.use(require('errorhandler')());

    App.get('/', Routes.index);

    
    var currentUsers = 0,
        currentCanvas = '';
    IO.on('connection', function(user) {
        console.log("User Connected:" + user.id);
        
        user.on('started drawing', function(point) {
            point.userId = user.id;
            user.broadcast.emit('started drawing', point);
        });
        
        user.on('drawing move', function(point) {
            point.userId = user.id;
            user.broadcast.emit('drawing move', point);
        });
        
        user.on('ended drawing', function(canvas) {
            user.broadcast.emit('ended drawing', {userId: user.id});
            
            R.table("lines").insert({line: canvas.line, userId: user.id, at: new Date()}).run(DB);
            //R.table("canvases").insert({userId: user.id, at: new Date(), imageURI: canvas.image}).run(DB);
            currentCanvas = canvas.image;
        });
        
        user.on("RESET", function() {
            console.log('User ' + user.id + 'requested a full reset');
            user.broadcast.emit("RESET");
            
            R.table("lines").insert({at: new Date(), userId: user.id, flags: ['reset']}).run(DB);
        });
        
        IO.emit('userCount', {users: ++currentUsers});
        user.on('disconnect', function() {
            IO.emit('userCount', {users: --currentUsers});
        });
        
        user.emit('canvas load', {uri: currentCanvas});
    });

    Server.listen(App.get('port'), function() {
        console.log('Listening on http://localhost:' + App.get('port'))
    });
});
