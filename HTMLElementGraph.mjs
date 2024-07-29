// HTMLElementGraph.mjs

class HTMLElementGraph {
    constructor() {
        this.nodes = new Map(); // Map to store nodes and their references
    }

    // Add a new node to the graph
    addNode(id, element) {
        if (!this.nodes.has(id)) {
            this.nodes.set(id, {
                element: element,
                children: new Set(), // Set to store references to children nodes
            });
        }
    }

    // Remove a node from the graph
    removeNode(id) {
        if (this.nodes.has(id)) {
            this.nodes.delete(id);
            // Remove any references to the node from other nodes
            this.nodes.forEach(node => node.children.delete(id));
        }
    }

    // Connect two nodes in the graph
    connectNodes(parentId, childId) {
        if (this.nodes.has(parentId) && this.nodes.has(childId)) {
            this.nodes.get(parentId).children.add(childId);
        }
    }

    // Get children of a node
    getChildren(id) {
        if (this.nodes.has(id)) {
            return Array.from(this.nodes.get(id).children);
        }
        return [];
    }

    // Perform a depth-first traversal of the graph
    depthFirstTraversal(startId, callback) {
        const visited = new Set();

        function dfs(currentId) {
            if (!visited.has(currentId)) {
                visited.add(currentId);
                callback(currentId);
                const children = Array.from(this.nodes.get(currentId).children);
                children.forEach(childId => dfs.call(this, childId));
            }
        }

        dfs.call(this, startId);
    }

    // Method to output all nodes to console
    outputAllNodes() {
        this.nodes.forEach((node, id) => {
            console.log(`Node ID: ${id}`);
            console.log(`Element:`, node.element);
            console.log(`Children:`, Array.from(node.children));
            console.log('---');
        });
    }

}

export default HTMLElementGraph;
