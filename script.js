// Grab references to the elements we need to interact with.
const upload = document.getElementById('uploadedFile');
const encodeBtn = document.getElementById('encode');
const decodeBtn = document.getElementById('decode');
const statsEl = document.getElementById('stats');
const treeArea = document.getElementById('treearea');   // NEW: reference to the tree container

// Trigger a browser download using a data: URL and a fake, invisible link click.
function downloadFile(fileName, data) {
    const a = document.createElement('a');
    a.href = 'data:application/octet-stream,' + encodeURIComponent(data);
    a.download = fileName;
    a.click();
}

// Shared handler for both buttons: read the uploaded file, then either
// encode or decode it depending on which button was pressed.
function handleFile(mode) {
    const file = upload.files[0];
    if (!file) {
        alert('No file uploaded!');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target.result;
        if (!text.length) {
            alert('File is empty!');
            return;
        }

        if (mode === 'encode') {
            const start = performance.now();  
            const { payload, tree } = encode(text);
            const elapsed = performance.now() - start;
            downloadFile(file.name.split('.')[0] + '_encoded.txt', payload);
            renderTree(treeArea, tree);   // NEW: draw the tree

            const ratio = (text.length / payload.length).toFixed(2);
          statsEl.textContent = `Original: ${text.length} chars, Compressed: ${payload.length} bytes, Ratio: ${ratio}x, Encoding time: ${elapsed.toFixed(2)} ms`;
        } else {
            const start = performance.now();
            const { text: decoded, tree } = decode(text);   // CHANGED: decode now returns { text, tree }
            const elapsed = performance.now() - start; 
            downloadFile(file.name.split('.')[0] + '_decoded.txt', decoded);
            renderTree(treeArea, tree);   // NEW: draw the tree

            statsEl.textContent = `Decoded ${decoded.length} characters, Decoding time: ${elapsed.toFixed(2)} ms`;
        }
    };
    reader.readAsText(file);
}

encodeBtn.addEventListener('click', () => handleFile('encode'));
decodeBtn.addEventListener('click', () => handleFile('decode'));