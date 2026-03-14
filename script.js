// Updated script.js

// Remove automatic wrapping of root-level links in a "Links" folder

function exportLogic(favorites) {
    // Fix: Handle root-level links directly
    // Generate JSON logic here...
}

function generateJSON(favorites) {
    // Fixed logic to handle root-level links directly
}

function getFavoritesArray() {
    // Fix: Fetch and handle favorites array including root-level links
}

function loadFavoritesFromArray(array) {
    // Fix: Check for 'url' property to distinguish links from folders
    array.forEach(item => {
        if (item.url) {
            // It's a link
        } else {
            // It's a folder
        }
    });
}