class TraderChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            boundingClientRect: {width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0}
        };

        this.id = "TraderChart_"+Math.round(Math.random()*1000)+"_"+Math.round(Math.random()*1000);

        this.divMain = React.createRef();
        this._observeResizeAnimationFrame;
        this.isWillUnmount = false;

        this.theme = {
            light: {
                background: "#e0e0e0",
            },
            dark: {
                background: "#263238",
            }
        }
    }

    observeResize(){
        window.cancelAnimationFrame(this._observeResizeAnimationFrame);
        if(this.isWillUnmount){ return; }
        this._observeResizeAnimationFrame = window.requestAnimationFrame(()=>{
            if(this.divMain && this.divMain.current){
                const element = this.divMain.current;
                const size = element.getBoundingClientRect();

                if(size && JSON.stringify(this.state.boundingClientRect) !== JSON.stringify(size)){
                    this.state.boundingClientRect = JSON.parse(JSON.stringify(size));
                    this.setState({});
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

    render(){
        const { theme, width, height } = this.props;
        const { boundingClientRect } = this.state;

        const { background } = theme in this.theme ? this.theme[theme] : this.theme["light"];

        return (<div ref={this.divMain} style={{height: (!width ? "auto" : width), height: (!height ? 500 : height)}}>
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
                </g>
            </svg>
        </div>);
    }
}

class Main extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        return <div className="grid-chart">
            <div>
                <TraderChart theme={"light"} width={"auto"} height={400}/>
            </div>
            <div>
                <TraderChart theme={"dark"} width={"auto"} height={500}/>
            </div>
        </div>;
    }
}

ReactDOM.render(<Main />, document.getElementById("app"));
