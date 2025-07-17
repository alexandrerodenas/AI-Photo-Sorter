# AI Photo Sorter

The AI Photo Sorter is a powerful, privacy-focused web application that helps you automatically organize your local photos using artificial intelligence, right in your browser. No uploads, no servers, no data collection—your photos and your data stay on your machine.

This tool leverages the browser's File System Access API to read your photo directories and TensorFlow.js to classify image content locally.

## ✨ Key Features

### Core Functionality
- **Local First & 100% Private**: Select a local directory on your computer. All processing happens directly in your browser. Your photos are never uploaded.
- **AI-Powered Analysis**: Utilizes a pre-trained machine learning model (MobileNet) to scan your photos and identify objects and scenes within them.
- **High-Performance Backend**: Automatically uses the best available AI backend for your browser, supporting **WebGPU**, **WASM**, and **WebGL** for maximum speed.

### Intuitive User Interface
- **Dual View Modes**:
    - **Grid View**: A classic, responsive grid to see all your photos at a glance.
    - **Folder View**: An organized, hierarchical view that automatically groups photos by their status:
        - `Analyzing`: Photos currently being processed.
        - `Queued`: Photos waiting for analysis.
        - `Analyzed`: Successfully analyzed photos, grouped into sub-folders by their top AI-detected label (e.g., "Cat", "Car", "Beach").
        - `Uncategorized`: Photos that the AI analyzed but couldn't classify with high confidence.
        - `Error`: Photos that failed to process.
- **Photo Viewer**: Double-click any photo to open a detailed modal view, showing a larger preview and a complete list of all AI predictions with their confidence scores.
- **Dark Mode**: Sleek and eye-friendly dark theme that respects your system's settings.

### Powerful Organization & Automation
- **Custom Selection Rules**:
    - Create powerful rules in your user profile to automatically select photos. For example: `SELECT photos with "dog" label with confidence > 80%`.
    - Apply rules manually at any time or enable the **auto-apply** feature to have selections made for you as soon as photos are analyzed.
- **"Uncategorized" Filtering**:
    - Set a custom **"uncertainty threshold"** (from 0% to 50%) in your profile.
    - If all of an image's prediction scores fall below this threshold, it is automatically marked as `Uncategorized`, separating ambiguous images for manual review.
- **Advanced Selection Tools**:
    - **Select/Clear All**: Bulk-select or deselect photos. This action smartly respects the current label filter.
    - **Isolate Selection**: Instantly hide all unselected photos to focus only on what's important. Click again to show all photos.
    - **Permanent Deletion**: Securely delete selected photos directly from your hard drive (with confirmation).

### Filtering & Sorting
- **Filter by Label**: Quickly find photos by searching for a specific label (e.g., "mountain") in the filter bar.
- **Sortable Folders**: In Folder View, sort the `Analyzed` category sub-folders alphabetically or by the number of photos they contain.

### Profile Management
- **Personalized Experience**: The app greets you by your name, which you can set in your profile.
- **Import/Export Profile**: Save your complete user profile, including all your custom rules, to a JSON file. This is great for backing up your settings or sharing them across devices.

## 🚀 How to Use

1.  **Launch the App**: Open the `index.html` file in a modern web browser that supports the File System Access API (e.g., Google Chrome, Microsoft Edge).
2.  **Set Up Your Profile**: On your first visit, you'll be prompted to enter your name to create a user profile.
3.  **Load Photos**: Click the **"Select Directory"** button in the sidebar to choose a folder of photos from your computer.
4.  **Let the AI Work**: The application will begin scanning and analyzing your photos. You can watch the progress in real-time.
5.  **Organize**:
    - Use the **Grid View** or **Folder View** to browse your photos.
    - Use the **filter bar** to search for specific content.
    - **Single-click** to select photos, and use the action buttons (`Apply Rules`, `Isolate Selection`, `Delete Selected`) to manage them.
6.  **Customize (Optional)**:
    - Click the **settings icon** next to your name to open your profile.
    - Add custom **selection rules**, adjust the **uncertainty threshold**, and manage your preferences.
    - Don't forget to **export your profile** to save your settings!

---

Built with ❤️ using React, TypeScript, Tailwind CSS, and TensorFlow.js.
