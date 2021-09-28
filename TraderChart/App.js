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
            boundingClientRect: {width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0}
        };

        this.id = "TraderChart_"+Math.round(Math.random()*1000)+"_"+Math.round(Math.random()*1000);

        this.divMain = React.createRef();

        this.isWillUnmount = false;

        this.theme = {
            light: {
                background: "#e0e0e0",
                timeline_color_primary: "#263238",
                timeline_color_secondary: "#e0e0e0"
            },
            dark: {
                background: "#263238",
                timeline_color_primary: "#e0e0e0",
                timeline_color_secondary: "#263238"
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

        this.setState({});
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
                        this.setState({});
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

    getTimeline(){
        let dateEnd = new Date(), dateStart = new Date(dateEnd.getFullYear(), dateEnd.getMonth()-4, 1);

        let days = Math.round((dateEnd-dateStart)/(1000*60*60*24));

        const { width, height} = this.state.boundingClientRect;
        const { theme } = this.props;

        const { timeline_color_primary, timeline_color_secondary } = theme in this.theme ? this.theme[theme] : this.theme["light"];
        const timeline_padding = 20;

        return <g className="timeline_drag" transform={`translate(0, ${height-50})`}>
            <g className="timeline_content" transform="translate(0, 0)">
                <g className="timeline_days"></g>
                <g className="timeline_months"></g>
                <g className="timeline_years" transform="translate(0, 15)">
                    <line x1={timeline_padding} y1="15" x2={days*20} y2="15" stroke={timeline_color_primary} strokeWidth="2"/>

                    <g transform={`translate(${timeline_padding+20}, 15)`}>

                        <path d="M0,0 h30 a10,10 0 0 1 10,10 v5 a10,10 0 0 1 -10,10 h-30 a10,10 0 0 1 -10,-10 v-5 a10,10 0 0 1 10,-10" fill={timeline_color_primary} transform="translate(0, -12)"/>

                        <text x="15" y="0" fill={timeline_color_secondary} font-size="14px" dominant-baseline="central" text-anchor="middle" font-weight="bold">2021</text>
                    </g>
                    
                    <circle cx={timeline_padding} cy="15" r="5" stroke="none" fill={timeline_color_primary} />
                    <circle cx={days*20} cy="15" r="5" stroke="none" fill={timeline_color_primary} />
                </g>
            </g>
        </g>;
    }

    render(){
        const { theme, width, height } = this.props;
        const { boundingClientRect } = this.state;

        const { background } = theme in this.theme ? this.theme[theme] : this.theme["light"];

        return (<div ref={this.divMain} style={{height: (!width ? "auto" : width), height: (!height ? 500 : height), overflow: "hidden"}}>
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
