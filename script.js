// State Management
let state = {
    rootFolder: 'Managed favourites',
    items: []
};

let draggedItem = null;
let draggedIndex = null;
let draggedPath = null; // Path to the dragged item (array of indices for nested items)

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    renderItems();
    generateJSON();
});

// Event Listeners
function initializeEventListeners() {
    // Root folder input
    document.getElementById('rootFolder').addEventListener('input', (e) => {
        state.rootFolder = e.target.value?.trim() || 'Managed favourites';
        generateJSON();
    });

    // Add buttons
    document.getElementById('addFolder').addEventListener('click', () => {
        openAddEditModal('folder');
    });

    document.getElementById('addLink').addEventListener('click', () => {
        openAddEditModal('link');
    });

    // Windows Export/Import
    const exportWindowsBtn = document.getElementById('exportWindows');
    const importWindowsBtn = document.getElementById('importWindows');
    const windowsFileInput = document.getElementById('windowsFileInput');
    
    if (exportWindowsBtn) {
        exportWindowsBtn.addEventListener('click', exportWindowsJSON);
    }
    if (importWindowsBtn) {
        importWindowsBtn.addEventListener('click', () => {
            windowsFileInput?.click();
        });
    }
    if (windowsFileInput) {
        windowsFileInput.addEventListener('change', importWindowsJSON);
    }

    // macOS Export/Import
    const exportMacOSBtn = document.getElementById('exportMacOS');
    const importMacOSBtn = document.getElementById('importMacOS');
    const macosFileInput = document.getElementById('macosFileInput');
    
    if (exportMacOSBtn) {
        exportMacOSBtn.addEventListener('click', exportMacOSConfig);
    }
    if (importMacOSBtn) {
        importMacOSBtn.addEventListener('click', () => {
            macosFileInput?.click();
        });
    }
    if (macosFileInput) {
        macosFileInput.addEventListener('change', importMacOSConfig);
    }

    // Copy JSON
    document.getElementById('copyJson').addEventListener('click', copyJSON);
}

// Path utilities for nested items
function getItemByPath(path) {
    if (!path || path.length === 0) return null;
    let item = state.items[path[0]];
    for (let i = 1; i < path.length; i++) {
        if (!item || !item.children) return null;
        item = item.children[path[i]];
    }
    return item;
}

function getParentByPath(path) {
    if (!path || path.length <= 1) return { items: state.items, index: path?.[0] };
    const parentPath = path.slice(0, -1);
    const parent = getItemByPath(parentPath);
    return { parent, items: parent?.children || [], index: path[path.length - 1] };
}

function removeItemByPath(path) {
    if (!path || path.length === 0) return null;
    const { items, index } = getParentByPath(path);
    if (index >= 0 && index < items.length) {
        return items.splice(index, 1)[0];
    }
    return null;
}

function insertItemAtPath(path, item) {
    if (!path || path.length === 0) return;
    if (path.length === 1) {
        state.items.splice(path[0], 0, item);
    } else {
        const parentPath = path.slice(0, -1);
        const parent = getItemByPath(parentPath);
        if (parent && parent.children) {
            parent.children.splice(path[path.length - 1], 0, item);
        }
    }
}

// Modal Management
function openAddEditModal(type, path = null, parentPath = null) {
    const isEdit = path !== null;
    let item = null;
    
    if (isEdit) {
        item = getItemByPath(path);
    }

    const modal = createModal(
        isEdit ? `Edit ${type === 'folder' ? 'Folder' : 'Link'}` : `Add ${type === 'folder' ? 'Folder' : 'Link'}`,
        createFormHTML(type, item),
        (formData) => {
            if (isEdit) {
                const existingItem = getItemByPath(path);
                if (existingItem) {
                    Object.assign(existingItem, formData);
                }
            } else if (parentPath !== null) {
                // Adding to a specific folder
                const parent = getItemByPath(parentPath);
                if (parent) {
                    if (!parent.children) parent.children = [];
                    if (type === 'folder') {
                        parent.children.push({ type: 'folder', ...formData, children: [] });
                    } else {
                        parent.children.push({ type: 'link', ...formData });
                    }
                }
            } else {
                // Adding to root
                if (type === 'folder') {
                    state.items.push({ type: 'folder', ...formData, children: [] });
                } else {
                    state.items.push({ type: 'link', ...formData });
                }
            }
            renderItems();
            generateJSON();
        }
    );

    document.body.appendChild(modal);
}

function createFormHTML(type, item) {
    const nameValue = item?.name || '';
    const urlValue = item?.url || '';

    return `
        <div class="input-group">
            <label for="itemName">${type === 'folder' ? 'Folder' : 'Link'} Name:</label>
            <input type="text" id="itemName" value="${escapeHtml(nameValue)}" required>
        </div>
        ${type === 'link' ? `
            <div class="input-group">
                <label for="itemUrl">URL:</label>
                <input type="url" id="itemUrl" value="${escapeHtml(urlValue)}" placeholder="https://example.com" required>
            </div>
        ` : ''}
    `;
}

function createModal(title, bodyHTML, onSave) {
    const modal = document.createElement('div');
    modal.className = 'modal active';

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                ${bodyHTML}
            </div>
            <div class="modal-footer">
                <button class="btn btn-cancel">Cancel</button>
                <button class="btn btn-primary">Save</button>
            </div>
        </div>
    `;

    const closeModal = () => {
        modal.remove();
    };

    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.btn-cancel').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    modal.querySelector('.btn-primary').addEventListener('click', () => {
        const name = modal.querySelector('#itemName')?.value?.trim();
        const url = modal.querySelector('#itemUrl')?.value?.trim();

        if (!name) {
            showToast('Name is required', 'error');
            return;
        }

        if (url !== undefined && !url) {
            showToast('URL is required', 'error');
            return;
        }

        const formData = { name };
        if (url !== undefined) formData.url = url;

        onSave?.(formData);
        closeModal();
    });

    return modal;
}

// Items Management
function renderItems() {
    const container = document.getElementById('itemsContainer');

    if (!state.items || state.items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="30" stroke="#5a9e25" stroke-width="2" opacity="0.3"/>
                    <path d="M32 20V44M20 32H44" stroke="#5a9e25" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
                </svg>
                <p>No folders or links added yet</p>
                <p class="hint">Click "Add Folder" or "Add Link" to get started</p>
            </div>
        `;
        return;
    }

    container.innerHTML = state.items.map((item, index) => createItemHTML(item, [index], 0)).join('');
    attachItemEventListeners();
}

function createItemHTML(item, path, depth = 0) {
    const isFolder = item?.type === 'folder';
    const pathStr = JSON.stringify(path);
    const indentStyle = depth > 0 ? `margin-left: ${depth * 20}px;` : '';
    
    const icon = isFolder ? `
        <svg class="item-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z"/>
        </svg>
    ` : `
        <svg class="item-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.9 12C3.9 10.29 5.29 8.9 7 8.9H11V7H7C4.24 7 2 9.24 2 12C2 14.76 4.24 17 7 17H11V15.1H7C5.29 15.1 3.9 13.71 3.9 12ZM8 13H16V11H8V13ZM17 7H13V8.9H17C18.71 8.9 20.1 10.29 20.1 12C20.1 13.71 18.71 15.1 17 15.1H13V17H17C19.76 17 22 14.76 22 12C22 9.24 19.76 7 17 7Z"/>
        </svg>
    `;

    let childrenHTML = '';
    if (isFolder && item.children && item.children.length > 0) {
        childrenHTML = `
            <div class="folder-children">
                ${item.children.map((child, childIndex) => {
                    const childPath = [...path, childIndex];
                    if (child.type === 'folder') {
                        // Nested folder - recursive call
                        return createItemHTML(child, childPath, depth + 1);
                    } else {
                        // Link child
                        return createChildLinkHTML(child, childPath, depth + 1);
                    }
                }).join('')}
            </div>
        `;
    }

    const addButtons = isFolder ? `
        <button class="icon-btn add-child-link" data-path='${pathStr}' title="Add link to folder">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 0C9.4 0 9 0.4 9 1V9H1C0.4 9 0 9.4 0 10C0 10.6 0.4 11 1 11H9V19C9 19.6 9.4 20 10 20C10.6 20 11 19.6 11 19V11H19C19.6 11 20 10.6 20 10C20 9.4 19.6 9 19 9H11V1C11 0.4 10.6 0 10 0Z"/>
            </svg>
        </button>
        <button class="icon-btn add-child-folder" data-path='${pathStr}' title="Add subfolder">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4ZM13 17H11V14H8V12H11V9H13V12H16V14H13V17Z"/>
            </svg>
        </button>
    ` : '';

    return `
        <div class="item ${isFolder ? 'folder' : 'link'} ${depth > 0 ? 'nested-item' : ''}" 
             draggable="true" 
             data-path='${pathStr}' 
             data-type="${item.type}"
             data-depth="${depth}"
             style="${indentStyle}">
            <div class="item-header">
                <svg class="drag-handle" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 2C7 0.9 6.1 0 5 0C3.9 0 3 0.9 3 2C3 3.1 3.9 4 5 4C6.1 4 7 3.1 7 2ZM7 10C7 8.9 6.1 8 5 8C3.9 8 3 8.9 3 10C3 11.1 3.9 12 5 12C6.1 12 7 11.1 7 10ZM7 18C7 16.9 6.1 16 5 16C3.9 16 3 16.9 3 18C3 19.1 3.9 20 5 20C6.1 20 7 19.1 7 18ZM17 2C17 0.9 16.1 0 15 0C13.9 0 13 0.9 13 2C13 3.1 13.9 4 15 4C16.1 4 17 3.1 17 2ZM17 10C17 8.9 16.1 8 15 8C13.9 8 13 8.9 13 10C13 11.1 13.9 12 15 12C16.1 12 17 11.1 17 10ZM17 18C17 16.9 16.1 16 15 16C13.9 16 13 16.9 13 18C13 19.1 13.9 20 15 20C16.1 20 17 19.1 17 18Z"/>
                </svg>
                ${icon}
                <div class="item-content">
                    <div class="item-name">${escapeHtml(item?.name || '')}${depth > 0 ? ' <span class="depth-indicator">(subfolder)</span>' : ''}</div>
                    ${!isFolder ? `<div class="item-url">${escapeHtml(item?.url || '')}</div>` : ''}
                </div>
                <div class="item-actions">
                    ${addButtons}
                    <button class="icon-btn edit" data-path='${pathStr}'>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.5 14.4V17.5H5.6L14.8 8.3L11.7 5.2L2.5 14.4ZM17.7 5.4C18.1 5 18.1 4.3 17.7 3.9L16.1 2.3C15.7 1.9 15 1.9 14.6 2.3L13.4 3.5L16.5 6.6L17.7 5.4Z"/>
                        </svg>
                    </button>
                    <button class="icon-btn delete" data-path='${pathStr}'>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5 2V0H15V2H20V4H18V19C18 19.5 17.5 20 17 20H3C2.5 20 2 19.5 2 19V4H0V2H5ZM4 4V18H16V4H4ZM7 7H9V15H7V7ZM11 7H13V15H11V7Z"/>
                        </svg>
                    </button>
                </div>
            </div>
            ${childrenHTML}
            ${isFolder ? `<div class="drop-zone" data-path='${pathStr}' data-type="folder-drop">Drop here to add to folder</div>` : ''}
        </div>
    `;
}

function createChildLinkHTML(child, path, depth) {
    const pathStr = JSON.stringify(path);
    const indentStyle = `margin-left: ${depth * 20}px;`;
    
    return `
        <div class="child-link" data-path='${pathStr}' draggable="true" data-type="link" style="${indentStyle}">
            <svg class="drag-handle child-drag" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 2C7 0.9 6.1 0 5 0C3.9 0 3 0.9 3 2C3 3.1 3.9 4 5 4C6.1 4 7 3.1 7 2ZM7 10C7 8.9 6.1 8 5 8C3.9 8 3 8.9 3 10C3 11.1 3.9 12 5 12C6.1 12 7 11.1 7 10ZM7 18C7 16.9 6.1 16 5 16C3.9 16 3 16.9 3 18C3 19.1 3.9 20 5 20C6.1 20 7 19.1 7 18ZM17 2C17 0.9 16.1 0 15 0C13.9 0 13 0.9 13 2C13 3.1 13.9 4 15 4C16.1 4 17 3.1 17 2ZM17 10C17 8.9 16.1 8 15 8C13.9 8 13 8.9 13 10C13 11.1 13.9 12 15 12C16.1 12 17 11.1 17 10ZM17 18C17 16.9 16.1 16 15 16C13.9 16 13 16.9 13 18C13 19.1 13.9 20 15 20C16.1 20 17 19.1 17 18Z"/>
            </svg>
            <svg class="child-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.9 12C3.9 10.29 5.29 8.9 7 8.9H11V7H7C4.24 7 2 9.24 2 12C2 14.76 4.24 17 7 17H11V15.1H7C5.29 15.1 3.9 13.71 3.9 12ZM8 13H16V11H8V13ZM17 7H13V8.9H17C18.71 8.9 20.1 10.29 20.1 12C20.1 13.71 18.71 15.1 17 15.1H13V17H17C19.76 17 22 14.76 22 12C22 9.24 19.76 7 17 7Z"/>
            </svg>
            <div class="child-content">
                <div class="child-name">${escapeHtml(child?.name || '')}</div>
                <div class="child-url">${escapeHtml(child?.url || '')}</div>
            </div>
            <div class="child-actions">
                <button class="icon-btn edit-child" data-path='${pathStr}'>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2.5 14.4V17.5H5.6L14.8 8.3L11.7 5.2L2.5 14.4ZM17.7 5.4C18.1 5 18.1 4.3 17.7 3.9L16.1 2.3C15.7 1.9 15 1.9 14.6 2.3L13.4 3.5L16.5 6.6L17.7 5.4Z"/>
                    </svg>
                </button>
                <button class="icon-btn delete-child" data-path='${pathStr}'>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 2V0H15V2H20V4H18V19C18 19.5 17.5 20 17 20H3C2.5 20 2 19.5 2 19V4H0V2H5ZM4 4V18H16V4H4ZM7 7H9V15H7V7ZM11 7H13V15H11V7Z"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

function attachItemEventListeners() {
    // Items (folders and top-level links)
    const items = document.querySelectorAll('.item');
    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragleave', handleDragLeave);
    });

    // Child links (draggable)
    const childLinks = document.querySelectorAll('.child-link');
    childLinks.forEach(link => {
        link.addEventListener('dragstart', handleDragStart);
        link.addEventListener('dragend', handleDragEnd);
        link.addEventListener('dragover', handleDragOver);
        link.addEventListener('drop', handleDrop);
        link.addEventListener('dragleave', handleDragLeave);
    });

    // Drop zones inside folders
    const dropZones = document.querySelectorAll('.drop-zone');
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handleDropZoneDragOver);
        zone.addEventListener('dragleave', handleDropZoneDragLeave);
        zone.addEventListener('drop', handleDropZoneDrop);
    });

    // Edit buttons
    document.querySelectorAll('.icon-btn.edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = JSON.parse(btn.dataset.path || '[]');
            const item = getItemByPath(path);
            if (item) {
                openAddEditModal(item.type, path);
            }
        });
    });

    // Delete buttons
    document.querySelectorAll('.icon-btn.delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = JSON.parse(btn.dataset.path || '[]');
            if (confirm('Are you sure you want to delete this item?')) {
                removeItemByPath(path);
                renderItems();
                generateJSON();
            }
        });
    });

    // Add child link buttons
    document.querySelectorAll('.add-child-link').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = JSON.parse(btn.dataset.path || '[]');
            openAddEditModal('link', null, path);
        });
    });

    // Add child folder buttons
    document.querySelectorAll('.add-child-folder').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = JSON.parse(btn.dataset.path || '[]');
            openAddEditModal('folder', null, path);
        });
    });

    // Edit child buttons
    document.querySelectorAll('.edit-child').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = JSON.parse(btn.dataset.path || '[]');
            openAddEditModal('link', path);
        });
    });

    // Delete child buttons
    document.querySelectorAll('.delete-child').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = JSON.parse(btn.dataset.path || '[]');
            if (confirm('Are you sure you want to delete this link?')) {
                removeItemByPath(path);
                renderItems();
                generateJSON();
            }
        });
    });
}

// Drag and Drop
function handleDragStart(e) {
    e.stopPropagation();
    draggedItem = e.currentTarget;
    draggedPath = JSON.parse(draggedItem?.dataset?.path || '[]');
    e.currentTarget.classList.add('dragging');
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify(draggedPath));
    }
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.item, .child-link, .drop-zone').forEach(item => {
        item.classList.remove('drag-over');
    });
    draggedItem = null;
    draggedPath = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't allow dropping on itself or its children
    const dropPath = JSON.parse(e.currentTarget?.dataset?.path || '[]');
    if (isDescendantPath(dropPath, draggedPath)) {
        return;
    }
    
    e.currentTarget.classList.add('drag-over');
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
    }
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');

    const dropPath = JSON.parse(e.currentTarget?.dataset?.path || '[]');
    
    // Don't allow dropping on itself or its children
    if (isDescendantPath(dropPath, draggedPath) || pathsEqual(dropPath, draggedPath)) {
        return;
    }

    // Get the dragged item
    const draggedItemData = getItemByPath(draggedPath);
    if (!draggedItemData) return;

    // Clone the item before removing
    const itemCopy = JSON.parse(JSON.stringify(draggedItemData));

    // Remove from original location
    removeItemByPath(draggedPath);

    // Determine new position - reorder at same level
    const dropItem = getItemByPath(dropPath);
    if (dropItem) {
        // Adjust path after removal
        const adjustedDropPath = adjustPathAfterRemoval(dropPath, draggedPath);
        insertItemAtPath(adjustedDropPath, itemCopy);
    }

    renderItems();
    generateJSON();
}

function handleDropZoneDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const folderPath = JSON.parse(e.currentTarget?.dataset?.path || '[]');
    
    // Don't allow dropping a folder into itself or its descendants
    if (isDescendantPath(folderPath, draggedPath) || pathsEqual(folderPath, draggedPath)) {
        return;
    }
    
    e.currentTarget.classList.add('drag-over');
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
    }
}

function handleDropZoneDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDropZoneDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');

    const folderPath = JSON.parse(e.currentTarget?.dataset?.path || '[]');
    
    // Don't allow dropping a folder into itself or its descendants
    if (isDescendantPath(folderPath, draggedPath) || pathsEqual(folderPath, draggedPath)) {
        showToast('Cannot move a folder into itself', 'error');
        return;
    }

    // Get the dragged item
    const draggedItemData = getItemByPath(draggedPath);
    if (!draggedItemData) return;

    // Clone the item
    const itemCopy = JSON.parse(JSON.stringify(draggedItemData));

    // Remove from original location
    removeItemByPath(draggedPath);

    // Add to the target folder
    const adjustedFolderPath = adjustPathAfterRemoval(folderPath, draggedPath);
    const targetFolder = getItemByPath(adjustedFolderPath);
    
    if (targetFolder && targetFolder.type === 'folder') {
        if (!targetFolder.children) targetFolder.children = [];
        targetFolder.children.push(itemCopy);
        showToast(`Moved "${itemCopy.name}" into "${targetFolder.name}"`, 'success');
    }

    renderItems();
    generateJSON();
}

// Helper functions for path comparison
function pathsEqual(path1, path2) {
    if (!path1 || !path2) return false;
    if (path1.length !== path2.length) return false;
    return path1.every((v, i) => v === path2[i]);
}

function isDescendantPath(potentialDescendant, ancestor) {
    if (!potentialDescendant || !ancestor) return false;
    if (potentialDescendant.length <= ancestor.length) return false;
    return ancestor.every((v, i) => v === potentialDescendant[i]);
}

function adjustPathAfterRemoval(targetPath, removedPath) {
    if (!targetPath || !removedPath) return targetPath;
    
    // If the removed item was before the target at the same level, adjust the index
    const adjustedPath = [...targetPath];
    
    if (removedPath.length <= adjustedPath.length) {
        // Check if they share the same parent path
        const parentLength = removedPath.length - 1;
        let sameParent = true;
        for (let i = 0; i < parentLength; i++) {
            if (removedPath[i] !== adjustedPath[i]) {
                sameParent = false;
                break;
            }
        }
        
        if (sameParent && removedPath.length === adjustedPath.length) {
            // Same level - adjust if removed was before target
            if (removedPath[parentLength] < adjustedPath[parentLength]) {
                adjustedPath[parentLength]--;
            }
        }
    }
    
    return adjustedPath;
}

// JSON Generation - Output format matching the required structure
function generateJSON() {
    const output = [];
    
    // First element: toplevel_name
    output.push({ toplevel_name: state.rootFolder || 'Managed favourites' });
    
    // Process all items
    state.items.forEach(item => {
        if (item.type === 'folder') {
            output.push(convertFolderForExport(item));
        } else if (item.type === 'link') {
            // Standalone links go into a default folder
            // Will be handled below
        }
    });
    
    // Add standalone links to a Links folder
    const standaloneLinks = state.items.filter(item => item.type === 'link');
    if (standaloneLinks.length > 0) {
        output.push({
            name: 'Links',
            children: standaloneLinks.map(link => ({
                name: link.name || '',
                url: link.url || ''
            }))
        });
    }

    const jsonOutput = JSON.stringify(output, null, 2);
    
    const outputTextarea = document.getElementById('jsonOutput');
    if (outputTextarea) {
        outputTextarea.value = jsonOutput;
    }
}

function convertFolderForExport(folder) {
    const result = {
        name: folder.name || '',
        children: []
    };
    
    if (folder.children && folder.children.length > 0) {
        folder.children.forEach(child => {
            if (child.type === 'folder') {
                // Nested folder - recursive
                result.children.push(convertFolderForExport(child));
            } else {
                // Link
                result.children.push({
                    name: child.name || '',
                    url: child.url || ''
                });
            }
        });
    }
    
    return result;
}

// Helper function to generate favorites array
function getFavoritesArray() {
    const output = [];
    
    // First element: toplevel_name
    output.push({ toplevel_name: state.rootFolder || 'Managed favourites' });
    
    // Process folders
    state.items.forEach(item => {
        if (item.type === 'folder') {
            output.push(convertFolderForExport(item));
        }
    });
    
    // Add standalone links
    const standaloneLinks = state.items.filter(item => item.type === 'link');
    if (standaloneLinks.length > 0) {
        output.push({
            name: 'Links',
            children: standaloneLinks.map(link => ({
                name: link.name || '',
                url: link.url || ''
            }))
        });
    }

    return output;
}

// Generate random UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Windows (Intune) Export
function exportWindowsJSON() {
    const favoritesArray = getFavoritesArray();
    const now = new Date().toISOString();
    
    const intuneConfig = {
        "@odata.context": "https://graph.microsoft.com/beta/$metadata#deviceManagement/configurationPolicies/$entity",
        "createdDateTime": now,
        "creationSource": null,
        "description": "",
        "lastModifiedDateTime": now,
        "name": "Edge_ManagedFavorites",
        "platforms": "windows10",
        "priorityMetaData": null,
        "roleScopeTagIds": ["0"],
        "settingCount": 1,
        "technologies": "mdm",
        "id": generateUUID(),
        "templateReference": {
            "templateId": "",
            "templateFamily": "none",
            "templateDisplayName": null,
            "templateDisplayVersion": null
        },
        "settings": [{
            "id": "0",
            "settingInstance": {
                "@odata.type": "#microsoft.graph.deviceManagementConfigurationChoiceSettingInstance",
                "settingDefinitionId": "device_vendor_msft_policy_config_microsoft_edge~policy~microsoft_edge_managedfavorites",
                "settingInstanceTemplateReference": null,
                "auditRuleInformation": null,
                "choiceSettingValue": {
                    "settingValueTemplateReference": null,
                    "value": "device_vendor_msft_policy_config_microsoft_edge~policy~microsoft_edge_managedfavorites_1",
                    "children": [{
                        "@odata.type": "#microsoft.graph.deviceManagementConfigurationSimpleSettingInstance",
                        "settingDefinitionId": "device_vendor_msft_policy_config_microsoft_edge~policy~microsoft_edge_managedfavorites_managedfavorites",
                        "settingInstanceTemplateReference": null,
                        "auditRuleInformation": null,
                        "simpleSettingValue": {
                            "@odata.type": "#microsoft.graph.deviceManagementConfigurationStringSettingValue",
                            "settingValueTemplateReference": null,
                            "value": JSON.stringify(favoritesArray)
                        }
                    }]
                }
            }
        }]
    };

    const blob = new Blob([JSON.stringify(intuneConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edge-favorites-windows-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Windows (Intune) configuration exported!', 'success');
}

// Windows (Intune) Import
function importWindowsJSON(e) {
    const file = e.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target?.result ?? '{}');
            
            let favoritesString = data?.settings?.[0]?.settingInstance?.choiceSettingValue?.children?.[0]?.simpleSettingValue?.value;
            
            if (!favoritesString) {
                showToast('Invalid Intune JSON format', 'error');
                return;
            }
            
            const favoritesArray = JSON.parse(favoritesString);
            loadFavoritesFromArray(favoritesArray);
            
            showToast('Windows configuration imported!', 'success');
        } catch (error) {
            showToast('Failed to import. Invalid Intune JSON file.', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// macOS Export (.mobileconfig)
function exportMacOSConfig() {
    const favoritesArray = getFavoritesArray();
    
    // Build XML structure recursively
    function buildFolderXML(item, indent) {
        let xml = `${indent}<dict>\n`;
        xml += `${indent}    <key>name</key>\n`;
        xml += `${indent}    <string>${escapeXml(item.name)}</string>\n`;
        xml += `${indent}    <key>children</key>\n`;
        xml += `${indent}    <array>\n`;
        
        if (item.children && item.children.length > 0) {
            item.children.forEach(child => {
                if (child.children !== undefined) {
                    // Nested folder
                    xml += buildFolderXML(child, indent + '        ');
                } else {
                    // Link
                    xml += `${indent}        <dict>\n`;
                    xml += `${indent}            <key>name</key>\n`;
                    xml += `${indent}            <string>${escapeXml(child.name)}</string>\n`;
                    xml += `${indent}            <key>url</key>\n`;
                    xml += `${indent}            <string>${escapeXml(child.url)}</string>\n`;
                    xml += `${indent}        </dict>\n`;
                }
            });
        }
        
        xml += `${indent}    </array>\n`;
        xml += `${indent}</dict>\n`;
        return xml;
    }
    
    let favoritesXML = '';
    favoritesArray.forEach(item => {
        if (item.toplevel_name !== undefined) {
            favoritesXML += `                                    <dict>
                                        <key>toplevel_name</key>
                                        <string>${escapeXml(item.toplevel_name)}</string>
                                    </dict>\n`;
        } else {
            favoritesXML += buildFolderXML(item, '                                    ');
        }
    });

    const mobileconfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>PayloadContent</key>
            <dict>
                <key>com.microsoft.Edge</key>
                <dict>
                    <key>Forced</key>
                    <array>
                        <dict>
                            <key>mcx_preference_settings</key>
                            <dict>
                                <key>ManagedFavorites</key>
                                <array>
${favoritesXML}                                </array>
                            </dict>
                        </dict>
                    </array>
                </dict>
            </dict>
            <key>PayloadDisplayName</key>
            <string>Microsoft Edge Preferences</string>
            <key>PayloadIdentifier</key>
            <string>com.microsoft.Edge.preferences</string>
            <key>PayloadType</key>
            <string>com.apple.ManagedClient.preferences</string>
            <key>PayloadUUID</key>
            <string>${generateUUID().toUpperCase()}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>Edge Managed Favorites</string>
    <key>PayloadIdentifier</key>
    <string>com.example.edge.managedfavorites</string>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>${generateUUID().toUpperCase()}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;

    const blob = new Blob([mobileconfig], { type: 'application/x-apple-aspen-config' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edge-favorites-macos-${Date.now()}.mobileconfig`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('macOS configuration exported!', 'success');
}

// macOS Import (.mobileconfig)
function importMacOSConfig(e) {
    const file = e.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const xmlString = event.target?.result ?? '';
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
            
            const keys = xmlDoc.querySelectorAll('key');
            let managedFavoritesArray = null;
            
            keys.forEach(key => {
                if (key.textContent === 'ManagedFavorites') {
                    managedFavoritesArray = key.nextElementSibling;
                }
            });
            
            if (!managedFavoritesArray || managedFavoritesArray.tagName !== 'array') {
                showToast('Invalid mobileconfig format', 'error');
                return;
            }
            
            const favoritesArray = parsePlistArray(managedFavoritesArray);
            loadFavoritesFromArray(favoritesArray);
            
            showToast('macOS configuration imported!', 'success');
        } catch (error) {
            showToast('Failed to import. Invalid mobileconfig file.', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// Parse plist array element
function parsePlistArray(arrayElement) {
    const result = [];
    const dicts = arrayElement.querySelectorAll(':scope > dict');
    
    dicts.forEach(dict => {
        result.push(parsePlistDict(dict));
    });
    
    return result;
}

// Parse plist dict element
function parsePlistDict(dictElement) {
    const result = {};
    const children = dictElement.children;
    
    for (let i = 0; i < children.length; i += 2) {
        const key = children[i];
        const value = children[i + 1];
        
        if (key && key.tagName === 'key' && value) {
            const keyName = key.textContent;
            
            if (value.tagName === 'string') {
                result[keyName] = value.textContent;
            } else if (value.tagName === 'array') {
                result[keyName] = parsePlistArray(value);
            } else if (value.tagName === 'dict') {
                result[keyName] = parsePlistDict(value);
            }
        }
    }
    
    return result;
}

// Load favorites from array format (supports nested folders)
function loadFavoritesFromArray(favoritesArray) {
    state.items = [];
    state.rootFolder = 'Managed favourites';
    
    function convertImportedFolder(item) {
        const folder = {
            type: 'folder',
            name: item.name || '',
            children: []
        };
        
        if (item.children && Array.isArray(item.children)) {
            item.children.forEach(child => {
                if (child.children !== undefined) {
                    // Nested folder
                    folder.children.push(convertImportedFolder(child));
                } else {
                    // Link
                    folder.children.push({
                        type: 'link',
                        name: child.name || '',
                        url: child.url || ''
                    });
                }
            });
        }
        
        return folder;
    }
    
    favoritesArray.forEach(item => {
        if (item.toplevel_name !== undefined) {
            state.rootFolder = item.toplevel_name;
        } else if (item.name) {
            state.items.push(convertImportedFolder(item));
        }
    });
    
    document.getElementById('rootFolder').value = state.rootFolder;
    renderItems();
    generateJSON();
}

// Escape XML special characters
function escapeXml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
    };
    return String(text ?? '').replace(/[&<>"']/g, m => map[m] ?? m);
}

// Copy JSON
function copyJSON() {
    const jsonOutput = document.getElementById('jsonOutput');
    const jsonText = jsonOutput?.value ?? '';

    if (!jsonText) {
        showToast('No JSON to copy', 'error');
        return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(jsonText)
            .then(() => {
                showToast('JSON copied to clipboard!', 'success');
            })
            .catch(() => {
                fallbackCopyJSON(jsonOutput);
            });
    } else {
        fallbackCopyJSON(jsonOutput);
    }
}

function fallbackCopyJSON(textarea) {
    textarea?.select?.();
    try {
        document.execCommand('copy');
        showToast('JSON copied to clipboard!', 'success');
    } catch (err) {
        showToast('Failed to copy JSON', 'error');
    }
}

// Toast Notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? `
        <svg class="toast-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/>
        </svg>
    ` : `
        <svg class="toast-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
        </svg>
    `;

    toast.innerHTML = `
        ${icon}
        <span>${escapeHtml(message)}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Utility Functions
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text ?? '').replace(/[&<>"']/g, m => map[m] ?? m);
}
