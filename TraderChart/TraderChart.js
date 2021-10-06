class TraderChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            boundingClientRect: {width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, isPositionInitial: true},
            timeline_pos: 20
        };

        this.id = "TraderChart_"+Math.round(Math.random()*1000)+"_"+Math.round(Math.random()*1000);

        this.divMain = React.createRef();
        this.svg_area_ref = React.createRef();
        this.svg_gridlines_area_ref = React.createRef();
        this.svg_currency_label_ref = React.createRef();

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
            margin_top: 20,
            margin_left: 20,
            margin_right: 20,
            margin_bottom: 2,
            width_signal: 20,
            height: 40
        }
    }

    loadData({ data }){
        let isDataValid = Array.isArray(data) && data.length > 0 && data.every(v => (v && v.hasOwnProperty && this.keysModel.every(item => v.hasOwnProperty(item))));

        if(isDataValid !== true){return;}

        let { numberOfPricePoints } = this.props;

        numberOfPricePoints = typeof numberOfPricePoints === "number" ? (Math.max(7, numberOfPricePoints) - 1) : 13;

        data.sort((a, b)=>{
            return b["date"] - a["date"];
        });

        let maxValue = -Infinity, minValue = Infinity;
        let maxVolume = -Infinity, minVolume = Infinity;
        let dateStart = new Date(), dateEnd = new Date(0);
        
        data.forEach((v, index)=>{
            maxValue = Math.max(maxValue, v["open"], v["high"], v["low"], v["close"]);
            minValue = Math.min(minValue, v["open"], v["high"], v["low"], v["close"]);

            maxVolume = Math.max(maxVolume, v["volume"]);
            minVolume = Math.min(minVolume, v["volume"]);

            dateStart = Math.min(dateStart, v["date"]);
            dateEnd = Math.max(dateEnd, v["date"]);
        });

        const result = [];
        
        data.forEach((v, index)=>{
            let value = JSON.parse(JSON.stringify(v));

            const start = Math.max(0, index - numberOfPricePoints);
            const end = index;

            const subset = data.slice(start, end + 1);
            const sum = subset.reduce((a, b) => (a + b['close']), 0);

            value["average"] = (sum / subset.length);

            value["date"] = new Date(value["date"]);

            let days = Math.round((value["date"] - dateStart)/(1000*60*60*24));

            result[days] = value;
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

        console.log(this.data);

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
                    const { width_area } = this.getBasicSetting();
                    const { width_signal } = this.timeline_options;
                    
                    this.state.boundingClientRect = JSON.parse(JSON.stringify(size));

                    this.state.boundingClientRect.isPositionInitial = Math.round((Math.abs(this.state.timeline_pos)+width_area)/width_signal) > (this.data.data.length-2);

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

    getTheme = ()=>{
        const { theme } = this.props;
        return theme in this.theme ? this.theme[theme] : this.theme["light"];
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

            //this.update_currencyLabel();

            const { margin_right, width_signal } = this.timeline_options;

            const p = Math.round(width_el - (width - (margin_right + (width_signal/2))));

            this.state.timeline_pos = -p;
            //this.state.timeline_pos = 0;
            window.setTimeout(()=>{this.updateSVG()}, 100);
        }catch(e){}
    }

    getAreaSlice = ()=>{
        const { timeline_pos } = this.state;
        const { width } = this.state.boundingClientRect;
        const { width_signal } = this.timeline_options;

        if((this.data.data.length * width_signal) <= width){
            return {
                start: 0,
                end: this.data.data.length-1
            }
        }

        const pos_x = Math.abs(timeline_pos);

        let start = Math.round(pos_x/width_signal);
        let end = start + Math.round(width/width_signal);

        return {
            start: Math.max(0, start - 2),
            end: Math.min(this.data.data.length-1, end + 2)
        }
    }

    updateSVG = (isNewPos)=>{
        try{
            const el = this.timelineElement.querySelector("g.timeline_content");
            const { width: width_el } = el.querySelector("g.timeline_days").getBoundingClientRect();
            const { width, isPositionInitial } = this.state.boundingClientRect;

            this.update_currencyLabel();

            const { margin_top, margin_left, margin_right, width_signal } = this.timeline_options;
            let { timelineAnchor } = this.props;

            let { timeline_pos } = this.state;

            timelineAnchor = String(timelineAnchor).toLowerCase();
            timelineAnchor = ["start", "end", "middle"].includes(timelineAnchor) ? timelineAnchor : "middle";

            timeline_pos = Math.max(Math.min(timeline_pos, (margin_left + (width_signal/2))), -Math.round(width_el - (width - (margin_right + (width_signal/2)))));

            if(isPositionInitial && !isNewPos){
                timeline_pos = -Math.round(width_el - (width - (margin_right + (width_signal/2))));
            }

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

            if(this.svg_area_ref && this.svg_area_ref.current){
                const {start, end} = this.getAreaSlice();
                let path = ["", "", "", ""];

                for(let i=start; i<=end; i++){
                    let p = this.getPathMarkerBoxplot(i);
                    path[this.data.data[i]["close"] < this.data.data[i]["open"] ? 0 : 1] += p[0];
                    path[this.data.data[i]["close"] < this.data.data[i]["open"] ? 2 : 3] += p[1];
                }

                this.svg_area_ref.current.querySelector("path.boxplot_area_path_average").setAttribute("d", this.getPathAverage());

                this.svg_area_ref.current.querySelector("path.boxplot_area_path_volume_low").setAttribute("d", path[2]);
                this.svg_area_ref.current.querySelector("path.boxplot_area_path_volume_high").setAttribute("d", path[3]);

                this.svg_area_ref.current.querySelector("path.boxplot_area_path_low").setAttribute("d", path[0]);
                this.svg_area_ref.current.querySelector("path.boxplot_area_path_high").setAttribute("d", path[1]);

                this.svg_area_ref.current.setAttribute("transform", `translate(${timeline_pos}, ${margin_top})`);
            }

            const { path: gridlines_path } = this.getBasicSettingGridlines();

            if(this.svg_gridlines_area_ref && this.svg_gridlines_area_ref.current){
                this.svg_gridlines_area_ref.current.querySelector("path.boxplot_gridlines_area_path").setAttribute("d", gridlines_path);
            }

            const { width_area, height_area } = this.getBasicSetting();

            document.querySelector("#RectAreaClip_"+this.id+" > path").setAttribute("d", `M0 ${margin_top} L${width_area} ${margin_top} L${width_area} ${height_area + margin_top} L0 ${height_area + margin_top} Z`);

            if(this.svg_currency_label_ref && this.svg_currency_label_ref.current){
                let text_list = this.svg_currency_label_ref.current.querySelectorAll("text");

                if(text_list.length > 0){
                    return;
                }
            }

            window.setTimeout(()=>{this.updateSVG()}, 100);
        }catch(e){console.log(e);}
    }

    SVG_appendTo = (node, name, attrs, text)=>{
        let p, ns, svg = node, doc = node.ownerDocument;
        if(!ns){
            while(svg && svg.tagName.toLowerCase() != 'svg'){
                svg = svg.parentNode
            };
            ns = { svg: svg.namespaceURI };
            for(let a=svg.attributes, i=a.length; i--;){
                if(a[i].namespaceURI){
                    ns[a[i].localName] = a[i].nodeValue;
                }
            }
        }
        let el = doc.createElementNS(ns.svg, name);
        for(let attr in attrs){
            if(!attrs.hasOwnProperty(attr)){
                continue;
            }
            if(!(p=attr.split(':'))[1]){
                el.setAttribute(attr, attrs[attr]);
            }else{
                el.setAttributeNS(ns[p[0]] || null, p[1], attrs[attr]);
            }
        }
        if(text){
            el.appendChild(doc.createTextNode(text));
        }
        return node.appendChild(el);
    }

    SVG_clear = (node)=>{
        while(node.lastChild){
            node.removeChild(node.lastChild);
        }
    }

    //https://apexcharts.com/javascript-chart-demos/candlestick-charts/basic/
    getBasicSetting = ()=>{
        const { width, height} = this.state.boundingClientRect;
        const { margin_top, margin_right, margin_bottom: margin_bottom_drag, width_signal, height: height_drag } = this.timeline_options;

        let width_area = width - margin_right;
        let height_area = height - (height_drag + margin_bottom_drag + margin_top + 10);

        const {start, end} = this.getAreaSlice();

        const d_area = this.data.data.slice(start, end+1);

        const maxValue = Math.round(Math.max.apply(null, d_area.map(v => Math.max(v["high"], v["average"]))));
        const minValue = Math.floor(Math.min.apply(null, d_area.map(v => Math.min(v["low"], v["average"]))));

        let maxVolume = Math.max.apply(null, d_area.map(v => v["volume"]));
        let minVolume = Math.min.apply(null, d_area.map(v => v["volume"]));
        maxVolume = Math.round(maxVolume+(maxVolume * 0.1));
        minVolume = Math.floor(Math.max(0, minVolume-(minVolume * 0.1)));

        let deficit_width = 0;

        if(this.timelineElement && this.timelineElement.querySelector){
            const { width: width_timeline_days } = this.timelineElement.querySelector("g.timeline_content > g.timeline_days").getBoundingClientRect();
            deficit_width = Math.max(0, (Math.round(width_timeline_days/width_signal) + 1) - this.data.data.length)*width_signal;
        }

        let dateEnd = new Date(), dateStart = new Date(dateEnd.getFullYear(), dateEnd.getMonth()-4, 1);

        if(this.data.isDataValid){
            dateEnd = new Date(this.data.dateEnd);
            dateStart = new Date(this.data.dateStart);
            
            if(this.data.data.length * width_signal < width){
                dateStart = new Date(dateEnd.getFullYear(), dateEnd.getMonth(), dateEnd.getDate() - (width/width_signal));
            }
        }

        return {
            width, height,
            width_area, height_area, width_signal,
            start, end, d_area,
            maxValue, minValue,
            maxVolume, minVolume,
            deficit_width,
            dateEnd, dateStart
        }
    }

    getPathMarkerBoxplot = (index)=>{
        if(this.data.isDataValid !== true || typeof index !== "number" || index < 0 || index >= this.data.data.length){return "";}

        let d = this.data.data[index];

        if(!(d && d.hasOwnProperty && this.keysModel.every(item => d.hasOwnProperty(item)))){
            return "";
        }

        const {height_area, start, end, maxValue, minValue, maxVolume, minVolume, deficit_width, width_signal} = this.getBasicSetting();

        if(start > index || end < index){return "";}

        let rect = {
            x: 0, y: 0,
            width: 0, height: 0,
            top: 0, left: 0, right: 0, bottom: 0,
            top_box: 0, bottom_box: 0, center: 0
        };

        rect.width = Math.max(5, width_signal * 0.8) - 2;

        rect.left = rect.x = deficit_width + ((width_signal * index) - (rect.width/2));
        rect.top = rect.y = height_area - (height_area * ((d["high"] - minValue)/(maxValue - minValue)));
        rect.bottom = height_area - (height_area * ((d["low"] - minValue)/(maxValue - minValue)));
        rect.right = rect.left + rect.width;

        rect.height = rect.bottom - rect.top;

        rect.top_box = height_area - (height_area * ((Math.min(d["open"], d["close"]) - minValue)/(maxValue - minValue)));
        rect.bottom_box = height_area - (height_area * ((Math.max(d["open"], d["close"]) - minValue)/(maxValue - minValue)));

        rect.center = rect.left + (rect.width/2);

        const pathPicker = `M${rect.left},${rect.top_box} L${rect.center},${rect.top_box} L${rect.center},${rect.top} L${rect.center},${rect.top_box} L${rect.right},${rect.top_box} L${rect.right},${rect.bottom_box} L${rect.center},${rect.bottom_box} L${rect.center},${rect.bottom} L${rect.center},${rect.bottom_box} L${rect.left},${rect.bottom_box} L${rect.left},${rect.top_box} Z`;

        const bar_width = Math.max(1, width_signal * 0.5) - 2;

        const height_volume = 0.2;

        const bar_top = (height_area * (1 - height_volume)) + Math.round((height_area * height_volume)  * ((d["volume"] - minVolume)/(maxVolume - minVolume)));
        const bar_left = Math.round(rect.center - (bar_width/2));
        const bar_right = Math.round(bar_left + bar_width);

        const pathVolume = `M${bar_left} ${height_area} L${bar_left} ${bar_top} L${bar_right} ${bar_top} L${bar_right} ${height_area} Z`;

        return [pathPicker, pathVolume];
    }

    getPathAverage = ()=>{
        if(this.data.isDataValid !== true){return "";}

        const {height_area, start, end, maxValue, minValue, deficit_width, d_area, width_signal, dateStart, dateEnd} = this.getBasicSetting();

        let result = [];

        d_area.forEach((v, i)=>{
            let x = 0, y = 0;
            let index = Math.round((new Date(v["date"]) - dateStart)/(1000*60*60*24))+1;
            index = i + start;

            x = deficit_width + (width_signal * index);
            y = height_area-(height_area * ((v["average"] - minValue)/(maxValue - minValue)));

            result.push(`${x} ${y}`);
        });

        return "M" + result.join(" L");
    }

    getArea(){
        if(this.data.isDataValid !== true){return null;}
        const { margin_top } = this.timeline_options;

        return <g ref={this.svg_area_ref} className="boxplot_area" transform={`translate(${this.state.timeline_pos}, ${margin_top})`}>
            <path className={"boxplot_area_path_volume_low"} d="" fill={'#E91E63'} fill-opacity="0.2" stroke={'none'}/>

            <path className={"boxplot_area_path_volume_high"} d="" fill={'#2196F3'} fill-opacity="0.2" stroke={'none'}/>

            <path className={"boxplot_area_path_average"} d="" fill={'none'} stroke={'#FF8900'} stroke-opacity="1" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>

            <path className={"boxplot_area_path_low"} d="" fill={'#c0392b'} fill-opacity="1" stroke={'#c0392b'} stroke-opacity="1" stroke-linecap="butt" stroke-width="2" stroke-dasharray="0"/>

            <path className={"boxplot_area_path_high"} d="" fill={'#03a678'} fill-opacity="1" stroke={'#03a678'} stroke-opacity="1" stroke-linecap="butt" stroke-width="2" stroke-dasharray="0"/>
        </g>
    }

    getBasicSettingGridlines = ()=>{
        if(this.data.isDataValid !== true){return {path: "", labels: []};}

        try{
            let result = {path: [], labels: []}, length = 6;

            const { width_area, height_area, start, end, maxValue, minValue, deficit_width, d_area, width_signal, dateStart, dateEnd } = this.getBasicSetting();
            const { margin_top } = this.timeline_options;

            const interval = Math.floor((maxValue-minValue)/length);

            for(let i=0; i<=length; i++){
                let y = Number(((height_area*((interval*i)/(maxValue-minValue)))+margin_top).toFixed(4));
                if(isNaN(y)){continue;}

                let label = new Intl.NumberFormat('pt-BR', {style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2}).format((interval*(length-i))+minValue);

                result.labels.push({
                    y: y,
                    x: width_area,
                    label: label
                });

                let margin_grid = i === 0 ? 0.5 : i === length ? -0.5 : 0

                result.path.push(`M${0} ${y+margin_grid} L${width_area} ${y+margin_grid} Z`);
            }

            result.path = result.path.join(" ");

            return result;
        }catch(e){return {path: "", labels: []};}
    }

    getGridlinesArea(){
        if(this.data.isDataValid !== true){return null;}

        const { path } = this.getBasicSettingGridlines();

        const { timeline_color } = this.getTheme();

        return <g ref={this.svg_gridlines_area_ref} className="boxplot_gridlines_area">
            <path className="boxplot_gridlines_area_path" d={path} stroke={timeline_color} stroke-dasharray="0" stroke-linecap="butt" stroke-width="1" stroke-opacity="0.1"/>
        </g>
    }

    update_currencyLabel = ()=>{
        try{
            const { labels } = this.getBasicSettingGridlines();

            const { timeline_color } = this.getTheme();

            if(this.svg_currency_label_ref && this.svg_currency_label_ref.current){
                //this.SVG_clear(this.svg_currency_label_ref.current);

                let text_list = this.svg_currency_label_ref.current.querySelectorAll("text");

                if(text_list.length > labels.length){
                    for(let i=(labels.length-1); i<text_list.length; i++){
                        if(text_list[i].parentNode){
                            text_list[i].parentNode.removeChild(text_list[i]);
                        }
                    }
                    text_list = this.svg_currency_label_ref.current.querySelectorAll("text");
                }

                let width = 0;

                labels.forEach((l, i) => {
                    let el;

                    if(i >= text_list.length){
                        el = this.SVG_appendTo(this.svg_currency_label_ref.current, "text", {
                            x: 0, y: l.y,
                            "font-family": "Arial, Helvetica, sans-serif",
                            "font-size": "12px",
                            fill: timeline_color, "dominant-baseline": "central"
                        }, l.label);
                    }else{
                        text_list[i].setAttribute("y", l.y);
                        text_list[i].textContent = l.label;
                        el = text_list[i];
                    }

                    width = Math.max(width, el.getBBox().width);
                });

                let margin_right = width + 15;

                this.timeline_options.margin_right = margin_right;

                const { width: width_main } = this.state.boundingClientRect;

                this.svg_currency_label_ref.current.setAttribute("transform", `translate(${width_main - (margin_right - (15/2))}, 0)`);
            }

        }catch(e){
            window.setInterval(()=>{
                this.update_currencyLabel();
            }, 200);
        }
    }

    timelineEvent = {
        main_mousedown: ()=>{
            this._timeline_dragging = true;
            document.body.style.cursor = "move";
            this.timelineElement.style.opacity = "1";

            window.clearTimeout(this._timeline_dragging_timeout);

            document.removeEventListener("mouseup", this.timelineEvent.document_mouseup);
            document.addEventListener("mouseup", this.timelineEvent.document_mouseup);

            document.removeEventListener("mouseout", this.timelineEvent.document_mouseout);
            document.addEventListener("mouseout", this.timelineEvent.document_mouseout);

            document.removeEventListener("mousemove", this.timelineEvent.document_mousemove);
            document.addEventListener("mousemove", this.timelineEvent.document_mousemove);

            document.removeEventListener("touchmove", this.timelineEvent.document_touchmove);
            document.addEventListener("touchmove", this.timelineEvent.document_touchmove);

            document.removeEventListener("touchend", this.timelineEvent.document_mouseup);
            document.addEventListener("touchend", this.timelineEvent.document_mouseup);

            document.removeEventListener("touchleave", this.timelineEvent.document_mouseup);
            document.addEventListener("touchleave", this.timelineEvent.document_mouseup);

            document.removeEventListener("touchcancel", this.timelineEvent.document_mouseup);
            document.addEventListener("touchcancel", this.timelineEvent.document_mouseup);
        },
        main_touchstart: ({touches})=>{
            this._previousTouch = touches[0];
            this.timelineEvent.main_mousedown();
        },
        document_mouseup: ()=>{
            this._timeline_dragging = false;
            document.body.style.cursor = "";

            this._timeline_dragging_timeout = window.setTimeout(()=>{
                this.timelineElement.style.opacity = "0.6";
            }, 2000);

            document.removeEventListener("mouseup", this.timelineEvent.document_mouseup);
            document.removeEventListener("mouseout", this.timelineEvent.document_mouseout);
            document.removeEventListener("mousemove", this.timelineEvent.document_mousemove);
            document.removeEventListener("touchend", this.timelineEvent.document_mouseup);
            document.removeEventListener("touchleave", this.timelineEvent.document_mouseup);
            document.removeEventListener("touchcancel", this.timelineEvent.document_mouseup);
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
                const { margin_right, margin_left, width_signal } = this.timeline_options;

                if(p >= (margin_left + (width_signal/2)) || p <= -Math.round(width_el - (width - (margin_right + (width_signal/2))))){
                   return; 
                }

                this.state.timeline_pos = p;
                this.updateSVG(true);
            }catch(e){}

        },
        document_touchmove: (e)=>{
            const touch = e.touches[0];

            if(this._previousTouch){
                e.movementX = touch.pageX - this._previousTouch.pageX;
                e.movementY = touch.pageY - this._previousTouch.pageY;
                this.timelineEvent.document_mousemove(e);
            };

            this._previousTouch = touch;
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

    getTimeline = ()=>{
        const { margin_bottom, width_signal, height: height_drag } = this.timeline_options;

        const {width, height, dateEnd, dateStart} = this.getBasicSetting();

        let days = Math.round((dateEnd-dateStart)/(1000*60*60*24));
        let month_days = [];
        let year_days = new Array((dateEnd.getFullYear() - dateStart.getFullYear()) + 1).fill(0);

        const { timeline_pos } = this.state;
        
        let width_drag = width;

        const { timeline_color } = this.getTheme();

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
        const { width, height } = this.props;
        const { boundingClientRect } = this.state;

        const { margin_top } = this.timeline_options;

        const { width_area, height_area } = this.getBasicSetting();

        const { background } = this.getTheme();

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
                    <clipPath id={"RectAreaClip_"+this.id}>
                        <path d={`M0 ${margin_top} L${width_area} ${margin_top} L${width_area} ${height_area + margin_top} L0 ${height_area + margin_top} Z`} />
                    </clipPath>
                </defs>

                <g clip-path={`url(#${"RectPanelClip_"+this.id})`}>
                    <rect x="0" y="0" width={boundingClientRect.width} height={boundingClientRect.height} fill={background} stroke="none"/>

                    <g clip-path={`url(#${"RectAreaClip_"+this.id})`}>
                        {this.getGridlinesArea()}
                        {this.getArea()}
                    </g>
                    <g ref={this.svg_currency_label_ref} className="boxplot_currency_label"></g>
                    {this.getTimeline()}
                </g>
            </svg>
        </div>);
    }
}