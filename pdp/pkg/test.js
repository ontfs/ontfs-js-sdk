const fs = require('fs');
// node 的文件操作 http://nodejs.cn/api/fs.html#fs_fs_readfilesync_path_options

const Bytes2HexString = (b)=> {
    let hexs = "";
    for (let i = 0; i < b.length; i++) {
        let hex = b[i].toString(16);
        if (hex.length == 1) {
            hex = '0' + hex;
        }
        hexs += hex.toUpperCase();
    }
    return hexs;
}

const Hexstring2Bytes = (str)=> {
    let pos = 0;
    let len = str.length;
    if (len % 2 != 0) {
        return null;
    }
    len /= 2;
    let hexA = new Array();
    for (let i = 0; i < len; i++) {
        let s = str.substr(pos, 2);
        let v = parseInt(s, 16);
        hexA.push(v);
        pos += 2;
    }
    return hexA;
}

const data = fs.readFileSync('./data'); // Buffer.buffer 返回类型为 arrayBuffer
console.log("dataLen: " + data.length);
const hexStr = Bytes2HexString(data)
console.log("hexStrLen: " + hexStr.length);

const a = require('./bls12381');
console.log('bls_hash:')

const hashString = a.bls_hash(hexStr)
console.log('data', hexStr)
console.log('hash', hashString)
console.log(Hexstring2Bytes(hashString));
