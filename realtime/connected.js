module.exports = function(user) {
    user.broadcast.emit('system message', 'User Connected');
    
    user.on('chat message', function(message) {

        R.table("messages").insert({
            userId: user.id,
            message: message,
            at: new  Date()
        }).run(DB, function(){
            user.broadcast.emit('chat message', message);  
        });

    });
};