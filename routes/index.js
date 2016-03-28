require('./room');

const R = require('rethinkdb');
var DB;


R.connect("localhost", function(err, conn) {
    if (err) {
        console.error(err);
        process.exit(130); 
    } 
    
    conn.use('muc');
    DB = conn; 
});


exports.index = function(req, res) {
    R.table('rooms').orderBy('name').run(DB, function(error, rooms) {
        res.render('index', {rooms: rooms});
    })
};

exports.room = function(req, res) {
   res.render('room'); 
};

exports.createRoom = function(req, res) {
    var body = req.body;
    
    // Validate the room name is present.
    if(! body['room[name]'] || body['room[name]'].trim() === '') {
       res.redirect('/'); 
    } 
    
    // Check the room name is unique
    R.table('rooms').filter({name: body['room[name]'].trim()}).limit(1).run(DB, function(err, room){
        
        // Create the room and direct the user to it.
        R.table('rooms')
            .insert({name: body['room[name]'].trim(), password: body['room[password]'], created_at: new Date()})
            .run(DB, function(err, response) {

                if (err) {
                    console.error(err);
                }

                var newRoomId = response.generated_keys[0];
               
                res.redirect('/rooms/' + newRoomId);
            });
    });
};
