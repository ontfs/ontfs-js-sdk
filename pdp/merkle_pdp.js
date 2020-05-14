const number2ArrayBuffer = require("../utils").number2ArrayBuffer;
const sha3_256 = require("js-sha3").sha3_256;
const MAX_DEPTH = 65536;

/**
 *
 * @param {*} depth
 * @param {*} indexA
 * @param {number} indexB
 * @param {*} nodeA
 * @param {*} nodeB
 * @param {*} res
 *`
 */

const merkleHash = (depth, indexA, indexB, nodeA, nodeB, res) => {
	if (depth > MAX_DEPTH) {
		return null;
	}
	let d = number2ArrayBuffer(depth);
	let a = number2ArrayBuffer(indexA);
	let b = number2ArrayBuffer(indexB);
	let id = new Uint8Array(d);
	let ia = new Uint8Array(a);
	let ib = new Uint8Array(b);
	let iNodeA = new Uint8Array(nodeA);
	let iNodeB = new Uint8Array(nodeB);
	let h = new Uint8Array(
		id.byteLength + ia.byteLength + ib.byteLength + iNodeA.byteLength + iNodeB.byteLength
	);
	h.set(id, 0);
	h.set(ia, id.byteLength);
	h.set(iNodeA, id.byteLength + ia.byteLength);
	h.set(ib, id.byteLength + ia.byteLength + iNodeA.byteLength);
	h.set(iNodeB, id.byteLength + ia.byteLength + iNodeA.byteLength + ib.byteLength);

	return sha3_256.arrayBuffer(h.buffer);
};

/**
 *
 * @param {MimeTypeArray} blocks
 */
const CalcRootHash = (blocks) => {
	let blocksLen = blocks.length;
	if (blocksLen == 0) return null;
	let layerHashes = []; // list of arrayBuffer([]byte)
	for (let i = 0; i < blocksLen; i++) {
		let id = number2ArrayBuffer(i);
		let blockHash = sha3_256.arrayBuffer(blocks[i].buffer)

		let idArray = new Uint8Array(id)
		let blockHashArray = new Uint8Array(blockHash)
		let layer = new Uint8Array(blockHash.byteLength + id.byteLength);
		layer.set(blockHashArray, 0);
		layer.set(idArray, blockHashArray.byteLength);
		layerHashes[i] = layer.buffer;
	}
	let depth = 0;
	while (layerHashes.length !== 1) {
		let n = Math.floor(layerHashes.length / 2);
		for (let i = 0; i < n; i++) {
			layerHashes[i] = merkleHash(
				depth,
				2 * i,
				2 * i + 1,
				layerHashes[2 * i],
				layerHashes[2 * i + 1],
				null
			);
			if (!layerHashes[i]) return null;
		}
		if (layerHashes.length == 2 * n + 1) {
			layerHashes[n] = merkleHash(
				depth,
				2 * n,
				2 * n + 1,
				layerHashes[2 * n],
				layerHashes[2 * n],
				null
			);

			layerHashes = layerHashes.slice(0, n + 1);
		} else {
			layerHashes = layerHashes.slice(0, n);
		}
		depth++;
	}
	return layerHashes[0];
};

const testRootHash = () => {
	let blocks = [];

	const uint8 = new Uint8Array(256 * 1024);
	for (let i = 0; i < uint8.length; i++) {
		uint8.set([2], i);
	}
	for (let i = 0; i < 1; i++) {
		blocks.push(uint8)
	}

	let ret = CalcRootHash(blocks)
	let ret1 = new Uint8Array(ret);
	console.log('ret: ' + ret1);
};
testRootHash();
module.exports = {
	CalcRootHash
};
