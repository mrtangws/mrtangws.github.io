
//import * from "./script/jquery.min.js"
// import * from "./script/aws-sdk-2.487.0.min.js"
// import * from "./script/aws-cognito-sdk.min.js"
// import * from "./script/amazon-cognito-identity.min.js"
//import {CognitoAuth} from 'amazon-cognito-auth-js';
//var AWS = require('aws-sdk');
//import { CognitoIdentityProviderClient, AddCustomAttributesCommand } from "@aws-sdk/client-cognito-identity-provider";

var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

const Type = {
  BALL: 0,
  BLOCK: 1,
  WALL: 2,
  PILLAR: 3,
  PADDLE: 4,
  BRICK: 5,
  NPC: 6
}

class Point
{
  constructor(x = 0, y = 0)
  {
    this.x = x;
    this.y = y;
  }
  set(x = 0, y = x)
  {
    this.x = x;
    this.y = y;
  }
}

class GameObject
{
  constructor(type)
  {
    this.type = type;
    this.active = false;
    this.pos = new Vector2(0, 0);
    this.scale = new Vector2(1, 1);
    this.vel = new Vector2(0, 0);
    this.dir = new Vector2(0, 1);
    this.color = "#" + Math.floor(0 + Math.random()*8388608).toString(16);
    this.point = new Point();
  }
}

// var refresh = 33.3;
var gra = new Vector2(0, -9.8);
var goList = new Array();
var then = Date.now() / 1000;
var rightPressed = false;
var leftPressed = false;
//var interval;
var pause = false;
var pillar = new GameObject(Type.pillar);
const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
const brickRowCount = 5;
const brickColumnCount = 10;
const brickWidth = canvas.width / brickColumnCount;
const brickHelight = canvas.height * 0.4 / brickRowCount;
var score = 0;
var lives = 5;
var targetX = canvas.width * 0.5;
const MAX_SPEED = 100;
var npc = new GameObject(Type.NPC);
const gridSize = 20;
const gridWidth = canvas.width / gridSize;
const gridHeight = canvas.height / gridSize;
npc.active = true;
npc.point = new Point(0,0);
npc.scale.set(gridSize, gridSize);
goList.push(npc);
var fetchTimer = 5;
var firstUpdate = true;
var dynamodb = null;
var lambda;

for(var i = 0; i < lives; ++i)
{
  var go = new GameObject(Type.BALL);
  go.active = true;
  go.vel.set(randomFloat(-50, 50), randomFloat(-50, 50));
  go.pos.set(canvas.width * 0.5 + randomFloat(-40, 40), 100 + randomFloat(-40, 40));
  go.scale.set(canvas.height / 25, canvas.height / 25);
  goList.push(go);
}
// for(var row = 0; row < brickRowCount; ++row)
// {
//   for(var col = 0; col < brickColumnCount; ++col)
//   {
//     var go = new GameObject(Type.BRICK);
//     go.active = true;
//     go.pos.set((col + 0.5) * brickWidth, canvas.height * 0.5 + (row + 0.5) * brickHelight);
//     go.scale.set(brickWidth, brickHelight);
//     goList.push(go);
//   }
// }
var paddle = new GameObject(Type.PADDLE);
paddle.active = true;
paddle.scale.set(canvas.width / 5, canvas.height / 12.5);
paddle.pos.set(canvas.width * 0.5, paddle.scale.y / 2);
//paddle.active = false;
goList.push(paddle);

function Pause()
{
  pause = !pause;
}

//let pauseButton = document.getElementById("pauseButton");
// pauseButton.addEventListener('click', event => {
//   Pause();
// });
// pauseButton.addEventListener('onclick', event => {
//   Pause();
// });

function collide2(go1, go2)
{
  switch(go2.type)
  {
    case Type.BALL:
    {
      const combinedRadii2 = (go1.scale.x + go2.scale.x) * (go1.scale.x + go2.scale.x);
      const p1p2 = go1.pos.subtract(go2.pos);
      const v1v2 = go1.vel.subtract(go2.vel);
      if(p1p2.magnitudeSqr() < combinedRadii2 && p1p2.dot(v1v2) < 0)
      {
        const N = p1p2.normalize();
        const m1 = go1.scale.x * go1.scale.x;
        const m2 = go2.scale.x * go2.scale.x;
        const dVel = N.scale(v1v2.dot(N) * 2.0 * m2 / (m1 + m2));
        go1.vel = go1.vel.subtract(dVel);
        go2.vel = go2.vel.add(dVel);
        return true;
      }
      break;
    }
    case Type.PADDLE:
    case Type.BRICK:
    {
      var N = go2.dir;
      var NP = new Vector2(N.y, -N.x);
      const r = go1.scale.x;
      const l = go2.scale.x * 0.5;
      const h = go2.scale.y * 0.5;
      pillar.scale.set(h, h);
      const combinedRadii2 = r * r;
      const v1v2 = go1.vel.subtract(go2.vel);
      const p1w0 = go1.pos.subtract(go2.pos);
      if(p1w0.dot(N) < 0)
        N = N.scale(-1);
      if(p1w0.dot(NP) < 0)
        NP = NP.scale(-1);
      if(p1w0.dot(N) < r + h && p1w0.dot(NP) < l && v1v2.dot(N) < 0)
      {
        go1.vel = go1.vel.subtract(N.scale(v1v2.dot(N) * 2.0));
        return true;
      }
      if(p1w0.dot(NP) < r + l && p1w0.dot(N) < h && v1v2.dot(NP) < 0)
      {
        go1.vel = go1.vel.subtract(NP.scale(v1v2.dot(NP) * 2.0));
        return true;
      }
      //if(p1w0.dot(N) > h && p1w0.dot(NP) > l)
      {
        for(var i = 0; i < corners.length; ++i)
        {
          pillar.pos.set(go2.pos.x + corners[i][0] * l, go2.pos.y + corners[i][1] * h);
          const p1p2 = go1.pos.subtract(pillar.pos);
          if(p1p2.magnitudeSqr() < combinedRadii2 && p1p2.dot(v1v2) < 0)
          {
            const N = p1p2.normalize();
            go1.vel = go1.vel.subtract(N.scale(v1v2.dot(N) * 2.0));
            return true;
          }
        }
      }
      break;
    }
  }
  return false;
}
function collide(go1, go2)
{
  const retVal = collide2(go1, go2);
  if(retVal)
  {
    /*go1.vel.capSpeed(MAX_SPEED);
    if(go2.type == Type.BALL)
      go2.vel.capSpeed(MAX_SPEED);*/
    if(go2.type == Type.BRICK)
    {
      go2.active = false;
      ++score;
      if(score == brickRowCount * brickColumnCount)
      {
        alert("YOU WIN, CONGRATULATIONS!");
        document.location.reload();
        //clearInterval(interval);
      }
    }
  }
  return retVal;
}

async function invokeLamda() {
  if(lambda == null) {
    lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
    // lambda.addLayerVersionPermission(params, function (err, data) {
    //   if (err) console.log(err, err.stack); // an error occurred
    //   else     console.log(data);           // successful response
    // });
  }
  var params = {
    FunctionName: 'arn:aws:lambda:ap-southeast-2:319625542699:function:node-two', /* required */
    //ClientContext: 'STRING_VALUE',
    InvocationType: 'RequestResponse',// | RequestResponse | DryRun,
    LogType: 'None',// | Tail,
    Payload: '' /* Strings will be Base-64 encoded on your behalf */,
    // Qualifier: 'STRING_VALUE'
  };
  const response = await lambda.invoke(params).promise();
  if(response.StatusCode != 200){
    console.log('Failed to get response from lambda function');
  }
  // console.log(response);
  // console.log(response.Payload);
  const payload = JSON.parse(response.Payload);
  const obj = JSON.parse(payload.body);
  console.log(obj);
  npc.point.x = obj.Item.x;
  npc.point.y = obj.Item.y;
  return JSON.parse(response.Payload);
  // lambda.invoke(params, function(err, data) {
  //   if (err) console.log(err, err.stack); // an error occurred
  //   else     console.log(data);           // successful response
  // });
}

function update(dt)
{
  if(firstUpdate)
  {

  }
  if(pause)
    dt = 0;
  fetchTimer -= dt;
  if(fetchTimer <= 0)
  {
    fetchTimer = 300;

    // fetch("https://ia4rxpwsdxjledbg5wxcvcq7he0rbabn.lambda-url.ap-southeast-2.on.aws/").then(function(response) {
    //   return response.json();
    // }).then(function(data) {
    //   console.log(data.body);
    //   const obj = JSON.parse(data.body);
    //   npc.point.x = obj.Item.x;
    //   npc.point.y = obj.Item.y;
    // }).catch(function() {
    //   console.log("http get failed");
    // });
    //if(getCognitoIdentityCredentials() == false)
      getCurrentLoggedInSession();
    if(dynamodb == null)
    {
      //AWS.config.region = 'ap-southeast-2';
      AWS.config.update({
        region: 'ap-southeast-2'
      });
      dynamodb = new AWS.DynamoDB();
    }
    // if(dynamodb != null)
    // {
    //   var params = {
    //    Key: {
    //     "id": {
    //       S: "666"
    //      }
    //    },
    //    TableName: "tableOne"
    //   };
    //   dynamodb.getItem(params, function(err, data) {
    //     if (err) console.log(err, err.stack); // an error occurred
    //     else {
    //       console.log(data);           // successful response
    //       console.log("x: ", data.Item.x.N, " y:", data.Item.y.N);
    //       //const obj = JSON.parse(data.Item);
    //       npc.point.x = data.Item.x.N;
    //       npc.point.y = data.Item.y.N;
    //     }
    //   });
    // }
    invokeLamda();
  }
  //console.log("dt:", dt);
  if(leftPressed == rightPressed)
  {
    paddle.vel.x = 0;
    const diffX = targetX - paddle.pos.x;
    paddle.vel.x = Math.max(Math.min(diffX, 250), -250);
  }
  else if(rightPressed) {
    paddle.vel.x = 200;
  }
  else {
    paddle.vel.x = -200;
  }
  for(var i = 0; i < goList.length; ++i) //collision check
  {
    var go = goList[i];
    if(go.active)
    {
      for(var j = i + 1; j < goList.length; ++j)
      {
        var other = goList[j];
        if(other.active)
        {
          if(go.type == Type.BALL)
          {
            collide(go, other);
          }
          else if(other.type == Type.BALL)
          {
            collide(other, go);
          }
        }
      }
    }
  }
  //var count = 0;
  for(var i = 0; i < goList.length; ++i) //motion
  {
    var go = goList[i];
    if(go.active)
    {
      //go.vel = go.vel.add(gra.scale(dt));
      go.pos = go.pos.add(go.vel.scale(dt));
      if(go.type == Type.BALL)
      {
        //++count;
        if(go.pos.x < go.scale.x && go.vel.x < 0 || go.pos.x > canvas.width - go.scale.x && go.vel.x > 0)
          go.vel.x = -go.vel.x;
        if(go.pos.y < go.scale.x && go.vel.y < 0 || go.pos.y > canvas.height - go.scale.x && go.vel.y > 0)
          go.vel.y = -go.vel.y;
        // if(go.pos.x < 0 || go.pos.x > canvas.width || go.pos.y < go.scale.x || go.pos.y > canvas.height)
        // {
        //   go.active = false;
        //   --lives;
        // }
      }
      if(go.type == Type.PADDLE)
      {
        if(go.pos.x < go.scale.x * 0.5)
        {
          go.pos.x = go.scale.x * 0.5;
          go.vel.x = 0;
        }
        if(go.pos.x > canvas.width - go.scale.x * 0.5)
        {
          go.pos.x = canvas.width - go.scale.x * 0.5;
          go.vel.x = 0;
        }
      }
    }
  }
  if(lives == 0)
  {
    lives = -1;
    alert("GameOver");
    document.location.reload();
    //clearInterval(interval);
  }
}
function drawGO(go)
{
  ctx.beginPath();
  switch(go.type)
  {
    case Type.BALL:
      ctx.arc(go.pos.x, canvas.height - go.pos.y, go.scale.x, 0, Math.PI*2);
      ctx.fillStyle = go.color;
      ctx.fill();
      break;
    case Type.NPC:
      ctx.rect(go.point.x * gridSize, canvas.height - go.point.y * gridSize - go.scale.y, go.scale.x, go.scale.y);
      ctx.fillStyle = go.color;
      ctx.fill()
      break;
    case Type.PADDLE:
    case Type.BRICK:
      ctx.rect(go.pos.x - go.scale.x * 0.5, canvas.height - go.pos.y - go.scale.y * 0.5, go.scale.x, go.scale.y);
      ctx.fillStyle = go.color;
      ctx.fill()
      break;
  }
  ctx.closePath();
}
function draw()
{
  //for(var i = 0; i < goList.length; ++i)
  goList.forEach(function(go)
  {
    if(go.active)
    {
      drawGO(go);
    }
  });
  ctx.font = "16px Arial";
  ctx.fillStyle = "#FF9500";
  ctx.fillText("Score: "+score, 8, 20);

  ctx.font = "16px Arial";
  ctx.fillStyle = "#FF9500";
  ctx.fillText("Lives: "+lives, canvas.width-65, 20);
}
function loop()
{
  var now = Date.now() / 1000;
  var elapsedTime = now - then;
  then = now;
  //console.log(elapsedTime);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  update(elapsedTime);
  draw();
  requestAnimationFrame(loop);
}
document.addEventListener("keydown", function(e)
{
  if(e.key == "Right" || e.key == "ArrowRight" || e.key == "d" || e.key == "D")
  {
      rightPressed = true;
  }
  if(e.key == "Left" || e.key == "ArrowLeft" || e.key == "a" || e.key == "A")
  {
      leftPressed = true;
  }
  //console.log("screenX", e.screenX);
});
document.addEventListener("keyup", function(e)
{
  if(e.key == "Right" || e.key == "ArrowRight" || e.key == "d" || e.key == "D")
  {
      rightPressed = false;
  }
  if(e.key == "Left" || e.key == "ArrowLeft" || e.key == "a" || e.key == "A")
  {
      leftPressed = false;
  }
});
document.addEventListener("mousemove", function(e)
{
  //console.log("offsetX:", e.offsetX);
  //targetX = e.offsetX;
  var relativeX = e.clientX - canvas.offsetLeft;
  if(relativeX > 0 && relativeX < canvas.width) {
    targetX = relativeX;
  }
});
//interval = setInterval(loop, refresh);
loop();
