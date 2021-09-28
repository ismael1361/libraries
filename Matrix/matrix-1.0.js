'Matrix -> 1.0';

class Matrix{
    constructor(...props){
        this.parse.apply(this, props);
    }

    parse(...props){
        let m = props[0];

        if(props.length === 2 && props.every(a => typeof a === "number")){
            m = new Array(props[0]).fill(new Array()).map(()=>new Array(props[1]).fill(0));
        }else if(props[0] instanceof Matrix){
            m = JSON.parse(JSON.stringify(props[0].data));
        }

        if(Matrix.isMatrix(m) !== true){
            throw new Error("The passed parameter is not matrix in nature!");
        }

        this.col = Math.max.apply(null, m.map(a => a.length));
        this.row = m.length;

        this.data = new Array(this.row).fill(new Array()).map(()=>new Array(this.col).fill(0));

        m.forEach((r, i) => {
            r.forEach((c, j)=>{
                this.data[i][j] = c;
            });
        });
    }

    toArray(){
        return JSON.parse(JSON.stringify(this.data));
    }

    static isMatrix(m){
        return (Array.isArray(m) && m.length > 0 && m.every(a => Array.isArray(a) && a.every(b => typeof b === "number"))) || m instanceof Matrix;
    }

    static det(m){
        m = m instanceof Matrix ? m : new Matrix(m);
        
        let result = 0;

        if(m.row == 1 && m.col == 1){
            result = m.data[0][0];
        }else if(m.row == 2 && m.col == 2){
            result = (m.data[0][0]*m.data[1][1]-m.data[0][1]*m.data[1][0]);
        }else if(m.row == m.col){
            let rs = 0, rn = 0;
            m.data.forEach((r, i) => {
                let rS = 1, rN = 1, ni = 1+i;
                ni = ni >= m.row ? ni-m.row : ni;

                r.forEach((c, j)=>{
                    let pS = j+i, pN = ni-j;
                    pS = pS > (m.row-1) ? pS-(m.row) : pS;
                    rS *= m.data[pS][j];
                    pN = pN < 0 ? m.row+pN : pN;
                    rN *= m.data[pN][j];
                });

                rs += rS;
                rn += rN;
            });

            rn = rn>0 ? (-1*rn) : rn;
            result = rs-rn;
        }else{
            throw new Error("The given matrix is not of a square matrix nature, which has the same number of rows and columns!");
        }

        return result;
    }

    det(){return Matrix.det(this);}

    static soma(m){
        m = m instanceof Matrix ? m : new Matrix(m);
        
        let result = 0;

        m.data.forEach((r, i) => {
            r.forEach((c, j)=>{
                result += c;
            });
        });

        return result;
    }

    soma(){return Matrix.soma(this);}

    static T(m){
        m = m instanceof Matrix ? m : new Matrix(m);

        let result = new Array(m.col).fill(new Array()).map(()=>new Array(m.row).fill(0));

        m.data.forEach((r, i) => {
            r.forEach((c, j)=>{
                result[j][i] = c;
            });
        });

        return new Matrix(result);
    }

    T(){
        this.parse(Matrix.T(this));
        return this;
    }

    forEach(calback){
        if(typeof calback !== "function"){return;}
        this.data.forEach((r, i)=>{
            r.forEach((c, j)=>{
                calback(c, i, j);
            });
        });
    }

    map(calback){
        if(typeof calback !== "function"){return;}
        let result = new Matrix(this.row, this.col);

        this.data.forEach((r, i)=>{
            r.forEach((c, j)=>{
                result.data[i][j] = calback(c, i, j);
            });
        });

        return result;
    }

    static random(row, col){
        let m = new Matrix(row, col);

        m.data.forEach((r, i)=>{
            r.forEach((c, j)=>{
                m.data[i][j] = Math.random();
            });
        });

        return m;
    }

    random(){
        this.parse(Matrix.random(this.row, this.col));
        return this;
    }

    fill(value){
        if(typeof value !== "number"){return this;}

        this.data.forEach((r, i)=>{
            r.forEach((c, j)=>{
                this.data[i][j] = value;
            });
        });

        return this;
    }

    sum(value){
        let m;

        if(Array.isArray(value) || value instanceof Matrix){
            m = value instanceof Matrix ? value : new Matrix(value);
        }else if(typeof value === "number"){
            m = new Matrix(this.row, this.col).fill(value);
        }
        
        if(!(m instanceof Matrix) || m.row !== this.row || m.col !== this.col){
            throw new Error("It was not possible to perform the sums between matrices!");
        }

        this.data.forEach((r, i)=>{
            r.forEach((c, j)=>{
                this.data[i][j] += m.data[i][j];
            });
        });

        return this;
    }

    subtract(value){
        let m;

        if(Array.isArray(value) || value instanceof Matrix){
            m = value instanceof Matrix ? value : new Matrix(value);
        }else if(typeof value === "number"){
            m = new Matrix(this.row, this.col).fill(value);
        }
        
        if(!(m instanceof Matrix) || m.row !== this.row || m.col !== this.col){
            throw new Error("Unable to perform subtraction between matrices!");
        }

        this.data.forEach((r, i)=>{
            r.forEach((c, j)=>{
                this.data[i][j] -= m.data[i][j];
            });
        });

        return this;
    }

    static multiply(a, b){
        a = a instanceof Matrix ? a : new Matrix(a);

        if(Array.isArray(b) || b instanceof Matrix){
            b = b instanceof Matrix ? b : new Matrix(b);
        }else if(typeof b === "number"){
            b = new Matrix(a.row, a.col).fill(b);
        }
        
        /*if(!(a instanceof Matrix) || !(b instanceof Matrix) || a.row !== b.col){
            throw new Error("It was not possible to perform the multiplication between matrices!");
        }*/

        let result = new Array();

        for(var r = 0; r < a.row; ++r){
            result[r] = new Array(b.col);
            for(var c = 0; c < b.col; ++c){
                result[r][c] = 0;
                for(var i = 0; i < a.col; ++i){
                    result[r][c] += a.data[r][i] * b.data[i][c];
                }
            }
        }

        return new Matrix(result);
    }

    multiply(m){
        this.parse(Matrix.multiply(this, m));
        return this;
    }

    K(value){
        let m;

        if(Array.isArray(value) || value instanceof Matrix){
            m = value instanceof Matrix ? value : new Matrix(value);
        }else if(typeof value === "number"){
            m = new Matrix(this.row, this.col).fill(value);
        }
        
        if(!(m instanceof Matrix) || m.row !== this.row || m.col !== this.col){
            throw new Error("It was not possible to perform the multiplication between matrices!");
        }

        this.data.forEach((r, i)=>{
            r.forEach((c, j)=>{
                this.data[i][j] *= m.data[i][j];
            });
        });

        return this;
    }

    static concatRow(a, b){
        a = a instanceof Matrix ? a : new Matrix(a);
        b = b instanceof Matrix ? b : new Matrix(b);
        
        if(!(a instanceof Matrix) || !(b instanceof Matrix)){
            throw new Error("One of the parameters passed is not in the nature of an array.!");
        }

        let result = new Array();

        a.data.forEach((r, i)=>{
            result[i] = Array.isArray(b.data[i]) ? r.concat(b.data[i]) : r;
        });

        return new Matrix(result);
    }

    concatRow(m){
        this.parse(Matrix.concatRow(this, m));
        return this;
    }

    static concatColumn(a, b){
        a = a instanceof Matrix ? a : new Matrix(a);
        b = b instanceof Matrix ? b : new Matrix(b);
        
        if(!(a instanceof Matrix) || !(b instanceof Matrix)){
            throw new Error("One of the parameters passed is not in the nature of an array.!");
        }

        return new Matrix(a.data.concat(b.data));
    }

    concatColumn(m){
        this.parse(Matrix.concatColumn(this, m));
        return this;
    }

    static concat(a, b){
        return (a.col == b.col) ? Matrix.concatColumn(a, b) : Matrix.concatRow(a, b);
    }

    concat(m){
        this.parse(Matrix.concat(this, m));
        return this;
    }

    print(){
        console.table(this.data);
    }
}