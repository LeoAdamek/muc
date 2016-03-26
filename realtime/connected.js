module.exports = function(user) {
    console.log("User Connected: " + user.id);   
    
    user.emit('message', 'Connected');
    
    setInterval(function(){
        user.emit('message', 'ping');
    }, 1000);
};