define(['socketio'], function(io) {
    console.log("[APP] Initializing");
    localStorage.debug = [];
    
    const MIN_WIDTH = 1,
            MAX_WIDTH = 64;

    var WS = io(),
        users = {},
        ourColour = "#cb3594",
        ourWidth = 4,
        lastX = 0,
        lastY = 0,
        board = document.getElementById('drawing-area'),
        colorPicker = document.getElementById('line-color-picker'),
        preview = document.getElementById('preview');
    
        board.width = 1280;
        board.height = 720;

    var ctx = board.getContext("2d"),
        previewCtx = preview.getContext("2d");
        polyLine = [],
        isPainting = false;

    ctx.lineJoin = "round";
    ctx.lineWidth = ourWidth;
    
    colorPicker.addEventListener("change", function(event) {
        event.preventDefault();
        ourColour = event.target.value.toUpperCase();
        
        updatePreview();
    });

    // Attach the events
    board.addEventListener("mousedown", function (event) {
        isPainting = true;

        var x = (event.pageX - this.offsetLeft),
            y = (event.pageY - this.offsetTop);

        WS.emit('started drawing', {x: x, y: y, color: ctx.strokeStyle});

        polyLine = [[x, y]];
        
        lastX = x;
        lastY = y;
    });

    board.addEventListener("mouseup", function (event) {
        isPainting = false;

        WS.emit('ended drawing');

        lastX = null;
        lastY = null;
    });

    board.addEventListener("mousemove", function (event) {
        if (!isPainting) return;
        
        var x = (event.pageX - this.offsetLeft),
            y = (event.pageY - this.offsetTop);

        polyLine.push([x, y]);
        
        ctx.beginPath()
        
        if(lastX) ctx.moveTo(lastX, lastY);
        
        ctx.strokeStyle = ourColour;
        ctx.lineWidth = ourWidth;
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.stroke();
        
        lastX = x;
        lastY = y;
        
        WS.emit('drawing move', {x: x, y: y, color: ctx.strokeStyle, lineWidth: ctx.lineWidth});
    });
    
    board.addEventListener("wheel", function(event) {
        event.preventDefault();
        
        if ((ourWidth > MIN_WIDTH && event.deltaY > 0) || (ourWidth < MAX_WIDTH && event.deltaY < 0)) {
            ourWidth += -event.deltaY;
        }
        
        updatePreview();
    });
    
    document.getElementById("reset").addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();

        ctx.clearRect(0,0, board.width, board.height);
        WS.emit("RESET");
    });

    WS.on('started drawing', function(userPoint) {
        var user = users[userPoint.userId];
        
        if(!user) {
            user = {lastX: userPoint.x, lastY: userPoint.y, userId: userPoint.userId};
            users[user.userId] = user; 
        }
    });
    
    WS.on('drawing move', function(userPoint) {
        var user = users[userPoint.userId];

        ctx.beginPath();
        ctx.strokeStyle = userPoint.color;
        ctx.lineWidth = userPoint.lineWidth;
        if (user.lastX) {
            ctx.moveTo(user.lastX, user.lastY);
        }
        ctx.lineTo(userPoint.x, userPoint.y);
        ctx.closePath();
        ctx.stroke();
        
        user.lastX = userPoint.x;
        user.lastY = userPoint.y;
    });
    
    WS.on('ended drawing', function(userDrawing) {
        var user = users[userDrawing.userId];
        user.lastX = null;
        user.lastY = null;
    });

    WS.on("RESET", function() {
        users = {};
        ctx.clearRect(0,0, board.width, board.height);
    });
    
    WS.on('userCount', function(users) {
        document.getElementById("user-count").textContent = users.users;  
    });
    
    
    function updatePreview() {
        // Clear the canvas
        previewCtx.clearRect(0, 0, preview.width, preview.height);
        
        // Move to the centre
        previewCtx.lineWidth = ourWidth;
        previewCtx.strokeStyle = ourColour;
        
        previewCtx.beginPath();
        previewCtx.moveTo(preview.width/2, preview.height/2);
        previewCtx.lineTo(preview.width/2, preview.height/2);
        previewCtx.closePath();
        
        previewCtx.stroke();
    }
    
    updatePreview();
});