class Vehicle{
    constructor(idSVG, wheelBase, trackWidth){
        this.main_svg = document.getElementById(idSVG) instanceof SVGElement ? document.getElementById(idSVG) : idSVG instanceof SVGElement ? idSVG : null;

        this.wheelBase = wheelBase || 40;
        this.trackWidth = trackWidth || 65;
        this.car = null;

        this.speed = 0;

        this.FRICTION  = 0.99;
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

        this.keypress = [];

        let colors = ["#f44336", "#E91E63", "#9c27b0", "#673ab7", "#3f51b5", "#2196F3", "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#827717", "#f57f17", "#ff9800", "#ff5722", "#795548", "#757575", "#607d8b"];
        this.color = colors[Math.round(Math.random() * colors.length)];

        this.setup();
    }

    getVehiclePth(){
        let result = [];
        let w = this.trackWidth, h = this.wheelBase;

        let n = (n)=>{return Number(n.toFixed(3))}

        result.push(`M0,${n(h*0.23)} C0,0 ${w},0 ${w},${n(h*0.23)} L${w},${n(h*0.92)} Q${w},${h} ${n(w*0.875)},${h} L${n(w*0.125)},${h} Q0,${h} 0,${n(h*0.92)}`);

        result.push(`M${n(w*0.1)},${n(h*0.169)} A${n(w*0.05)},${n(h*0.015)} 150 0,1 ${n(w*0.225)},${n(h*0.138)} A${n(w*0.05)},${n(h*0.015)} 150 0,1 ${n(w*0.1)},${n(h*0.169)} Z M${n(w*0.775)},${n(h*0.138)} A${n(w*0.05)},${n(h*0.015)} 30 0,1 ${n(w*0.9)},${n(h*0.169)} A${n(w*0.05)},${n(h*0.015)} 30 0,1 ${n(w*0.775)},${n(h*0.138)} Z`);

        result.push(`M${n(w*0.05)},${n(h*0.338)} Q${n(w*0.05)},${n(h*0.308)} ${n(w*0.1)},${n(h*0.308)} Q${n(w*0.475)},${n(h*0.262)} ${n(w*0.9)},${n(h*0.308)} Q${n(w*0.95)},${n(h*0.308)} ${n(w*0.95)},${n(h*0.338)} L${n(w*0.925)},${n(h*0.508)} Q${n(w*0.925)},${n(h*0.538)} ${n(w*0.875)},${n(h*0.538)} Q${n(w*0.425)},${n(h*0.508)} ${n(w*0.125)},${n(h*0.538)} Q${n(w*0.075)},${n(h*0.538)} ${n(w*0.075)},${n(h*0.508)} Z M${n(w*0.063)},${n(h*0.8)} Q${n(w*0.075)},${n(h*0.769)} ${n(w*0.125)},${n(h*0.769)} L${n(w*0.875)},${n(h*0.769)} Q${n(w*0.925)},${n(h*0.769)} ${n(w*0.938)},${n(h*0.8)} L${n(w*0.95)},${n(h*0.831)} Q${n(w*0.95)},${n(h*0.846)} ${n(w*0.925)},${n(h*0.846)} L${n(w*0.075)},${n(h*0.846)} Q${n(w*0.05)},${n(h*0.846)} ${n(w*0.05)},${n(h*0.831)} Z`);

        return result;
    }

    draw(){

    }

    update(time){
        let prevTime = this.lastUpdate;
        let dt = time - prevTime;

        if (prevTime !== 0) {
            if(this.keypress.length > 0){
                this.onKeypress();
            }

            //this.car.update(this, dt);
            this.steering = this.steeringGo;
            this.x += this.speed * Math.cos(this.theta);
            this.y += this.speed * Math.sin(this.theta);
            this.theta += (this.speed / this.wheelBase) * Math.tan(this.steering * this.steerLock);

            this.x = Number(this.x.toFixed(3));
            this.y = Number(this.y.toFixed(3));

            this.speed *= this.FRICTION;

            this.speed = this.speed > -0.01 && this.speed < 0.1 ? 0 : this.speed;

            let rotate = ((this.theta + Math.PI / 2)  * (180/Math.PI))%360;

            if(this.x !== this.prevX || this.y !== this.prevY){
                let x =  Number((this.x + (this.trackWidth / 2)).toFixed(3));
                let y =  Number((this.y + this.wheelBase).toFixed(3));
                //this.car.setAttribute("transform", `rotate(${rotate} ${x} ${y})`);
                this.car.querySelector(".car_shadow > path").setAttribute("transform", `rotate(${rotate} ${x} ${y}) translate(${this.x} ${this.y})`);
                this.car.querySelector(".car").setAttribute("transform", `rotate(${rotate} ${x} ${y}) translate(${this.x} ${this.y})`);
                this.prevX = this.x - this.trackWidth / 2;
                this.prevY = this.y - this.wheelBase / 2;
            }

            this.draw();
        }
        this.lastUpdate = time;
    }

    onKeypress = ()=>{
        this.keypress.forEach((keyCode)=>{
            switch(keyCode){
                case 38: // Up
                    this.move(0.2);
                    break;
                case 40: // Down
                    this.move(-0.1);
                    break;
                case 37: // Left
                    this.steer(-1);
                    break;
                case 39: // Right
                    this.steer(1);
                    break;
                default:
                    break;
            }
        });

        if(!this.keypress.includes(37) && !this.keypress.includes(39)){
            this.steer(0);
        }
    }

    byKeydown = (ev)=>{
        let prevent = ev.keyCode >= 37 && ev.keyCode <= 40;
        if(prevent && !this.keypress.includes(ev.keyCode)){
            this.keypress.push(ev.keyCode);
        }else{
            prevent = false;
        }
        
        if(prevent){
            ev.preventDefault();
        }
    }

    byKeyup = (ev)=>{
        let prevent = ev.keyCode >= 37 && ev.keyCode <= 40;
        if(this.keypress.includes(ev.keyCode)){
            let i = this.keypress.indexOf(ev.keyCode);
            this.keypress.splice(i, 1);
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
        this.acceleration += accel;
        this.speed += accel;
        this.acceleration = Math.max(Math.min(this.acceleration, 5), -2);
        this.speed = Math.max(Math.min(this.speed, 5), -2);
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

        let p = this.getVehiclePth(), g, path;

        g = document.createElementNS(namespace, "g");
        g.setAttributeNS(null, "class", "car_shadow");
        g.setAttributeNS(null, "transform", "translate(10, 10)");
        this.car.appendChild(g);

        path = document.createElementNS(namespace, "path");
        path.setAttributeNS(null, "d", p[0]);
        path.setAttributeNS(null, "fill", "rgba(0, 0, 0, .4)");
        g.appendChild(path);

        g = document.createElementNS(namespace, "g");
        g.setAttributeNS(null, "class", "car");
        this.car.appendChild(g);

        path = document.createElementNS(namespace, "path");
        path.setAttributeNS(null, "d", p[0]);
        path.setAttributeNS(null, "fill", this.color);
        g.appendChild(path);

        path = document.createElementNS(namespace, "path");
        path.setAttributeNS(null, "d", p[1]);
        path.setAttributeNS(null, "fill", "rgba(255, 255, 255, .4)");
        g.appendChild(path);

        path = document.createElementNS(namespace, "path");
        path.setAttributeNS(null, "d", p[2]);
        path.setAttributeNS(null, "fill", "rgba(255, 255, 255, .2)");
        g.appendChild(path);

        let loop = (t)=>{
            this.update(t);
            window.requestAnimationFrame(loop);
        }

        window.requestAnimationFrame(loop);

        document.addEventListener("keydown", this.byKeydown);
        document.addEventListener("keyup", this.byKeyup);
    }
}