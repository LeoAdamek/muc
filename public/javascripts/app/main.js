define(['socketio','color_parser','color_convert'], function(io, CP, CV) {
    console.log("[APP] Initializing");
    localStorage.debug = [];
    
    const MIN_WIDTH = 1,
            MAX_WIDTH = 72;

    var WS = io(),
        users = {},
        ourWidth = 4,
        lastX = 0,
        lastY = 0,
        board = document.getElementById('drawing-area'),
        colorPicker = document.getElementById('line-color-picker'),
        ourColour = colorPicker.value.toUpperCase(),
        specialMode = null,
        modeInterval = null,
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
        
        if(modeInterval && specialMode == 'rainbow') {
            specialMode = null;
            clearInterval(modeInterval);
        }
        
        ourColour = event.target.value.toUpperCase();
        
        updatePreview();
    });

    // Attach the events
    board.addEventListener("mousedown", function (event) {
        isPainting = true;

        var x = (event.pageX - this.offsetLeft),
            y = (event.pageY - this.offsetTop);

        WS.emit('started drawing', {x: x, y: y, color: ctx.strokeStyle});

        polyLine = [{x: x, y: y, color: ctx.strokeStyle, width: ctx.lineWidth}];
        
        lastX = x;
        lastY = y;
    });

    board.addEventListener("mouseup", function (event) {
        isPainting = false;
        
        var image = 'not_support';
        
        // Canvas#toDataURL is only supported in a few browsers.
        if(typeof(board.toDataURL) === 'function') {
            image = board.toDataURL();
        }
        
        WS.emit('ended drawing', {line: polyLine, image: image});
        
        polyLine = [];

        lastX = null;
        lastY = null;
    });

    board.addEventListener("mousemove", function (event) {
        if (!isPainting) return;
        
        var x = (event.pageX - this.offsetLeft),
            y = (event.pageY - this.offsetTop);

        polyLine.push({x: x, y: y, color: ctx.strokeStyle, width: ctx.lineWidth});
        
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
    
    board.addEventListener("mouseleave", function(event) {
        event.preventDefault();
        isPainting = false;

        var image = "not_supported";

        // Canvas#toDataURL is only supported in a few browsers.
        if(typeof(board.toDataURL) === 'function') {
            image = board.toDataURL();
        }
            
        WS.emit('ended drawing', {line: polyLine, image: image});
        
        lastX = null;
        lastY = null; 
    });
    
    document.getElementById("reset").addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();

        ctx.clearRect(0,0, board.width, board.height);
        WS.emit("RESET");
    });

    document.getElementById('mode-rainbow').addEventListener("click", function(e) {
        e.preventDefault();
        
        // If already active, deactivate it.
        if(specialMode === 'rainbow' && modeInterval) {
           specialMode = null;
            clearInterval(modeInterval);
            modeInterval = null;
            return;
        }

        specialMode = 'rainbow';
        modeInterval = setInterval(function(){
            var currentColor = parseCSSColor(ourColour);
            
            var
                hsl   = CV.RGBtoHSL(currentColor[0], currentColor[1], currentColor[2]),
                newColor;

            // Change the hue
            hsl[0] = (hsl[0] + 0.002)%1;
            hsl[1] = 1;
            hsl[2] = 0.6;
            
            newColor = CV.HSLtoRGB(hsl[0], hsl[1], hsl[2]);

            ourColour = '#' + newColor[0].toString(16) + newColor[1].toString(16) + newColor[2].toString(16);
            
            updatePreview(); 
        }, 5)
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
        
        // We might not have the user if they started the line
        // before we connected
        if(!user) {
            user = {lastX: null, lastY: null, userId: userPoint.userId};
            users[userPoint.userId] = user;
        }

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

        if(!user) return;

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

    WS.on('canvas load', function(canvasInfo) {
        // Load a PNG dataURI onto the canvas:
        if(canvasInfo.uri) {
            console.log("Loading existing image data");
            var imageSource = document.createElement('img');
            imageSource.src = canvasInfo.uri;

            ctx.drawImage(imageSource, 0, 0, 1280, 720, 0, 0, 1280, 720);
        }
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