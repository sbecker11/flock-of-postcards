// mainGraph.mjs

// see https://chatgpt.com/c/55817311-bf65-4cc1-8515-ca1f97122a91

import fs from 'fs';
import xlsx from 'xlsx';
import HTMLElementGraph from './HTMLElementGraph.mjs';

const FILE_PATH = 'static_content/jobs/jobs.xlsx';

// Create an instance of HTMLElementGraph
const elementGraph = new HTMLElementGraph();

// Function to load properties from Excel file
function loadProperties() {
    const workbook = xlsx.readFile(FILE_PATH);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const properties = xlsx.utils.sheet_to_json(worksheet);

    // Clear existing nodes
    elementGraph.nodes.clear();

    // Add nodes based on properties
    properties.forEach(property => {
        // Create HTML element for each property
        const element = document.createElement('div');
        // Set properties for the element based on the data in 'property'
        // For example:
        // element.textContent = property.name;

        // Add the element to the graph
        elementGraph.addNode(property.id, element);
    });
}

// Watch for changes in the Excel file
fs.watch(FILE_PATH, (eventType, filename) => {
    if (eventType === 'change') {
        console.log('File changed. Reloading properties...');
        loadProperties();
    }
});

// Initial load of properties
loadProperties();

// Output all nodes to console
elementGraph.outputAllNodes();


// You can continue defining other functions and logic related to your application using the elementGraph instance.
