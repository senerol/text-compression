// A min-heap: always lets you pull out the smallest item efficiently.
// Used here to repeatedly find the two least-frequent characters/nodes
// when building the Huffman tree.
class MinHeap {
    constructor() {
        this.items = [];   // stored as a flat array; index math finds parent/children
    }

    size() {
        return this.items.length;
    }

    // Add a new item, then restore the heap property by bubbling it upward.
    insert(item) {
        this.items.push(item);
        this.bubbleUp(this.items.length - 1);
    }

    // Swap the item at `index` with its parent, repeatedly, as long as
    // it's smaller than its parent. Stops once the heap rule holds again.
    bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2); // array index math for "parent of index"
            if (this.items[parentIndex][0] <= this.items[index][0]) break; // already in order, stop

            [this.items[parentIndex], this.items[index]] = [this.items[index], this.items[parentIndex]];
            index = parentIndex; // keep climbing
        }
    }

    // Remove and return the smallest item (always at index 0).
    extractMin() {
        const min = this.items[0];
        const last = this.items.pop();       // take the last item out first

        if (this.items.length > 0) {
            this.items[0] = last;            // move it to the now-empty root slot
            this.sinkDown(0);                // then restore the heap property downward
        }
        return min;
    }

    // Swap the item at `index` with its smaller child, repeatedly, until
    // both children are bigger than it (or there are no children left).
    sinkDown(index) {
        const length = this.items.length;

        while (true) {
            const left = 2 * index + 1;      // array index math for "left child of index"
            const right = 2 * index + 2;     // array index math for "right child of index"
            let smallest = index;

            if (left < length && this.items[left][0] < this.items[smallest][0]) smallest = left;
            if (right < length && this.items[right][0] < this.items[smallest][0]) smallest = right;

            if (smallest === index) break;   // both children are bigger, we're done

            [this.items[smallest], this.items[index]] = [this.items[index], this.items[smallest]];
            index = smallest;                // keep sinking
        }
    }
}
