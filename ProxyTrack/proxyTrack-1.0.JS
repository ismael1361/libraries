window.ProxyTrack = (function(){
    const defaultOptions = {
        trackFunctions: true,
        trackProps: true,
        trackTime: true,
        trackCaller: true,
        trackCount: true,
        stdout: null,
        filter: null,
    };

    class ProxyTrack{
        constructor(entity, options = defaultOptions){
            this.options = Object.assign(defaultOptions, options);
            this.callerMap = {};

            if(typeof this.entity === 'function'){
                this.entity = this.trackClass(entity);
            }else{
                this.entity = this.trackObject(entity);
            }
        }

        trackClass(cls){
            cls.prototype = this.trackObject(cls.prototype);
            cls.prototype.constructor = cls;

            return new Proxy(cls, {
                construct(target, args){
                    const obj = new target(...args);
                    return new Proxy(obj, {
                        get: this.trackPropertyGet(),
                        set: this.trackPropertySet(),
                    });
                },
                apply: this.trackFunctionCall(),
            });
        }

        trackObject(obj){
            const { trackFunctions, trackProps } = this.options;

            let resultObj = obj;
            if(trackFunctions){
                this.proxyFunctions(resultObj);
            }
            if(trackProps){
                resultObj = new Proxy(resultObj, {
                    get: this.trackPropertyGet(),
                    set: this.trackPropertySet(),
                });
            }
            return resultObj;
        }

        proxyFunctions(trackedEntity){
            if(typeof trackedEntity === 'function') return;
            Object.getOwnPropertyNames(trackedEntity).forEach((name) => {
                if(typeof trackedEntity[name] === 'function'){
                    trackedEntity[name] = new Proxy(trackedEntity[name], {
                        apply: this.trackFunctionCall(),
                    });
                }
            });
        }

        trackPropertyGet(){
            return (target, prop, receiver)=>{
                console.log(prop);
                const { trackCaller, trackCount, stdout, filter } = this.options;
                if (typeof target[prop] === 'function' || prop === 'prototype') {
                    return target[prop];
                }
                const error = trackCaller && new Error();
                const caller =  this.getCaller(error);
                const contextName = target.constructor.name === 'Object' ? '' : `${target.constructor.name}.`;
                const name = `${contextName}${prop}`;
                const hashKey = `get_${name}`;

                if(trackCount){
                    if(!this.callerMap[hashKey]){
                        this.callerMap[hashKey] = 1;
                    }else{
                        this.callerMap[hashKey]++;
                    }
                }
                let output = `${name} is being get`;
                if(trackCaller){
                    output += ` by ${caller.name}`;
                }
                if(trackCount){
                    output += ` for the ${this.callerMap[hashKey]} time`;
                }
                let canReport = true;
                if(filter){
                    canReport = filter({
                        type: 'get',
                        prop,
                        name,
                        caller,
                        count: this.callerMap[hashKey],
                    });
                }
                if(canReport){
                    if(stdout){
                        stdout(output);
                    }else{
                        console.log(output);
                    }
                }
                return target[prop];
            };
        }

        trackPropertySet(){
            return (target, prop, value, receiver)=>{
                console.log(prop);
                const { trackCaller, trackCount, stdout, filter } = this.options;
                const error = trackCaller && new Error();
                const caller = this.getCaller(error);
                const contextName = target.constructor.name === 'Object' ? '' : `${target.constructor.name}.`;
                const name = `${contextName}${prop}`;
                const hashKey = `set_${name}`;
                if(trackCount){
                    if(!this.callerMap[hashKey]){
                        this.callerMap[hashKey] = 1;
                    }else{
                        this.callerMap[hashKey]++;
                    }
                }
                let output = `${name} is being set`;
                if(trackCaller){
                    output += ` by ${caller.name}`;
                }
                if(trackCount){
                    output += ` for the ${this.callerMap[hashKey]} time`;
                }
                let canReport = true;
                if(filter){
                    canReport = filter({
                        type: 'get',
                        prop,
                        name,
                        caller,
                        count: this.callerMap[hashKey],
                        value,
                    });
                }
                if(canReport){
                    if(stdout){
                        stdout(output);
                    }else{
                        console.log(output);
                    }
                }
                return Reflect.set(target, prop, value, receiver);
            };
        }

        getCaller(error){
            if(error && error.stack){
                const lines = error.stack.split('\n');
                if(lines.length > 2){
                    let match = lines[2].match(/at ([a-zA-Z\-_$.]+) (.*)/);
                    if(match){
                        return {
                            name: match[1].replace(/^Proxy\./, ''),
                            file: match[2],
                        };
                    }else{
                        match = lines[2].match(/at (.*)/);
                        if(match){
                            return {
                                name: 'unknown',
                                file: match[1],
                            };
                        }
                    }
                }
            }
            return {
                name: 'unknown',
                file: '',
            };
        }

        trackFunctionCall(){
            return (target, thisArg, argumentsList)=>{
                const { trackTime, trackCaller, trackCount, stdout, filter } = this.options;
                const error = trackCaller && new Error();
                const caller = this.getCaller(error);
                const name = this.getFunctionName(target, thisArg);
                if(trackCount){
                    if(!this.callerMap[name]){
                        this.callerMap[name] = 1;
                    }else{
                        this.callerMap[name]++;
                    }
                }
                let start, end;
                if(trackTime){
                    start = Date.now();
                }
                const retVal = target.apply(thisArg, argumentsList);
                if(trackTime){
                    end = Date.now();
                }
                let output = `${name} was called`;
                if(trackCaller){
                    output += ` by ${caller.name}`;
                }
                if(trackCount){
                    output += ` for the ${this.callerMap[name]} time`;
                }
                if(trackTime){
                    output += ` and took ${end-start} mils.`;
                }
                let canReport = true;
                if(filter){
                    canReport = filter({
                        type: 'function',
                        name,
                        caller,
                        count: this.callerMap[name],
                        time: end - start,
                    });
                }
                if(canReport){
                    if(stdout){
                        stdout(output);
                    }else{
                        console.log(output);
                    }
                }
                return retVal;
            }
        }

        getFunctionName(fn, context){
            let contextName = '';
            if(typeof context === 'function'){
                contextName = `{context.name}.`;
            }else if(context && context.constructor && context.constructor.name !== 'Object'){
                contextName = `${context.constructor.name}.`;
            }
            return `${contextName}${fn.name}`;
        }
    }

    return function(entity, options){
        options = Object.assign(defaultOptions, options);
        return new ProxyTrack(entity, options).entity;
    };
})();