var Express = require('express'),
    Routes = require('./routes'),
    HTTP = require('http'),
    RT = require('./realtime'),
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
    DB.use("webchat");


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

    
    var currentUsers = 0;
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
        
        user.on('ended drawing', function() {
            user.broadcast.emit('ended drawing', {userId: user.id});
        });
        
        user.on("RESET", function() {
            console.log(`User ${user.id} requested a full reset`);
            user.broadcast.emit("RESET");
        });
        
        IO.emit('userCount', {users: ++currentUsers});
        
        user.on('disconnect', function() {
            IO.emit('userCount', {users: --currentUsers});
        });
        
        console.log("User Count: ", currentUsers);
    });

    Server.listen(App.get('port'), function() {
        console.log('Listening on http://localhost:' + App.get('port'))
    });
});
