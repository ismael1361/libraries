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
