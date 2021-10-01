//https://www.freecodecamp.org/news/how-to-build-historical-price-charts-with-d3-js-72214aaf6ba3/

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
            data: [],
            isDataValid: false
        }

        this.timeline_options = {
            margin_left: 20,
            margin_right: 20,
            margin_bottom: 2,
            width_signal: 10,
            height: 40
        }
    }

    loadData({ data }){
        let isDataValid = Array.isArray(data) && data.length > 0 && data.every(v => (v && v.hasOwnProperty && this.keysModel.every(item => v.hasOwnProperty(item))));

        if(isDataValid !== true){return;}

        let { numberOfPricePoints } = this.props;
        numberOfPricePoints = typeof numberOfPricePoints === "number" ? (Math.max(7, numberOfPricePoints) - 1) : 49;

        data.sort((a, b)=>{
            return b["date"] - a["date"];
        });

        let maxValue = -Infinity, minValue = Infinity;
        let maxVolume = -Infinity, minVolume = Infinity;
        let dateStart = new Date(), dateEnd = new Date(0);

        const result = data.map((v, index)=>{
            maxValue = Math.max(maxValue, v["open"], v["high"], v["low"], v["close"]);
            minValue = Math.min(minValue, v["open"], v["high"], v["low"], v["close"]);

            maxVolume = Math.max(maxVolume, v["volume"]);
            minVolume = Math.min(minVolume, v["volume"]);

            dateStart = Math.min(dateStart, v["date"]);
            dateEnd = Math.max(dateEnd, v["date"]);

            const start = Math.max(0, index - numberOfPricePoints);
            const end = index;

            const subset = data.slice(start, end + 1);
            const sum = subset.reduce((a, b) => (a + b['close']), 0);

            v["average"] = (sum / subset.length);
            return v;
        });

        this.data = {
            maxValue: maxValue,
            minValue: minValue,
            maxVolume: maxVolume,
            minVolume: minVolume,
            dateEnd: new Date(dateEnd),
            dateStart: new Date(dateStart),
            data: result,
            isDataValid: true
        };

        console.log(this.data.data[0]);

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
            let { timelineAnchor } = this.props;

            let { timeline_pos } = this.state;

            timelineAnchor = String(timelineAnchor).toLowerCase();
            timelineAnchor = ["start", "end", "middle"].includes(timelineAnchor) ? timelineAnchor : "middle";

            timeline_pos = Math.max(Math.min(timeline_pos, margin_left), -Math.round(width_el - (width - margin_right)));

            const labelsList = el.querySelectorAll("g.timeline_months > text, g.timeline_years > text");

            let labelWidth = 0;

            labelsList.forEach((t, i)=>{
                let { width } = t.getBoundingClientRect();
                labelWidth = Math.max(width, labelWidth);
            });

            labelsList.forEach((t, i)=>{
                let start = Number(t.getAttribute("start-show") || "0");
                let end = Number(t.getAttribute("end-show") || "0");

                if(start > Math.abs(Math.round(timeline_pos - width)) || end < Math.abs(timeline_pos)){return;}

                let { width: width_text } = t.getBoundingClientRect();

                let to = timelineAnchor === "middle" ? (width / 2) : timelineAnchor === "end" ? width-(labelWidth*1.5) : (labelWidth*1.5);

                let quite = Math.abs(Math.round(timeline_pos - to));

                t.setAttribute("x", Math.round(Math.max(Math.min(quite, end - width_text), start + width_text)));
            });
            
            this.state.timeline_pos = timeline_pos;
            el.setAttribute("transform", `translate(${timeline_pos}, 0)`);
        }catch(e){}
    }

    //https://apexcharts.com/javascript-chart-demos/candlestick-charts/basic/
    getPathMarkerBoxplot = (index)=>{
        if(this.data.isDataValid !== true){return "";}

        index = typeof index === "number" ? Math.min(0, Math.max(this.data.data.length, index)) : 0;
        const d = this.data.data[index];

        const { width, height} = this.state.boundingClientRect;
        const { width_signal, height: height_drag } = this.timeline_options;

        let height_area = height-50;

        let rect = {
            x: 0, y: 0,
            width: 0, height: 0,
            top: 0, left: 0, right: 0, bottom: 0,
            top_box: 0, bottom_box: 0, center: 0
        };

        rect.width = width_signal * 0.9;

        rect.left = rect.x = (width_signal * index) - (rect.width/2);
        rect.top = rect.y = height_area * ((d["high"] - this.data.minValue)/(this.data.maxValue - this.data.minValue));
        rect.bottom = height_area * ((d["low"] - this.data.minValue)/(this.data.maxValue - this.data.minValue));
        rect.right = rect.left + rect.width;

        rect.height = rect.bottom - rect.top;

        rect.top_box = height_area * ((Math.min(d["open"], d["close"]) - this.data.minValue)/(this.data.maxValue - this.data.minValue));
        rect.bottom_box = height_area * ((Math.max(d["open"], d["close"]) - this.data.minValue)/(this.data.maxValue - this.data.minValue));

        rect.center = rect.left + (rect.width/2);

        return `M${rect.left},${rect.top_box} L${rect.center},${rect.top_box} L${rect.center},${rect.top} L${rect.center},${rect.top_box} L${rect.right},${rect.top_box} L${rect.right},${rect.bottom_box} L${rect.center},${rect.bottom_box} L${rect.center},${rect.bottom} L${rect.center},${rect.bottom_box} L${rect.left},${rect.bottom_box} L${rect.left},${rect.top_box} Z`;
    }

    getArea(){
        if(this.data.isDataValid !== true){return null;}
        return <g className="boxplot_area" transform={`translate(0, 0)`}>
            {this.data.data.map((v, i)=><path d={this.getPathMarkerBoxplot(i)} fill="rgba(0,183,70,1)" fill-opacity="1" stroke="#00b746" stroke-opacity="1" stroke-linecap="butt" stroke-width="1" stroke-dasharray="0"/>)}
        </g>
    }

    timelineEvent = {
        main_mousedown: ()=>{
            this._timeline_dragging = true;
            this.timelineElement.style.cursor = "move";
            this.timelineElement.style.opacity = "1";

            window.clearTimeout(this._timeline_dragging_timeout);

            document.removeEventListener("mouseup", this.timelineEvent.document_mouseup);
            document.addEventListener("mouseup", this.timelineEvent.document_mouseup);

            document.removeEventListener("mouseout", this.timelineEvent.document_mouseout);
            document.addEventListener("mouseout", this.timelineEvent.document_mouseout);

            document.removeEventListener("mousemove", this.timelineEvent.document_mousemove);
            document.addEventListener("mousemove", this.timelineEvent.document_mousemove);
        },
        document_mouseup: ()=>{
            this._timeline_dragging = false;
            this.timelineElement.style.cursor = "auto";

            this._timeline_dragging_timeout = window.setTimeout(()=>{
                this.timelineElement.style.opacity = "0.6";
            }, 2000);

            document.removeEventListener("mouseup", this.timelineEvent.document_mouseup);
            document.removeEventListener("mouseout", this.timelineEvent.document_mouseout);
            document.removeEventListener("mousemove", this.timelineEvent.document_mousemove);
        },
        document_mouseout: (e)=>{
            e = e ? e : window.event;
            let from = e.relatedTarget || e.toElement;
            if(!from || from.nodeName == "HTML"){
                this.timelineEvent.document_mouseup();
            }
        },
        document_mousemove: ({movementX, movementY})=>{
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
                if((/^main_/i).test(k) !== true){continue;}
                let n = k.replace(/^main_/i, "");
                element.removeEventListener(n, this.timelineEvent[k], true);
                element.addEventListener(n, this.timelineEvent[k], true);
            }
        }
    }

    getTimeline(){
        let dateEnd = new Date(), dateStart = new Date(dateEnd.getFullYear(), dateEnd.getMonth()-4, 1);

        if(this.data.isDataValid){
            dateEnd = new Date(this.data.dateEnd);
            dateStart = new Date(this.data.dateStart);
        }

        let days = Math.round((dateEnd-dateStart)/(1000*60*60*24));
        let month_days = [];
        let year_days = new Array((dateEnd.getFullYear() - dateStart.getFullYear()) + 1).fill(0);

        const { width, height } = this.state.boundingClientRect;

        const { theme } = this.props;
        const { timeline_pos } = this.state;
        
        let width_drag = width;

        const { margin_bottom, width_signal, height: height_drag } = this.timeline_options;

        const { timeline_color } = theme in this.theme ? this.theme[theme] : this.theme["light"];

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

        return <g ref={this.applyEventTimeline} className="timeline_drag" transform={`translate(0, ${height-margin_bottom-height_drag})`} style={{
            opacity: "0.6",
            transition: "opacity 0.2s ease-in-out 0s"
        }}>
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

                    {this.getArea()}
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
                <TraderChart data={this.state.data} timelineAnchor={"end"} theme={"dark"} width={"auto"} height={500}/>
            </div>
        </div>;
    }
}

ReactDOM.render(<Main />, document.getElementById("app"));
