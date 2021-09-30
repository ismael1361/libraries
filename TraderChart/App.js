const getTrade = ()=>{
    return new Promise((result, reject)=>{
        fetch("./resources/Binance_BTCUSDT_d.csv").then(r => r.text()).then((r)=>{
            r = r.split("\n");
            let t = [], keys = r[1].split(",");

            r.forEach((l, i)=>{
                if(i <= 1){return;}
                l = l.split(",");
                if(l.length !== keys.length){return;}
                
                let n = {};
                n["date"] = new Date((/ [0-9]{2}:[0-9]{2}:[0-9]{2}$/).test(l[1]) ? l[1] : l[1] + " 00:00:00");
                n["open"] = Number(l[3]);
                n["high"] = Number(l[4]);
                n["low"] = Number(l[5]);
                n["close"] = Number(l[6]);
                n["volume"] = Number(l[7]);
                
                t.push(n);
            });

            result(t);
        }).catch(reject);
    });
}

String.prototype.capitalize = function(){
    return this.charAt(0).toUpperCase() + this.slice(1);
}

class TraderChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            boundingClientRect: {width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0},
            timeline_pos: 20
        };

        this.id = "TraderChart_"+Math.round(Math.random()*1000)+"_"+Math.round(Math.random()*1000);

        this.divMain = React.createRef();

        this.isWillUnmount = false;

        this.theme = {
            light: {
                background: "#e0e0e0",
                timeline_color: "#546e7a"
            },
            dark: {
                background: "#263238",
                timeline_color: "#b0bec5"
            }
        }

        this.keysModel = ["date", "open", "high", "low", "close", "volume"];

        this.data = {
            maxValue: 0,
            minValue: 0,
            maxVolume: 0,
            minVolume: 0,
            dateEnd: new Date(),
            dateStart: new Date(),
            data: []
        }

        this.timeline_options = {
            margin_left: 20,
            margin_right: 20,
            width_signal: 10
        }
    }

    loadData({ data }){
        let isDataValid = Array.isArray(data) && data.length > 0 && data.every(v => (v && v.hasOwnProperty && this.keysModel.every(item => v.hasOwnProperty(item))));

        if(isDataValid !== true){return;}

        data.sort((a, b)=>{
            return b["date"] - a["date"];
        });

        let maxValue = -Infinity, minValue = Infinity;
        let maxVolume = -Infinity, minVolume = Infinity;
        let dateStart = new Date(), dateEnd = new Date(0);

        data.forEach(v=>{
            maxValue = Math.max(maxValue, v["open"], v["high"], v["low"], v["close"]);
            minValue = Math.min(minValue, v["open"], v["high"], v["low"], v["close"]);

            maxVolume = Math.max(maxVolume, v["volume"]);
            minVolume = Math.min(minVolume, v["volume"]);

            dateStart = Math.min(dateStart, v["date"]);
            dateEnd = Math.max(dateEnd, v["date"]);
        });

        this.data = {
            maxValue: maxValue,
            minValue: minValue,
            maxVolume: maxVolume,
            minVolume: minVolume,
            dateEnd: new Date(dateEnd),
            dateStart: new Date(dateStart),
            data: data
        };

        this.setState({}, ()=>{
            this.initSVG();
        });
    }

    observeResize(){
        window.clearTimeout(this._observeResizeTimeout);
        window.cancelAnimationFrame(this._observeResizeAnimationFrame);
        if(this.isWillUnmount){ return; }
        this._observeResizeAnimationFrame = window.requestAnimationFrame(()=>{
            if(this.divMain && this.divMain.current){
                const element = this.divMain.current;
                const size = element.getBoundingClientRect();
                const { width: prevWidth, height: prevHeight } = size;
                const { width, height } = this.state.boundingClientRect;

                if(size && JSON.stringify([width, height]) !== JSON.stringify([prevWidth, prevHeight])){
                    this.state.boundingClientRect = JSON.parse(JSON.stringify(size));
                    this._observeResizeTimeout = window.setTimeout(()=>{
                        this.setState({}, ()=>{
                            this.updateSVG();
                        });
                        this.observeResize();
                    }, 100);
                    return;
                }
            }
            
            this.observeResize();
        });
    }

    componentWillUnmount(){
        this.isWillUnmount = true;
        window.cancelAnimationFrame(this._observeResizeAnimationFrame);
    }

    componentDidMount(){
        this.isWillUnmount = false;
        this.observeResize();
        this.loadData(this.props);
    }

    componentDidUpdate(prevProps){
        const { data } = this.props;
        const { data: prevData } = prevProps;

        if(prevData != data){
            this.loadData(this.props);
        }
    }

    getPathRectPanel(){
        let rect = {
            x: 0, y: 0,
            width: 0, height: 0,
            top: 0, left: 0, right: 0, bottom: 0,
            radius: (typeof this.props.radius === "number" && this.props.radius >= 0 ? this.props.radius : 10)
        };

        const { width, height} = this.state.boundingClientRect;

        rect.width = width;
        rect.height = height;

        rect.right = rect.left + rect.width;
        rect.bottom = rect.top + rect.height;

        return "M" + rect.left + "," + rect.top + " h" + (rect.width - rect.radius) + " a" + rect.radius + "," + rect.radius + " 0 0 1 " + rect.radius + "," + rect.radius + " v" + (rect.height - (rect.radius*2)) + " a" + rect.radius + "," + rect.radius + " 0 0 1 " + (-rect.radius) + "," + rect.radius + " h" + (-(rect.width - (rect.radius*2))) + " a" + rect.radius + "," + rect.radius + " 0 0 1 " + (-rect.radius) + "," + (-rect.radius) + " v" + (-(rect.height - (rect.radius*2))) + " a" + rect.radius + "," + rect.radius + " 0 0 1 " + rect.radius + "," + (-rect.radius);
    }

    initSVG = ()=>{
        try{
            const el = this.timelineElement.querySelector("g.timeline_content");
            const { width: width_el } = el.querySelector("g.timeline_days").getBoundingClientRect();
            const { width } = this.state.boundingClientRect;
            const { margin_right } = this.timeline_options;

            const p = Math.round(width_el - (width - margin_right));

            this.state.timeline_pos = -p;
            //this.state.timeline_pos = 0;
            this.updateSVG();
        }catch(e){}
    }

    updateSVG = ()=>{
        try{
            const el = this.timelineElement.querySelector("g.timeline_content");
            const { width: width_el } = el.querySelector("g.timeline_days").getBoundingClientRect();
            const { width } = this.state.boundingClientRect;
            const { margin_left, margin_right } = this.timeline_options;

            let { timeline_pos } = this.state;

            timeline_pos = Math.max(Math.min(timeline_pos, margin_left), -Math.round(width_el - (width - margin_right)));

            el.querySelectorAll("g.timeline_months > text").forEach((t, i)=>{
                let start = Number(t.getAttribute("start-show") || "0");
                let end = Number(t.getAttribute("end-show") || "0");

                if(start > Math.abs(Math.round(timeline_pos - width)) || end < Math.abs(timeline_pos)){return;}

                let quite = Math.abs(Math.round(timeline_pos - (width / 2)));

                let { width: width_text } = t.getBoundingClientRect();

                t.setAttribute("x", Math.round(Math.max(Math.min(quite, end - width_text), start + width_text)));
            });

            el.querySelectorAll("g.timeline_years > text").forEach((t, i)=>{
                let start = Number(t.getAttribute("start-show") || "0");
                let end = Number(t.getAttribute("end-show") || "0");
                let quite = Math.abs(Math.round(timeline_pos - (width / 2)));

                let { width: width_text } = t.getBoundingClientRect()

                t.setAttribute("x", Math.round(Math.max(Math.min(quite, end - width_text), start + width_text)));
            });
            
            this.state.timeline_pos = timeline_pos;
            el.setAttribute("transform", `translate(${timeline_pos}, 0)`);
        }catch(e){}
    }

    timelineEvent = {
        mousedown: ()=>{
            this._timeline_dragging = true;
            this.timelineElement.style.cursor = "move";
        },
        mouseup: ()=>{
            this._timeline_dragging = false;
            this.timelineElement.style.cursor = "auto";
        },
        mouseout: ()=>{
            this.timelineEvent.mouseup();
        },
        mousemove: ({movementX, movementY})=>{
            if(this._timeline_dragging !== true){return;}
            try{
                const el = this.timelineElement.querySelector("g.timeline_content");
                const { width: width_el } = el.querySelector("g.timeline_days").getBoundingClientRect();
                const p = Math.round(this.state.timeline_pos + movementX);
                const { width, height } = this.state.boundingClientRect;
                const { margin_right } = this.timeline_options;

                if(p >= this.timeline_options.margin_left || p <= -Math.round(width_el - (width - margin_right))){
                   return; 
                }

                this.state.timeline_pos = p;
                this.updateSVG();
            }catch(e){}

        }
    }

    applyEventTimeline = (element)=>{
        if(element && element.addEventListener){
            this.timelineElement = element;
            for(let k in this.timelineEvent){
                element.removeEventListener(k, this.timelineEvent[k], true);
                element.addEventListener(k, this.timelineEvent[k], true);
            }
        }
    }

    getTimeline(){
        let dateEnd = new Date(), dateStart = new Date(dateEnd.getFullYear(), dateEnd.getMonth()-4, 1);

        if(new Date(this.data.dateEnd).getDate() !== new Date(this.data.dateStart).getDate()){
            dateEnd = new Date(this.data.dateEnd);
            dateStart = new Date(this.data.dateStart);
        }

        let days = Math.round((dateEnd-dateStart)/(1000*60*60*24));
        let month_days = [];
        let year_days = new Array((dateEnd.getFullYear() - dateStart.getFullYear()) + 1).fill(0);

        const { width, height } = this.state.boundingClientRect;

        const { theme } = this.props;
        const { timeline_pos } = this.state;

        const { width_signal } = this.timeline_options;

        const { timeline_color } = theme in this.theme ? this.theme[theme] : this.theme["light"];
        
        let width_drag = width, height_drag = 50;

        let days_indicator_path = new Array(days+1).fill("");

        days_indicator_path.forEach((v, i)=>{
            let d = new Date(dateStart.getFullYear(), dateStart.getMonth(), dateStart.getDate() + (i + 1));
            let index = (((d.getFullYear() - dateStart.getFullYear()) * 12) + d.getMonth()) - dateStart.getMonth();
            month_days[index] = !month_days[index] ? 1 : month_days[index] + 1;

            year_days[dateEnd.getFullYear() - d.getFullYear()] += 1;
        });

        year_days = year_days.map((v, i)=>{
            let l = ((i + 1)*12)-dateStart.getMonth();
            return month_days.slice(Math.max(0, l-12), l).reduce((a, b)=> a+b, 0);
        });

        days_indicator_path = days_indicator_path.map((v, i)=>`M${i*width_signal} 0 L${i*width_signal} 10 Z`);
        days_indicator_path = days_indicator_path.join(" ");

        let month_indicator_path = month_days.map((v, i)=>{
            if(i >= month_days.length-1){return "";}
            let l = month_days.slice(0, i+1).reduce((a, b)=> a+b, 0);
            return `M${l*width_signal} 0 L${l*width_signal} 20 Z`;
        });
        month_indicator_path = month_indicator_path.join(" ");

        return <g ref={this.applyEventTimeline} className="timeline_drag" transform={`translate(0, ${height-height_drag})`}>
            <g className="timeline_content" transform={`translate(${timeline_pos}, 0)`}>
                <g className="timeline_days" transform="translate(0, 0)" opacity="0.3">
                    <path d={days_indicator_path} stroke={timeline_color} stroke-width="2" fill="none"/>
                </g>
                <g className="timeline_months" transform="translate(0, 0)" opacity="1">
                    <path d={month_indicator_path} stroke={timeline_color} stroke-width="2" fill="none"/>
                    {month_days.map((v, i)=>{
                        let l = month_days.slice(0, i).reduce((a, b)=> a+b, 0);
                        let d = new Date(dateStart.getFullYear(), dateStart.getMonth(), dateStart.getDate() + l + 1);
                        let n = ['JAN', 'FEV', 'MAR', 'ABR', 'MAIO', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
                        n = n[d.getMonth()];

                        return <text x={(l*width_signal) + 15} y="0" transform="translate(0, 16)" fill="#546e7a" font-size="10px" dominant-baseline="central" text-anchor="middle" start-show="0" end-show="1360" start-show={l*width_signal} end-show={(l + v)*width_signal}>{n}</text>
                    })}
                </g>
                <g className="timeline_years" transform="translate(0, 15)" opacity="1">
                    {year_days.map((v, i)=>{
                        let l = year_days.slice(0, i).reduce((a, b)=> a+b, 0);
                        return <text x={(l*width_signal) + 15} y="0" transform={`translate(0, 15)`} fill={timeline_color} font-size="14px" dominant-baseline="central" text-anchor="middle" font-weight="bold" start-show={l*width_signal} end-show={(l + v)*width_signal}>{dateStart.getFullYear() + i}</text>
                    })}
                    
                    {year_days.map((v, i)=>{
                        if(i >= year_days.length-1){return;}
                        let l = year_days.slice(0, i+1).reduce((a, b)=> a+b, 0);
                        return <circle cx={l*width_signal} cy="15" r="5" stroke="none" fill={timeline_color} />
                    })}
                </g>
            </g>
            <rect x="0" y="0" width={width_drag} height={height_drag} fill={"transparent"} stroke="none"/>
        </g>;
    }

    render(){
        const { theme, width, height } = this.props;
        const { boundingClientRect } = this.state;

        const { background } = theme in this.theme ? this.theme[theme] : this.theme["light"];

        return (<div ref={this.divMain} style={{height: (!width ? "auto" : width), height: (!height ? 500 : height), overflow: "hidden", userSelect: "none"}}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={boundingClientRect.width}
                height={boundingClientRect.height}
            >
                <defs>
                    <clipPath id={"RectPanelClip_"+this.id}>
                        <path d={this.getPathRectPanel()} />
                    </clipPath>
                </defs>

                <g clip-path={`url(#${"RectPanelClip_"+this.id})`}>
                    <rect x="0" y="0" width={boundingClientRect.width} height={boundingClientRect.height} fill={background} stroke="none"/>

                    {this.getTimeline()}
                </g>
            </svg>
        </div>);
    }
}

class Main extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            data: []
        }
    }

    componentDidMount(){
        getTrade().then(r => {
            this.setState({data: r});
        }).catch(console.log);
    }

    render(){
        return <div className="grid-chart">
            <div>
                <TraderChart data={this.state.data} theme={"light"} width={"auto"} height={400}/>
            </div>
            <div>
                <TraderChart data={this.state.data} theme={"dark"} width={"auto"} height={500}/>
            </div>
        </div>;
    }
}

ReactDOM.render(<Main />, document.getElementById("app"));
