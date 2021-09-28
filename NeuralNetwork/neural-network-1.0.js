"NeuralNetwork -> 1.0";

/*
Dependencies:
    Matrix -> 1.0
*/

window.NeuralNetwork = (function(){
    const convertFromHex = (hex)=>{
        hex = hex.toString();
        let str = '';
        for(let i = 0; i<hex.length; i+=2){
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return str;
    }

    const convertToHex = (str)=>{
        let hex = '';
        for(let i=0; i<str.length; i++){
            let h = str.charCodeAt(i).toString(16);
            hex += ''+(h.length % 2 > 0 ? "0"+h : h);
        }
        return hex;
    }

    const numberFromHex = (hex)=>{
        return parseInt(String(hex), 16);
    }

    const numberToHex = (hex)=>{
        let r = Number(hex).toString(16);
        return r.length % 2 > 0 ? "0"+r : r;
    }

    const hexToBase64 = function(str){
        return btoa(String.fromCharCode.apply(null,str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
    }

    const activations = {};
    activations.step = function(x){return (x>=0?1:0);}
    activations.linear = function(x){return x;}
    activations.gaussian = function(x){return (Math.exp(-Math.pow(x, 2)));}
    activations.sigmoid = function(x){return (1.0 / (1.0 + Math.exp(-x)));}
    activations.rational_sigmoid = function(x){return (x / (1.0 + Math.sqrt(1.0 + x * x)));}
    activations.tanh = function(x){return (Math.exp(x) - Math.exp(-x))/(Math.exp(x) + Math.exp(-x));}
    activations.relu = function(x){return (x < 0 ? 0 : x);}
    activations.leaky_relu = function(x, alpha){return Math.max((alpha || 0.01) * x, x);}
    activations.elu = function(x, alpha){return x < 0 ? ((alpha || 0.01) * (Math.exp(x) - 1)) : x;}

    const activations_derivative = {};
    activations_derivative.step = function(x){return (x>=0?1:-1);}
    activations_derivative.linear = function(x){return 1;}
    activations_derivative.gaussian = function(x){return -2.0 * x * activations.gaussian(x);}
    activations_derivative.sigmoid = function(x){return activations.sigmoid(x) * (1 - activations.sigmoid(x));}
    activations_derivative.rational_sigmoid = function(x){var val = Math.sqrt(1.0 + x * x); return (1.0 / (val * (1 + val)));}
    activations_derivative.tanh = function(x){return 1 - Math.pow(activations.tanh(x), 2);}
    activations_derivative.relu = function(x){return (x < 0 ? 0 : 1);}
    activations_derivative.leaky_relu = function(x, alpha){return x > 0 ? 1 : (alpha || 0.01);}
    activations_derivative.elu = function(x, alpha){return x <= 0 ? ((alpha || 0.01) * Math.exp(x)) : 1;}

    //https://www.tensorflow.org/api_docs/python/tf/keras/Model
    class Model{
        constructor(){
            this.version = "1.0";
            this.layers = [];
        }

        add(layer){
            let input_shape = this.layers[this.layers.length-1]?.output_shape;
            this.layers.push(layer(input_shape));
        }

        compile(){

        }

        loadModel(url){
            // | type | value size | value |
            // Example:
            // | Name | 13 | NeuralNetwork              |
            //   01     0d   4e657572616c4e6574776f726b
            // Types:
            // 0x00 => Null
            // 0x01 => Name
            // 0x02 => Versão
            // 0x03 => Initial reading
            // 0x04 => Final reading
            // 0x05 => Layer numbers
            // 0x06 => Layer id
            // 0x07 => Layer object
            // 0x08 => Input shape
            // 0x09 => Output shape
            // 0x0a => Activation
            // 0x0b => Weight
            // 0x0c => Bias
            // 0x0d => Matrix
            // 0x0e => Matrix row
            // 0x0f => Matrix column
            // 0x10 => Matrix start
            // 0x11 => Matrix end

            // 0x60 => String
            // 0x61 => Integer
            // 0x62 => Float
            // 0x63 => Boolean

            return new Promise((resolve, reject)=>{
                fetch(url).then((r)=>{
                    return r.text();
                }).then((r)=>{
                    r = convertToHex(r);
                    if(r.search("010d4e657572616c4e6574776f726b02") === 0){
                        console.log(r);
                    }else{
                        reject("The file is not compatible!");
                        return;
                    }
                    resolve();
                }).catch(()=>{
                    reject("An error occurred while trying to open the file!");
                });
            });
        }

        save(name_file){
            return new Promise((resolve, reject)=>{
                name_file = (typeof name_file !== "string" ? "Model_NeuralNetwork" : name_file) + ".bin";
                let result = "010d4e657572616c4e6574776f726b0203312e30";

                result += "05";
                let length_layers = numberToHex(this.layers.length);
                result += numberToHex(length_layers.length);
                result += length_layers;

                this.layers.forEach((l, i)=>{
                    result += "06";
                    let length_id = numberToHex(i);
                    result += numberToHex(length_id.length);
                    result += length_id;

                    result += "030000";

                    result += "08";
                    let input_shape = numberToHex(l.input_shape);
                    result += numberToHex(input_shape.length);
                    result += input_shape;
                    
                    result += "09";
                    let output_shape = numberToHex(l.output_shape);
                    result += numberToHex(output_shape.length);
                    result += output_shape;
                    
                    result += "0a";
                    let activation = numberToHex(l.activation);
                    result += numberToHex(activation.length);
                    result += activation;

                    result += "040000";
                });

                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                a.target = "_blank";

                var url = 'data:application/octet-stream;base64,' + hexToBase64(result);

                a.href = url;
                a.download = name_file;
                a.click();
                a.parentNode.removeChild(a);

                resolve();
            });
        }

        predict(input){
            //return new Matrix([input]).T().multiply(this.layers[0].weight);
            let result = new Matrix([input]);

            this.layers.forEach((layer)=>{
                result = new Matrix(layer.weight).multiply(new Matrix(result).T()).T();
                result = result.sum(new Matrix(layer.bias).T());
                result = result.map(activations[layer.activation]);
            });

            return (result.row <= 1) ? result.toArray()[0] : result.toArray();
        }

        fit(){

        }
    }

    //https://www.tensorflow.org/api_docs/python/tf/keras/layers
    const layers = {}

    layers.Dense = (output_shape, activation, input_shape)=>{
        let activations_key = Object.keys(activations);

        activation = (typeof activation === "string" && activations_key.includes(activation) 
            ? activation : 
        typeof activation === "number" && activation >= 0 && activation < activations_key.length ? 
            activations_key[activation] : "linear");

        return (i)=>{
            i = typeof input_shape === "number" && !i ? input_shape : i;
            return {
                input_shape: i,
                output_shape: output_shape,
                activation: activation,
                weight: new Matrix(output_shape, i).random().toArray(),
                bias: new Matrix(output_shape, 1).random().toArray()
            }
        }
    }

    class NeuralNetwork{
        static layers = layers;
        static Model = Model;
    }

    return NeuralNetwork;
})();