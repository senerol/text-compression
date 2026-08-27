// Count how many times each character appears in the text.
function buildFrequencyTable(text) {
    const freq = new Map();
    for (const ch of text) {
        freq.set(ch, (freq.get(ch) || 0) + 1); // increment count, starting from 0 if new
    }
    return freq;
}

// One tree node. A leaf has `char` set (an actual character);
// an internal node has `char` = null and points to two children instead.
class HuffmanNode {
    constructor(freq, char = null, left = null, right = null) {
        this.freq = freq;
        this.char = char;
        this.left = left;
        this.right = right;
    }

    isLeaf() {
        return this.char !== null;
    }
}

// Build the Huffman tree: repeatedly merge the two least-frequent trees
// into one, until only a single tree remains.
function buildTree(freqTable) {
    const heap = new MinHeap();

    // Start with one single-node tree per character.
    for (const [char, freq] of freqTable) {
        heap.insert([freq, new HuffmanNode(freq, char)]);
    }

    while (heap.size() > 1) {
        const a = heap.extractMin(); // smallest
        const b = heap.extractMin(); // second smallest
        const merged = new HuffmanNode(a[1].freq + b[1].freq, null, a[1], b[1]);
        heap.insert([merged.freq, merged]); // put the merged tree back in
    }

    return heap.extractMin()[1]; // the one tree left is the root
}

// Walk the tree recursively, recording the path to each character:
// left turn = '0', right turn = '1'. That path is the character's code.
function buildCodes(node, path, codes) {
    if (node.isLeaf()) {
        codes[node.char] = path || '0'; // '0' covers the edge case of only one unique character
        return;
    }
    buildCodes(node.left, path + '0', codes);
    buildCodes(node.right, path + '1', codes);
}

// Turn the tree into a plain string so it can be shipped alongside the
// compressed data (the decoder needs the exact same tree to reverse the codes).
function serializeTree(node) {
    if (node.isLeaf()) {
        return "'" + node.char; // ' marks "a character follows"
    }
    return '0' + serializeTree(node.left) + '1' + serializeTree(node.right); // 0/1 mark branch order
}

// Parse that string back into a real tree. `cursor` is an object (not a
// plain number) so every recursive call shares and advances the same position.
function deserializeTree(data, cursor) {
    if (data[cursor.index] === "'") {
        cursor.index++;
        const char = data[cursor.index]; // the character right after the '
        cursor.index++;
        return new HuffmanNode(0, char);
    }

    cursor.index++; // skip the '0' marker
    const left = deserializeTree(data, cursor);
    cursor.index++; // skip the '1' marker
    const right = deserializeTree(data, cursor);
    return new HuffmanNode(0, null, left, right);
}

// Group a string of '0'/'1' characters into 8-bit chunks and convert
// each chunk into the real byte (character) it represents.
function bitsToBytes(bits) {
    let bytes = '';
    for (let i = 0; i < bits.length; i += 8) {
        const byteBits = bits.substring(i, i + 8);
        bytes += String.fromCharCode(parseInt(byteBits, 2)); // read as base-2, get the byte value
    }
    return bytes;
}

// Reverse of the above: turn each byte back into its 8-bit binary string.
function bytesToBits(bytes) {
    let bits = '';
    for (let i = 0; i < bytes.length; i++) {
        let num = bytes.charCodeAt(i); // numeric value 0-255
        let byteBits = '';
        for (let j = 0; j < 8; j++) {
            byteBits = (num % 2) + byteBits; // peel off the last bit...
            num = Math.floor(num / 2);       // ...then shift right for the next one
        }
        bits += byteBits;
    }
    return bits;
}

// Compress `text` into a single string payload containing everything
// the decoder will need: the tree, the padding amount, and the data itself.
function encode(text) {
    const freqTable = buildFrequencyTable(text);
    const tree = buildTree(freqTable);

    const codes = {};
    buildCodes(tree, '', codes);

    let bits = '';
    for (const ch of text) {
        bits += codes[ch]; // replace each character with its code
    }

    // Bytes are 8 bits; pad the end with zeros to reach a full byte,
    // and remember how many we added so decode can strip them back off.
    const padding = (8 - bits.length % 8) % 8;
    bits += '0'.repeat(padding);

    const treeStr = serializeTree(tree);
    // Format: <tree length>\n<tree><padding digit><compressed bytes>
    // The length prefix means decode always knows exactly where the tree
    // ends, even if the tree itself contains unusual characters.
    const payload = treeStr.length + '\n' + treeStr + padding + bitsToBytes(bits);

    return { payload, tree };
}

// Reverse of encode: pull the payload apart, rebuild the tree, and walk
// it bit by bit to recover the original text.
function decode(payload) {
    const headerBreak = payload.indexOf('\n');
    const treeLen = parseInt(payload.substring(0, headerBreak), 10);
    const treeStart = headerBreak + 1;
    const treeStr = payload.substring(treeStart, treeStart + treeLen);
    const padding = payload.charCodeAt(treeStart + treeLen) - '0'.charCodeAt(0);
    const bytes = payload.substring(treeStart + treeLen + 1);

    const tree = deserializeTree(treeStr, { index: 0 });

    let bits = bytesToBits(bytes);
    bits = bits.substring(0, bits.length - padding); // drop the padding zeros

    // Walk the tree bit by bit: '0' means go left, '1' means go right.
    // Whenever we land on a leaf, that's one decoded character —
    // record it and jump back to the root to decode the next one.
    let text = '';
    let node = tree;
    for (const bit of bits) {
        node = bit === '0' ? node.left : node.right;
        if (node.isLeaf()) {
            text += node.char;
            node = tree;
        }
    }
    return { text, tree };
}
