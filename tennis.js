//Difficulty ranges from 0 to 1 with 1 being the hardest.
var difficulty = 0.1;

//Court layout
var courtWidth = 300;
var courtHeight = 400;
var racketWidth = 100;

//Key assignments
var moveLeft = 37;
var moveRight = 39;

//Court colors for different Majors
var australianOpen = '#1D1075';
var frenchOpen = '#B42';
var wimbledon = '#02AC1E';
var usOpen = '#23D';

//Racket and Ball colors
var racket = '#606060';
var tennisBall = '#B1FF1E';


function roundedRectangle(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke === 'undefined') {
    stroke = true;
  }
  if (typeof radius === 'undefined') {
    radius = 15;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (stroke) {
    ctx.stroke();
  }
  if (fill) {
    ctx.fill();
  }
}

//Randomization function to be used later
function randomization(min, max) {
  return (Math.random() * (max - min)) + min;
}

//Racket function
function Racket(x, y) {
  this.width = racketWidth;
  this.height = 30;

  this.x = x;
  this.y = y;
  this.xSpeed = 0;
  this.ySpeed = 0;
}

//Drawing racket on the court
Racket.prototype.render = function (ctx) {
  roundedRectangle(ctx, this.x, this.y, this.width, this.height, 15, true, null);
};

Racket.prototype.move = function(x, y) {
  this.x += x;
  this.y += y;
  this.xSpeed = x;
  this.ySpeed = y;
  if (this.x < 0) {
    this.x = 0;
    this.xSpeed = 0;
  } else if (this.x + this.width > courtWidth) {
    this.x = courtWidth = this.width;
    this.xSpeed = 0;
  }
};

//AI Racket
function Computer() {
  this.score = 0;
  var racketX = (courtWidth / 2) - (racketWidth / 2);
  var racketY = 0;
  this.racket = new Racket(racketX, racketY);
}
Computer.prototype.render = function (ctx) {
  this.racket.render(ctx);
  ctx.fillText(this.score.toString(), 5, 30);
};

//Computer racket moves with the position of ball, with a possibility of error
Computer.prototype.update = function (ball) {
  var ballXPosition = ball.x;
  var diff = -((this.racket.x + (this.racket.width / 2)) - ballXPosition);
  if (diff < 0 && diff < -4) {
    diff = -5;
  } else if (diff > 0 && diff > 4) {
    doff = 5;
  }
  //Sets difficulty
  this.racket.move(diff * randomization(difficulty, 1), 0);
  if (this.racket.x < 0) {
    this.racket.x = 0;
  } else if (this.racket.x + this.racket.width > courtWidth) {
    this.racket.x = courtWidth - this.racket.width;
  }
};

//Human player
function Player() {
  this.score = 0;
  var racketX = (courtWidth / 2) - (racketWidth / 2);
  var racketY = courtHeight - 20;
  this.racket = new Racket(racketX, racketY);
}

Player.prototype.render = function (ctx) {
  this.racket.render(ctx);
  ctx.fillText(this.score.toString(), 5, courtHeight - 30);
};

Player.prototype.update = function (keysDown) {
  var value;
  for (var key in keysDown) {
    value = Number(key);
    if (value === moveLeft) {
      this.racket.move(-4, 0);
    } else if (value === moveRight) {
      this.racket.move(4, 0);
    } else {
      this.racket.move(0, 0);
    }
  }
};

//Ball Physics
function Ball(x, y, speedX, speedY, rad) {
  this.radius = rad || 15;
  this.defaultXPosition = function () {
    return typeof x === 'undefined' ? courtWidth / 2 : x;
  };
  this.defaultYPosition = function () {
    return typeof y === 'undefined' ? courtHeight / 2 : y;
  };
  this.defaultXSpeed = function () {
    return typeof speedX === 'undefined' ? 0 : speedX;
  };
  this.defaultYSpeed = function () {
    return typeof speedY === 'undefined' ? 3 : speedY;
  };
  this.resetSpeed = function() {
    this.x = this.defaultXSpeed();
    this.y = this.defaultYSpeed();
  };
  this.resetPosition = function() {
    this.x = this.defaultXPosition();
    this.y = this.defaultYPosition();
  };
  this.reset = function() {
    this.resetSpeed();
    this.resetPosition();
  };
  this.reset();
}

Ball.prototype.render = function(ctx) {
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.radius, 2 * Math.PI, false);
  ctx.fill();
};

//Ball movement
Ball.prototype.update = function(playerBottom, playerTop) {
  this.x += this.xSpeed;
  this.y += this.ySpeed;
  var topX = this.x - this.radius;
  var topY = this.y - this.radius;
  var bottomX = this.x + this.radius;
  var bottomY = this.y + this.radius;
  var racketBottom = playerBottom.racket;
  var racketTop = playerTop.racket;

  var ballLeftWall = this.x - this.radius < 0;
  var ballRightWall = this.x - this.radius > courtWidth;
  if (ballLeftWall) {
    this.x = this.radius;
    this.xSpeed = -this.xSpeed;
  } else if (ballRightWall) {
    this.x = courtWidth - this.radius;
    this.xSpeed = -this.xSpeed;
  }

  //Resets ball to center of court after someone scores
  var bottomScored = this.y < 0;
  var topScored = this.y > 900;
  if (bottomScored || topScored) {
    if (bottomScored) {
      playerBottom.score++;
    }
    if (topScored) {
      playerTop.score++;
    }
    this.reset();
  }

  //Below determines how much to change the ball speed.
  var ballInBottom = topY > (courtHeight * 0.75);
  if (ballInBottom) {
    var bottomRacketYArea = racketBottom.y + raacketBottom.height;
    var ballTopIsUnderBottomRacket = topY < bottomRacketYArea;
    var ballBottomIsAboveBottomRacket = bottomY > racketBottom.y;
    var ballYOverlapsBottomRacket = ballTopIsUnderBottomRacket && ballBottomIsAboveBottomRacket;

    var bottomRacketXArea = racketBottom.x + racketBottom.width;
    var ballXOverlapsBottomRacket = topX < bottomRacketXArea && bottomX > racketBottom.x;

    var ballHitBottomRacket = ballYOverlapsBottomRacket && ballXOverlapsBottomRacket;

    if (ballHitBottomRacket) {
      this.ySpeed = randomOffset(-(Math.abs(racketBottom.xSpeed || 4)), -0.9 * Math.abs(racketBottom.xSpeed || 4));
      this.xSpeed += (racketBottom.xSpeed / 2);
      this.y += this.ySpeed;
    }
  } else {
    var topRacketBottom = racketTop.y + racketTop.height;
    var ballTopIsOverTopRacket = topY < topRacketBottom;
    var ballBottomIsUnderTopRacket = bottomY > racketTop.y;

    var ballXOverlapsTopRacket = topX < (racketTop.x + racketTop.width) && bottomX > racketTop.x;

    var ballHitTopRacket = ballTopIsOverTopRacket && ballBottomIsUnderTopRacket && ballXOverlapsTopRacket;

    if (ballHitTopRacket) {
      this.ySpeed = randomization(0.9 * Math.abs(racketTop.xSpeed || 4), Math.abs(racketTop.xSpeed || 4));
      this.xSpeed += (racketTop.xSpeed / 2);
      this.y += this.ySpeed;
    }
  }
};

//Function to put the court into the html
function Tennis(appendToElementId, window, document) {
  var el = document.getElementById(appendToElementId);
  var animate = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callbackl) {
    window.setTimeout(callback, 1000 / 60);
  };

  var canvas = document.createElement("canvas");
  canvas.width = courtWidth;
  canvas.height = courtHeight;
  canvas.style.borderRadius = '15px';
  canvas.style.border = '2px solid ' + frenchOpen;

  var context = canvas.getContext('2d');
  context.fillStyle = racket;
  context.font = "18px sans-serif";

  var player = new Player();
  var computer = new Computer();
  var ball = new Ball();
  var keysDown = {};

  function render() {
    context.fillStyle = frenchOpen;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = racket;
    player.render(context);
    computer.render(context);
    ball.render(context);
  }

  function update() {
    player.update(keysDown);
    computer.update(ball);
    ball.update(player, computer);
  }

  function step() {
    update();
    render(context);
    animate(step);
  }

  el.appendChild(canvas);
  animate(step);

  var keydownEvent = function(e) {
    keysDown[e.keyCode] = true;
  };
  var keyupEvent = function(e) {
    delete keysDown[e.keyCode];
  };
  var elementErased = function(e) {
    window.removeEventListener('keydown', keydownEvent, false);
    window.removeEventListener('keyup', keyupEvent, false);
    window.removeEventListener('DOMNodeRemoved', elementErased, false);
  };

  window.addEventListener("keydown", keydownEvent);
  window.addEventListener("keyup", keyupEvent);
  window.addEventListener("DOMNodeRemoved", elementErased);

  return el;
}