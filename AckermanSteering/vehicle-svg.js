class Vehicle{
    constructor(idSVG, wheelBase, trackWidth){
        this.main_svg = document.getElementById(idSVG) instanceof SVGElement ? document.getElementById(idSVG) : idSVG instanceof SVGElement ? idSVG : null;

        this.wheelBase = wheelBase || 40;
        this.trackWidth = trackWidth || 65;
        this.car = null;

        this.speed = 0;
        this.acceleration = 0;
        this.steering = 0;
        this.steeringGo = 0;
        this.x = Math.random() * (window.innerWidth - 300);
        this.y = Math.random() * (window.innerHeight - 300);
        this.prevX = 0;
        this.prevY = 0;
        //this.theta = (2 * Math.PI) / 3;
        this.theta = 0;
        this.lastUpdate = 0;

        this.steerLock = (30 / 180) * Math.PI;

        this.width = 0;
        this.height = 0;

        this.setup();
    }

    getVehiclePth(){
        let result = [];
        let w = this.trackWidth, h = this.wheelBase;

        let n = (n)=>{return Number(n.toFixed(3))}

        result.push(`M0,${n(h*0.23)} C0,0 ${w},0 ${w},${n(h*0.23)} L${w},${n(h*0.92)} Q${w},${h} ${n(w*0.875)},${h} L${n(w*0.125)},${h} Q0,${h} 0,${n(h*0.92)}`);

        result.push(`M${n(w*0.075)},${n(h*0.338)} Q${n(w*0.075)},${n(h*0.308)} ${n(w*0.125)},${n(h*0.308)} Q${n(w*0.45)},${n(h*0.262)} ${n(w*0.875)},${n(h*0.308)} Q${n(w*0.925)},${n(h*0.308)} ${n(w*0.925)},${n(h*0.338)} L${n(w*0.95)},${n(h*0.508)} Q${n(w*0.95)},${n(h*0.538)} ${n(w*0.9)},${n(h*0.538)} Q${n(w*0.45)},${n(h*0.508)} ${n(w*0.1)},${n(h*0.538)} Q${n(w*0.05)},${n(h*0.538)} ${n(w*0.05)},${n(h*0.508)}`);

        return result;
    }

    draw(){

    }

    update(time){
        let prevTime = this.lastUpdate;
        let dt = time - prevTime;

        if (prevTime !== 0) {
            //this.car.update(this, dt);
            this.steering = this.steeringGo;
            this.x += this.speed * Math.cos(this.theta);
            this.y += this.speed * Math.sin(this.theta);
            this.theta += (this.speed / this.wheelBase) * Math.tan(this.steering * this.steerLock);

            let rotate = ((this.theta + Math.PI / 2)  * (180/Math.PI))%360;

            if(this.x !== this.prevX || this.y !== this.prevY){
                let x =  this.x + (this.trackWidth / 2);
                let y =  this.y + this.wheelBase;
                this.circle.setAttributeNS(null, "cx", x);
                this.circle.setAttributeNS(null, "cy", y);
                this.car.setAttribute("transform", `rotate(${rotate} ${x} ${y}) translate(${this.x} ${this.y})`);
                this.prevX = this.x - this.trackWidth / 2;
                this.prevY = this.y - this.wheelBase / 2;
            }

            this.draw();
        }
        this.lastUpdate = time;
    }

    byKeydown = (ev)=>{
        let prevent = true;
        switch (ev.keyCode) {
            case 38: // Up
                this.move(1);
                break;
            case 40: // Down
                this.move(-1);
                break;
            case 37: // Left
                this.steer(-1);
                break;
            case 39: // Right
                this.steer(1);
                break;
            default:
                prevent = false;
        }
        if(prevent){
            ev.preventDefault();
        }
    }

    byKeyup = (ev)=>{
        let prevent = true;
        switch(ev.keyCode){
            case 38: // Up
                this.move(0);
                break;
            case 40: // Down
                this.move(0);
                break;
            case 37: // Left
                this.steer(0);
                break;
            case 39: // Right
                this.steer(0);
                break;
            default:
                prevent = false;
        }
        if(prevent){
            ev.preventDefault();
        }
    }

    toDegrees(degrees){
        this.theta = degrees * (Math.PI/180);
        return this.theta;
    }

    move(accel){
        this.acceleration = accel;
        this.speed = 5 * accel;
    }

    steer(pct){
        this.steeringGo = pct;
    }

    setup(){
        let namespace = "http://www.w3.org/2000/svg";
        if(this.main_svg === null){
            this.main_svg = document.createElementNS(namespace, "svg");
            this.main_svg.setAttributeNS(null, "width", "500");
            this.main_svg.setAttributeNS(null, "height", "500");
            document.body.appendChild(this.main_svg);
        }

        this.car = document.createElementNS(namespace, "g");
        this.main_svg.appendChild(this.car);

        let p = this.getVehiclePth();

        let path = document.createElementNS(namespace, "path");
        path.setAttributeNS(null, "d", p[0]);
        path.setAttributeNS(null, "fill", "#2196F3");
        this.car.appendChild(path);

        path = document.createElementNS(namespace, "path");
        path.setAttributeNS(null, "d", p[1]);
        path.setAttributeNS(null, "fill", "rgba(255, 255, 255, .2)");
        this.car.appendChild(path);

        this.circle = document.createElementNS(namespace, "circle");
        this.circle.setAttributeNS(null, "fill", "#f44336");
        this.circle.setAttributeNS(null, "r", "5");
        this.main_svg.appendChild(this.circle);

        let loop = (t)=>{
            this.update(t);
            window.requestAnimationFrame(loop);
        }

        window.requestAnimationFrame(loop);

        document.addEventListener("keydown", this.byKeydown);
        document.addEventListener("keyup", this.byKeyup);

        /*var canvas = document.createElement("canvas");
        var ctx = canvas.getContext("2d");

        this.canvasWidth = this.canvasHeight = canvas.width = canvas.height = 4 * this.wheelBase;
        canvas.style = "position:fixed;";

        ctx.translate(canvas.width / 2, canvas.height / 2);

        document.body.appendChild(canvas);

        this.canvas = canvas;
        this.ctx = ctx;*/
    }
}