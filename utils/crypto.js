const Crypto = require("ontology-ts-sdk").Crypto;
const { reverseHex } = require("ontology-ts-sdk").utils;
const { Address, PublicKey, Signature } = Crypto;
const address = require("./address.js");
const CryptoJS = require("crypto-js");
const Buffer = require('buffer/').Buffer
/**
 * verify sign
 *
 * @param {string} pubKey: public key hex string
 * @param {string} data: raw data
 * @param {string} signData: signature data hex string
 * @returns {boolean}
 */
const verify = (pubKey, data, signData) => {
	const publicKey = new PublicKey(pubKey);
	if (!publicKey) {
		throw new Error(`deserialize publick key error`);
	}
	const signature = Signature.deserializeHex(signData);
	if (!signature) {
		throw new Error(`invalid signature data`);
	}
	const result = publicKey.verify(data, signature);
	return result;
};

/**
 * check if a public key equal to a base58 address
 *
 * @param {string} pubKey  public key hex string
 * @param {string} base58Addr address in base58 format
 * @returns {boolean}
 */
const publicKeyMatchAddress = (pubKey, base58Addr) => {
	let addr = address.addressFromPubKeyHex(pubKey);
	return addr == base58Addr;
};

/**
 * convert a string to base64 string
 *
 * @param {string} str
 * @returns {string}
 */
const str2base64 = (str) => {
	return Buffer.from(str).toString("base64")
	// return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(str));
};

/**
 * convert a string to hex string by crypto-js
 *
 * @param {string} str
 * @returns {string}
 */
const cryptoStr2Hex = (str) => {
	return CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(str));
};

/**
 * convert a base64 string to utf-8 string
 *
 * @param {string} base64str
 * @returns {string}
 */
const base64str2utf8str = (base64str) => {
	return CryptoJS.enc.Base64.parse(base64str).toString(CryptoJS.enc.Utf8);
};

/**
 * convert a base64 string to raw string
 *
 * @param {string} base64str
 * @returns {string}
 */
const base64str2str = (base64str) => {
	return CryptoJS.enc.Base64.parse(base64str).toString();
};

/**
 * convert a base64 string to hex string
 *
 * @param {string} base64str
 * @returns {string}
 */
const base64str2hex = (base64str) => {
	return CryptoJS.enc.Base64.parse(base64str).toString(CryptoJS.enc.Hex).toString();
};

/**
 * convert a hex string to base64 string
 *
 * @param {string} hex
 * @returns {string}
 */
const hex2base64str = (hex) => {
	var _data = CryptoJS.enc.Hex.parse(hex);
	var base64_data = _data.toString(CryptoJS.enc.Base64);
	return base64_data;
};

/**
 * convert a hex string to sha256 string
 *
 * @param {string} hex
 * @returns {string}
 */
const hex2sha256 = (hex) => {
	var message = CryptoJS.enc.Hex.parse(hex);
	return CryptoJS.SHA256(message).toString();
};

/**
 * convert a hex string to array bytes
 *
 * @param {string} str
 * @returns {Array}
 */
const hexstr2Bytes = (str) => {
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
};

/**
 * convert a bytes array to hex string
 *
 * @param {Array} b
 * @returns {string}
 */
const bytes2HexString = (b) => {
	let hexs = "";
	for (let i = 0; i < b.length; i++) {
		let hex = b[i].toString(16);
		if (hex.length == 1) {
			hex = "0" + hex;
		}
		hexs += hex.toLowerCase();
	}
	return hexs;
};

/**
 * convert a Address to bytes string
 *
 * @param {Address} addr
 * @returns {string}
 */
const address2bytestr = (addr) => {
	return hexstr2Bytes(reverseHex(addr.toHexString()));
};

/**
 * convert a bytes string to Address
 *
 * @param {string} bytes
 * @returns {Address}
 */
const bytes2address = (bytes) => {
	const hex = bytes2HexString(bytes);
	const addr = new Address(hex);
	return addr;
};

/**
 * sha256 a string
 *
 * @param {string} str
 * @returns {string}
 */
const sha256str = (str) => {
	return CryptoJS.SHA256(str).toString();
};

/**
 *  
 * @param {int} number 
 * @return {[]bytes} arrayBuffer
 */
const number2ArrayBuffer = (number) => {
	let a = new BigUint64Array([BigInt(number.toString())])
	return a.buffer;
};


/**
 * convert a uint8 array to hex string
 *
 * @param {Uint8Array} arr
 * @returns
 */
const ab2hexstring = (arr) => {
	let result = '';
	const uint8Arr = new Uint8Array(arr);
	for (let i = 0; i < uint8Arr.byteLength; i++) {
		let str = uint8Arr[i].toString(16);
		str = str.length === 0
			? '00'
			: str.length === 1
				? '0' + str
				: str;
		result += str;
	}
	return result;
}

const hexstr2ab = (str) => {
	if (!str) {
		return new Uint8Array();
	}
	var a = [];
	for (var i = 0, len = str.length; i < len; i += 2) {
		a.push(parseInt(str.substr(i, 2), 16));
	}
	return new Uint8Array(a);
}

const str2ab = (str) => {
	var bytes = new Uint8Array(str.length);
	for (var iii = 0; iii < str.length; iii++) {
		bytes[iii] = str.charCodeAt(iii);
	}
	return bytes;
}

const str2MD5hexstr = (str) => {
	return CryptoJS.MD5(str).toString()
}

module.exports = {
	verify,
	publicKeyMatchAddress,
	str2base64,
	base64str2str,
	hex2base64str,
	hexstr2Bytes,
	address2bytestr,
	base64str2utf8str,
	cryptoStr2Hex,
	base64str2hex,
	sha256str,
	hex2sha256,
	bytes2address,
	number2ArrayBuffer,
	ab2hexstring,
	hexstr2ab,
	str2ab,
	str2MD5hexstr
};
