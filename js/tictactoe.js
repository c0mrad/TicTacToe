var canvas;
var context;
var width;
var height;

var xBoard = 0;
var oBoard = 0;
var begin = true;

var xSound;
var oSound;

var score = {
    win: 0,
    lost: 0,
    tie: 0
};

var Alert = new CustomAlert();

function drawBoard(){
    context.beginPath();
    context.strokeStyle = 'black';
    context.lineWidth = 4;

    var vLine1 = Math.round(width / 3);
    var vLine2 = Math.round(vLine1 * 2);

    var hLine1 = Math.round(height / 3);
    var hLine2 = Math.round(hLine1 * 2);

    context.moveTo(vLine1, 0);
    context.lineTo(vLine1, height);

    context.moveTo(vLine2, 0);
    context.lineTo(vLine2, height);

    context.moveTo(0, hLine1);
    context.lineTo(width, hLine1);

    context.moveTo(0, vLine2);
    context.lineTo(width, hLine2);

    context.stroke();
    context.closePath();
}

function init(canvasID) {
    canvas  = document.getElementById(canvasID);
    context = canvas.getContext('2d');

    width   = canvas.width;
    height  = canvas.height;

    canvas.addEventListener('click', clickHandler);

    drawBoard();

    loadResources();
}

function isEmpty(xBoard, oBoard, bit){
    return (((xBoard & bit) == 0) && ((oBoard & bit) == 0));
}

function drawX(x, y){
    context.beginPath();

    context.strokeStyle = '#ff0000';
    context.lineWidth = 4;

    var offsetX = (width / 3) * 0.1;
    var offsetY = (height / 3) * 0.1;

    var beginX = x * (width / 3) + offsetX;
    var beginY = y * (height / 3) + offsetY;

    var endX = (x + 1) * (width / 3) - offsetX;
    var endY = (y + 1) * (height / 3) - offsetX;

    context.moveTo(beginX, beginY);
    context.lineTo(endX, endY);

    context.moveTo(beginX, endY);
    context.lineTo(endX, beginY);

    context.stroke();
    context.closePath();
}

function markBit(markBit, player){
    var bit = 1;
    var x = 0;
    var y = 0;

    while((markBit & bit) === 0){
        bit = bit << 1;
        x++;
        if(x > 2){
            x = 0;
            y++;
        }
    }

    if(player === 'O'){
        oBoard = oBoard | bit;
        draw0(x, y);
    }else{
        xBoard = xBoard | bit;
        drawX(x, y);
    }
}

function clickHandler(event){
    var x = Math.floor((event.clientX - canvas.offsetLeft) / (width / 3));
    var y = Math.floor((event.clientY - canvas.offsetTop) / (height / 3));

    var bit = (1 << x + (y * 3));

    if(isEmpty(xBoard, oBoard, bit)){

        markBit(bit, 'X');

        if (!checkTie()) {
            if (checkWinner(xBoard)) {
                document.getElementById('dialogboxbody').style.backgroundColor = "green";
                Alert.render('<p class="bounceIn animated">თქვენ გაიმარჯვეთ!!</p>');
                score.win++;
                console.log("თქვენ მოიგეთ, ანგარიშია " + score.win + " : " + score.lost);
                restart();
            } else {
                play();
                if (!checkTie()) {
                    if (checkWinner(oBoard)) {
                        document.getElementById('dialogboxbody').style.backgroundColor = "red";
                        Alert.render('<p class="bounceInDown animated">თქვენ წააგეთ!!</p>');
                        score.lost++;
                        console.log("თქვენ წააგეთ, ანგარიშია " + score.win + " : " + score.lost);
                        restart();
                    }
                }
            }
        }
    }
}

function checkWinner(board){
    var winState = false;
    if(
        ((board | 0x1C0)    === board) ||
        ((board | 0x38)     === board) ||
        ((board | 0x7)      === board) ||
        ((board | 0x124)    === board) ||
        ((board | 0x92)     === board) ||
        ((board | 0x49)     === board) ||
        ((board | 0x111)    === board) ||
        ((board | 0x54)     === board)) {
        winState = true;
    }
    return winState;
}

function calculateRatio(oBoard, xBoard, player, bit, ratio){
    var best;

    if(player === 'O'){
        oBoard = oBoard | bit;
    }else{
        xBoard = xBoard | bit;
    }

    if(checkWinner(oBoard)){
        ratio *= 1.1;
        best = ratio;
    }else if(checkWinner(xBoard)){
        ratio *= 0.7;
        best = ratio;
    }else{
        best = 0;
        ratio *= 0.6;

        for(var iter = 0; iter < 9; iter++){
            if(isEmpty(xBoard, oBoard, 1 << iter)){
                var newPlayer = player == 'O' ? 'X' : 'O';
                var newRatio = calculateRatio(oBoard, xBoard, newPlayer, 1 << iter, ratio);

                if(best === 0 || best < newRatio){
                    best = newRatio;
                }
            }
        }
    }
    return best;
}

function simulate(oBoard, xBoard){
    var ratio = 0;

    var bit = 0;
    for(var i = 0; i < 9; i++){
        var checkBit = 1 << i;

        if(isEmpty(xBoard, oBoard, checkBit)){
            if(checkWinner(oBoard | checkBit)){
                bit = checkBit;
                break;
            }else if(checkWinner(xBoard | checkBit)){
                bit = checkBit;
            }
        }
    }

    if(bit === 0){
        for(var i = 0; i < 9; i++){
            var checkBit = 1 << i;

            if(isEmpty(xBoard, oBoard, checkBit)){
                var result = calculateRatio(oBoard, xBoard, 'X', 0, 1);
                if(ratio === 0 || ratio < result){
                    ratio = result;
                    bit = checkBit;
                }
            }
        }
    }
    return bit;
}

function restart(){
    incrementScores();
    context.clearRect(0, 0, width, height);
    xBoard = 0;
    oBoard = 0;
    drawBoard();
}

function checkTie(){
    var tie = false;

    if((xBoard | oBoard) === 0x1FF){
        score.tie++;
        console.log (score.tie);
        document.getElementById('dialogboxbody').style.backgroundColor = "blue";
        Alert.render('<p class="bounceIn animated">ფრე...</p>');
        console.log("ფრე, ანგარიშია " + score.win + " : " + score.lost);
        restart();
        tie = true;
    }
    return tie;
}

function play(){
    var bestPlay = simulate(oBoard, xBoard);
    markBit(bestPlay, 'O');
}

function draw0(x, y){
    context.beginPath();
    context.strokStyle = '#0000ff';
    context.lineWidth = 10;

    var offsetX = (width / 3) * 0.1;
    var offsetY = (height / 3) * 0.1;

    var beginX = x * (width / 3) + offsetX;
    var beginY = y * (height / 3) + offsetY;

    var endX = (x + 1) * (width / 3) - offsetX * 2;
    var endY = (y + 1) * (height / 3) - offsetY * 2;

    context.arc(
        beginX + ((endX - beginX) / 2),
        beginY + ((endY - beginY) / 2),
        (endX - beginX) / 2,
        0,
        Math.PI * 2,
        true
    );

    context.stroke();
    context.closePath();

    oSound.play();
}

function loadResources() {
    xSound = document.createElement('audio');
    document.body.appendChild(xSound);
    xSound.setAttribute('src', 'sounds/xSound.mp3');

    oSound = document.createElement('audio');
    document.body.appendChild(oSound);
    oSound.setAttribute('src', 'sounds/oSound.mp3');
}

function incrementScores(){
    document.getElementById('wins').innerHTML = score.win;
    document.getElementById('losses').innerHTML = score.lost;
    document.getElementById('ties').innerHTML = score.tie;
}


function CustomAlert(){
    this.render = function(dialog){
        var winWidth    = window.innerWidth;
        var winHeight   = window.innerHeight;

        var dialogoverlay   = document.getElementById('dialogoverlay');
        var dialogbox       = document.getElementById('dialogbox');

        dialogoverlay.style.display = "block";
        dialogoverlay.style.height = winHeight+"px";

        dialogbox.style.left = (winWidth / 2) - (500 * .5)+"px";
        dialogbox.style.top  = "142px";
        dialogbox.style.margin = "200px";
        dialogbox.style.marginLeft = "0px";
        dialogbox.style.display = "block";

        document.getElementById('dialogboxhead').innerHTML = "თამაში დასრულებულია!";
        document.getElementById('dialogboxbody').innerHTML = dialog;
        document.getElementById('dialogboxfoot').innerHTML = '<button onclick="Alert.ok()">თავიდან დაწყება</button>';

    }
    this.ok = function(){
        document.getElementById('dialogbox').style.display = "none";
        document.getElementById('dialogoverlay').style.display = "none";

    }
}



