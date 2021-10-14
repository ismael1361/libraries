/**
 * @license Vehicle.js v1.0.0 31/10/2017
 * https://www.xarg.org/book/control/ackerman-steering/
 *
 * Copyright (c) 2017, Robert Eisele (robert@xarg.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/
//https://i0.wp.com/gamermatters.com/wp-content/uploads/2021/07/Mini-Motorways-PC-Review.jpg?fit=1920%2C1080&ssl=1

/*
<svg width="500" height="500" viewBox="0 0 40 65">
   <path d="M0,15 C0,0 40,0 40,15 L40,60 Q40,65 35,65 L5,65 Q0,65 0,60" fill="#2196F3"/>
   
   <path d="M3,22 Q3,20 5,20 Q18,17 35,20 Q37,20 37,22 L38,33 Q38,35 36,35 Q18,33 4,35 Q2,35 2,33" fill="rgba(255, 255, 255, .2)"/>
   
</svg> 
*/

/*let p = "M3,22 Q3,20 5,20 Q18,17 35,20 Q37,20 37,22 L38,33 Q38,35 36,35 Q18,33 4,35 Q2,35 2,33".replace(/([0-9]+)\,([0-9]+)/gi, (a, b, c)=>{
  b = Number(b) / 40;
  c = Number(c) / 65;
  return "${n(w*"+Number(b.toFixed(3))+")},${n(h*"+Number(c.toFixed(3))+")}";
});

console.log(p);*/

const getVehiclePth = (w, h)=>{
    let result = [];

    let n = (n)=>{return Number(n.toFixed(3))}

    result.push(`M0,${n(h*0.23)} C0,0 ${w},0 ${w},${n(h*0.23)} L${w},${n(h*0.92)} Q${w},${h} ${n(w*0.875)},${h} L${n(w*0.125)},${h} Q0,${h} 0,${n(h*0.92)}`);

    result.push(`M${n(w*0.046)},${n(h*0.55)} Q${n(w*0.046)},${n(h*0.5)} ${n(w*0.076)},${n(h*0.5)} Q${n(w*0.27)},${n(h*0.42)} ${n(w*0.53)},${n(h*0.5)} Q${n(w*0.56)},${n(h*0.5)} ${n(w*0.56)},${n(h*0.55)} L${n(w*0.58)},${n(h*0.825)} Q${n(w*0.58)},${n(h*0.875)} ${n(w*0.55)},${n(h*0.875)} Q${n(w*0.27)},${n(h*0.825)} ${n(w*0.061)},${n(h*0.875)} Q${n(w*0.03)},${n(h*0.875)} ${n(w*0.03)},${n(h*0.825)}`);

    return result;
}

function Vehicle_demo(type, wheelBase, trackWidth) {
  // radstand, spur

  this.wheelBase = wheelBase;
  this.trackWidth = trackWidth;

  this.car = Vehicle_demo.Types[type];
  this.setup();
}

Vehicle_demo.Types = {
  loader: {
    steerLock: (20 / 180) * Math.PI,
    steerSpeed: 3, // 3°/sec
    update: function (base, dt) {
      base.steering = Math.min(
        1,
        Math.max(
          -1,
          base.steering + base.steeringGo * this.steerSpeed * dt * 0.001
        )
      );
      base.x += base.speed * Math.cos(base.theta);
      base.y += base.speed * Math.sin(base.theta);
      base.theta +=
        (base.speed / base.wheelBase) *
        Math.tan(base.steering * this.steerLock);
    },
    draw: function (base) {
      var ctx = base.ctx;

      var x = base.x;
      var y = base.y;
      var theta = base.theta;
      var phi = this.steerLock * base.steering;

      var wheelBase = base.wheelBase;
      var trackWidth = base.trackWidth;

      var wheelWidth = 10;
      var wheelHeight = 30;

      ctx.save();
      ctx.rotate(theta + Math.PI / 2);

      // Car width
      var w = trackWidth / 2; // weite bis mitte vom rad
      var h = wheelBase / 2; // vertikaler radabstand (außenseite zu außenseite)

      // Ratbreite/höhe
      var wh = wheelHeight; // wheel height
      var ww = wheelWidth; // back wheel width

      ctx.beginPath();

      // ICC
      /*
       if (phi != 0) {
       var R = 2 * h / Math.tan(phi);
       ctx.moveTo(0, 0);
       ctx.lineTo(R, 0);
       }
       */

      ctx.moveTo(Math.sin(phi) * h, Math.cos(phi) * h);
      ctx.lineTo(0, 0);
      ctx.lineTo(Math.sin(-phi) * -h, Math.cos(-phi) * -h);

      // vorderräder
      ctx.rotate(phi);

      ctx.rect(-w - ww, -2 * h, 2 * w + ww * 2, h / 2);

      ctx.rect(-w - ww / 2, -wh / 2 - h, ww, wh);
      ctx.rect(+w + ww / 2 - ww, -wh / 2 - h, ww, wh);
      ctx.moveTo(-w, -h);
      ctx.lineTo(+w, -h);

      ctx.moveTo(-w + 2 * ww, -h);
      ctx.lineTo(-w + 2 * ww, -h - wh);

      ctx.moveTo(w - 2 * ww, -h);
      ctx.lineTo(w - 2 * ww, -h - wh);

      for (var i = -w - ww / 2; i <= w + ww / 2; i += 4) {
        ctx.moveTo(i, -2 * h);
        ctx.lineTo(i, -2 * h - 5);
      }

      ctx.rotate(-2 * phi);

      // Hinterräder
      ctx.rect(-w - ww / 2, -wh / 2 + h, ww, wh);
      ctx.rect(+w + ww / 2 - ww, -wh / 2 + h, ww, wh);
      ctx.moveTo(-w, h);
      ctx.lineTo(+w, h);
      ctx.stroke();
      ctx.restore();
    },
  },
  ackerman: {
    steerLock: (30 / 180) * Math.PI,
    steerSpeed: 0, // 0°/sec
    update: function (base) {
      base.steering = base.steeringGo;
      base.x += base.speed * Math.cos(base.theta);
      base.y += base.speed * Math.sin(base.theta);
      base.theta +=
        (base.speed / base.wheelBase) *
        Math.tan(base.steering * this.steerLock);
    },
    draw: function (base) {
      var ctx = base.ctx;

      var theta = base.theta;
      var phi = this.steerLock * base.steering;

      var wheelBase = base.wheelBase;
      var trackWidth = base.trackWidth;

      var phiI = Math.atan2(
        2 * wheelBase * Math.sin(phi),
        2 * wheelBase * Math.cos(phi) - trackWidth * Math.sin(phi)
      );
      var phiO = Math.atan2(
        2 * wheelBase * Math.sin(phi),
        2 * wheelBase * Math.cos(phi) + trackWidth * Math.sin(phi)
      );

      var frontWheelWidth = 10;
      var frontWheelHeight = 30;
      var backWheelWidth = 15;
      var backWheelHeight = 30;

      ctx.save();
      ctx.rotate(theta - Math.PI / 2);

      ctx.beginPath();
      // Middle axis
      ctx.moveTo(0, 0);
      ctx.lineTo(0, wheelBase);

      // Back axis
      ctx.moveTo(-trackWidth / 2, 0);
      ctx.lineTo(trackWidth / 2, 0);

      // Front axis
      ctx.moveTo(-trackWidth / 2, wheelBase);
      ctx.lineTo(trackWidth / 2, wheelBase);
      ctx.stroke();

      // Backwheels
      ctx.strokeRect(
        -trackWidth / 2 - backWheelWidth / 2,
        -backWheelHeight / 2,
        backWheelWidth,
        backWheelHeight
      );
      ctx.strokeRect(
        trackWidth / 2 - backWheelWidth / 2,
        -backWheelHeight / 2,
        backWheelWidth,
        backWheelHeight
      );

      // Front wheels
      ctx.save();
      ctx.translate(-trackWidth / 2, wheelBase);
      ctx.rotate(phiI);
      ctx.strokeRect(
        -frontWheelWidth / 2,
        -frontWheelHeight / 2,
        frontWheelWidth,
        frontWheelHeight
      );
      ctx.restore();

      ctx.save();
      ctx.translate(trackWidth / 2, wheelBase);
      ctx.rotate(phiO);
      ctx.strokeRect(
        -frontWheelWidth / 2,
        -frontWheelHeight / 2,
        frontWheelWidth,
        frontWheelHeight
      );
      ctx.restore();

      // ICC
      /*
       if (phi !== 0) {
       ctx.moveTo(0, 0);
       //    sin(90-phi)/w = sin(phi)/L
       // => w = L * sin(90-phi) / sin(phi)
       // => w = L / tan(phi)
       ctx.lineTo(-wheelBase / Math.tan(phi), 0);
       ctx.stroke();
       }*/

      ctx.restore();
    },
  },
};

Vehicle_demo.prototype = {
  speed: 0,
  acceleration: 0,
  steering: 0,
  steeringGo: 0,
  x: Math.random() * (window.innerWidth - 300),
  y: Math.random() * (window.innerHeight - 300),
  prevX: 0,
  prevY: 0,
  theta: 0,
  lastUpdate: 0,

  wheelBase: 0,
  trackWidth: 0,
  car: null,
  canvas: null,
  canvasWidth: 0,
  canvasHeight: 0,
  ctx: null,

  update: function (time) {
    var prevTime = this.lastUpdate;
    var dt = time - prevTime;

    this.ctx.clearRect(
      -this.canvasWidth / 2,
      -this.canvasWidth / 2,
      this.canvasWidth,
      this.canvasWidth
    );

    if (prevTime !== 0) {
      this.car.update(this, dt);
      // Position canvas
      if (this.x !== this.prevX) {
        this.canvas.style.left = this.x + "px";
        this.prevX = this.x - this.canvasWidth / 2;
      }

      if (this.y !== this.prevY) {
        this.canvas.style.top = this.y + "px";
        this.prevY = this.y - this.canvasHeight / 2;
      }

      this.car.draw(this);
    }
    this.lastUpdate = time;
  },

  move: function (accel) {
    this.acceleration = accel;
    this.speed = 5 * accel;
  },
  steer: function (pct) {
    this.steeringGo = pct;
  },

  setup: function () {
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");

    this.canvasWidth =
      this.canvasHeight =
      canvas.width =
      canvas.height =
        4 * this.wheelBase;
    canvas.style = "position:fixed;";
    ctx.translate(canvas.width / 2, canvas.height / 2);

    document.body.appendChild(canvas);

    this.canvas = canvas;
    this.ctx = ctx;
  },
};
