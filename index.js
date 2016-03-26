var Express = require('express'),
    Routes = require('./routes'),
    HTTP = require('http'),
    RT = require('./realtime'); 
    Path = require('path');

var App = Express(),
    Server = HTTP.createServer(App),
    IO = require('socket.io')(Server);
    

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

IO.on('connection', RT.connected);

Server.listen(App.get('port'), function() {
    console.log('Listening on http://localhost:' + App.get('port'))
});
