function layoutTree(root) {
    const nodes = [];
    const links = [];
    let leafIndex = 0;

    function assign(node, depth) {
        node.y = depth;

        if (node.isLeaf()) {
            node.x = leafIndex;
            leafIndex++;
            return node.x;
        }

        const leftX = assign(node.left, depth + 1);
        const rightX = assign(node.right, depth + 1);
        node.x = (leftX + rightX) / 2;   // centered above its two children
        return node.x;
    }

    // Separately collect every node and every parent->child link,
    // so drawing later can just loop over flat lists.
    function collect(node) {
        nodes.push(node);
        if (node.left) {
            links.push({ from: node, to: node.left, label: '0' });
            collect(node.left);
        }
        if (node.right) {
            links.push({ from: node, to: node.right, label: '1' });
            collect(node.right);
        }
    }

    assign(root, 0);
    collect(root);

    return { nodes, links, leafCount: leafIndex };
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function renderTree(container, root) {
    container.innerHTML = '';   // clear whatever was drawn last time

    const { nodes, links, leafCount } = layoutTree(root);

    const xGap = 60;
    const yGap = 80;
    const radius = 18;
    const maxDepth = Math.max(...nodes.map(n => n.y));
    const width = leafCount * xGap + 40;
    const height = (maxDepth + 1) * yGap + 40;

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);

    // Convert a node's grid position (x, y) into actual pixel coordinates.
    const px = (node) => 20 + node.x * xGap;
    const py = (node) => 20 + node.y * yGap;

    // Draw edges first, so the node circles render on top of the lines.
    for (const link of links) {
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', px(link.from));
        line.setAttribute('y1', py(link.from));
        line.setAttribute('x2', px(link.to));
        line.setAttribute('y2', py(link.to));
        line.setAttribute('stroke', '#666');
        svg.appendChild(line);

        const label = document.createElementNS(SVG_NS, 'text');
        label.setAttribute('x', (px(link.from) + px(link.to)) / 2);
        label.setAttribute('y', (py(link.from) + py(link.to)) / 2);
        label.setAttribute('fill', '#9aa1ac');
        label.textContent = link.label;   // '0' or '1'
        svg.appendChild(label);
    }

    // Draw nodes on top of the edges.
    for (const node of nodes) {
        const circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('cx', px(node));
        circle.setAttribute('cy', py(node));
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', node.isLeaf() ? '#5eead4' : '#171a21');
        circle.setAttribute('stroke', '#2dd4bf');
        svg.appendChild(circle);

        const text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', px(node));
        text.setAttribute('y', py(node) + 4);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', node.isLeaf() ? '#06231f' : '#e8eaed');
        text.textContent = node.isLeaf() ? node.char : node.freq;
        svg.appendChild(text);
    }

    container.appendChild(svg);
}