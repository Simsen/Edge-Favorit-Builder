# Edge Favorites Builder

A web-based tool for building and managing Microsoft Edge Favorites (bookmarks) configurations for enterprise deployment via **Microsoft Intune (Windows)** and **Custom Policies (macOS)**.

## 🎯 What Problem Does It Solve?

Managing browser favorites across an organization can be challenging. IT administrators often need to:
- Deploy a standard set of bookmarks to all company devices
- Organize favorites into logical folder structures
- Support both Windows and macOS platforms with different configuration formats

**Edge Favorites Builder** provides a visual, drag-and-drop interface to create these configurations without manually writing JSON or XML files.

---

## ✨ Features

### Core Features
- **Visual Drag-and-Drop Interface** - Build your favorites structure intuitively
- **Nested Folder Support** - Create subfolders within folders for organized hierarchies
- **Real-time Preview** - See your configuration as you build it

### Platform Support
| Platform | Format | Deployment Method |
|----------|--------|-------------------|
| Windows | Intune JSON | Microsoft Intune Device Configuration |
| macOS | .mobileconfig (XML plist) | Custom Policy / MDM Profile |

### Import/Export
- **Export** configurations for immediate deployment
- **Import** existing configurations to modify and update
- Supports both Windows JSON and macOS .mobileconfig formats

---

## 📖 Usage Instructions

### Getting Started

1. **Open the tool** in your web browser
2. **Add folders** by clicking "Add Folder" and entering a name
3. **Add links** by clicking "Add Link" and providing a name and URL
4. **Organize** items by dragging and dropping them into the desired order
5. **Create subfolders** by clicking the folder icon within an existing folder

### Building Your Favorites Structure

#### Adding a Folder
1. Click the **"Add Folder"** button
2. Enter the folder name in the modal dialog
3. Click **"Add"** to create the folder

#### Adding a Link
1. Click the **"Add Link"** button
2. Enter the link name and URL
3. Click **"Add"** to create the link

#### Creating Nested Folders (Subfolders)
1. Locate an existing folder
2. Click the **folder icon** (➕📁) within that folder
3. Enter the subfolder name
4. The subfolder will appear nested inside the parent folder

#### Reordering Items
- **Drag and drop** any item to reorder within the same level
- **Drag folders/links into folders** to nest them
- Items show visual feedback during drag operations

### Exporting for Windows (Intune)

1. Build your favorites structure
2. Scroll to the **"Windows Configuration (Intune JSON)"** section
3. Click **"Export .JSON"**
4. Save the downloaded file
5. In **Microsoft Intune**:
   - Navigate to Devices > Configuration profiles
   - Create a new profile for Windows
   - Use the Settings Catalog or Administrative Templates
   - Import or paste the ManagedFavorites policy

### Exporting for macOS

1. Build your favorites structure
2. Scroll to the **"macOS Configuration (.mobileconfig)"** section
3. Click **"Export .MOBILECONFIG"**
4. Save the downloaded file
5. Deploy via:
   - Microsoft Intune (Custom profile)
   - Jamf Pro
   - Other MDM solutions
   - Manual installation (double-click)

### Importing Existing Configurations

#### Import Windows JSON
1. Click **"Import .JSON"** in the Windows section
2. Select your existing Intune JSON file
3. The favorites structure will be loaded into the builder

#### Import macOS .mobileconfig
1. Click **"Import .MOBILECONFIG"** in the macOS section
2. Select your existing .mobileconfig file
3. The favorites structure will be loaded into the builder

---

## 🛠 Technical Details

### Technologies Used
- **HTML5** - Semantic markup and structure
- **CSS3** - Modern styling with CSS variables
- **Vanilla JavaScript** - No frameworks or libraries required

### Key Characteristics
- ✅ **Zero dependencies** - No npm, no build process
- ✅ **No backend required** - Runs entirely in the browser
- ✅ **Offline capable** - Works without internet after initial load
- ✅ **Privacy focused** - All data stays in your browser

### Browser Compatibility
- Google Chrome (recommended)
- Microsoft Edge
- Mozilla Firefox
- Safari
- Any modern browser with ES6+ support

### Color Scheme
The tool uses a green accent color (`#5a9e25`) for visual consistency with enterprise/professional branding.

---

## 📁 File Structure

```
edge_favorites_builder/
├── index.html      # Main HTML structure and UI
├── styles.css      # All styling and visual design
├── script.js       # Application logic and functionality
└── README.md       # This documentation file
```

### File Purposes

| File | Purpose |
|------|---------|
| `index.html` | Contains the page structure, modals, and SVG icons |
| `styles.css` | Handles all styling including drag-and-drop feedback, nested folder indentation, and responsive design |
| `script.js` | Manages state, drag-and-drop logic, JSON/XML generation, import/export functionality |

---

## 📸 Screenshots

*Screenshots of the tool in action can be added here*

- Main interface with folder structure
- Drag-and-drop in action
- Export dialogs
- Generated configuration preview

---

## 🔧 Configuration Output Examples

### Windows (Intune JSON)
```json
[
  {
    "name": "Company Resources",
    "children": [
      { "name": "Intranet", "url": "https://intranet.company.com" },
      { "name": "HR Portal", "url": "https://hr.company.com" }
    ]
  },
  { "name": "Support", "url": "https://support.company.com" }
]
```

### macOS (.mobileconfig excerpt)
```xml
<key>ManagedFavorites</key>
<array>
  <dict>
    <key>name</key>
    <string>Company Resources</string>
    <key>children</key>
    <array>
      <dict>
        <key>name</key>
        <string>Intranet</string>
        <key>url</key>
        <string>https://intranet.company.com</string>
      </dict>
    </array>
  </dict>
</array>
```

---

## 📄 License

This project is provided as-is for enterprise IT administrators and is free to use and modify.

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## 📬 Contact

For questions or support, please open an issue in the repository.

---

*Built for IT administrators who need to manage Microsoft Edge favorites at scale.*
