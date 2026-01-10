
<p align="center">
  <img src="logo.png" alt="Pixo Logo" width="128">
</p>

# Pixo

Organize your photos effortlessly.

Pixo is a powerful, privacy-focused web application that helps you automatically organize your local photos using artificial intelligence, right in your browser. No uploads, no servers, no data collection—your photos and your data stay on your machine.

This tool leverages the browser's File System Access API to read your photo directories and uses TensorFlow.js to run powerful AI models locally for comprehensive image analysis.

## ✨ Key Features

### Core Functionality
- **Local First & 100% Private**: Select a local directory on your computer. All processing happens directly in your browser. Your photos are never uploaded.
- **Dual AI-Powered Analysis**:
    - **Scene Classification**: Utilizes a MobileNet model to understand the overall context of your photos (e.g., "beach," "forest," "cityscape").
    - **Object Detection**: Employs a COCO-SSD model to identify and locate common objects within your photos (e.g., "person," "car," "dog").
- **High-Performance Backend**: Automatically uses the best available AI backend for your browser, supporting **WebGPU**, **WASM**, and **WebGL** for maximum speed.

### Blur Detection
- **Smart Sharpness Analysis**: Pixo automatically scans every photo to calculate a sharpness score (0-100) using Laplacian Variance analysis directly on your GPU.
- **Isolate Blurry Photos**: Quickly filter out low-quality, out-of-focus, or motion-blurred images with the **"Isolate Blurry"** feature. This makes it easy to delete bad shots and keep only the crispest memories.
- **Visual Indicators**: Blurry photos are marked with a warning icon in the grid view.
- **Detailed Scoring**: View the precise sharpness score and blur classification ("Sharp", "OK", "Blurry") in the photo details modal.

### Smart Duplicate Detection
- **AI-Powered Matching**: Goes beyond filename matching. Pixo extracts semantic embeddings from images to detect **exact duplicates**, **near-duplicates** (resized, compressed), and **burst photos** (similar frames taken in sequence).
- **GPU Accelerated**: Performs matrix calculations on your graphics card to compare thousands of photos in seconds.
- **Intelligent Cleanup**: Automatically groups similar photos and identifies the "best" version to keep (based on resolution, quality, and age), auto-selecting the redundant copies for easy deletion.

### Intuitive User Interface
- **Dual View Modes**:
    - **Grid View**: A classic, responsive grid to see all your photos at a glance.
    - **Folder View**: An organized, hierarchical view that automatically groups photos by their status. Analyzed photos are grouped into sub-folders based on their top *classification* label (e.g., "Cat," "Car," "Beach").
- **AI Model Loading Indicator**: See the real-time status of the AI models as they load in the background, so you know exactly when the app is ready for analysis.
- **Detailed Photo Viewer**: Double-click any photo to open a detailed modal view, showing a larger preview and two separate lists:
    - All AI scene classifications with confidence scores.
    - All detected objects with their confidence scores.
- **Dark Mode**: Sleek and eye-friendly dark theme that respects your system's settings.

### Powerful Organization & Automation
- **Save for Later**:
    - **Mark Favorites**: Click the heart icon on any photo to mark it as "saved".
    - **Isolate Saved Photos**: Instantly filter your view to see only your saved photos.
    - **Move Saved Photos**: Permanently move all your saved photos to a dedicated folder on your hard drive (e.g., "Pixo Saved"), removing them from the main view.
- **Advanced Custom Rules**:
    - Create powerful, context-specific rules in your user profile to automatically select photos.
    - **Classification Rules**: `SELECT photos with "beach" classification with confidence > 80%`.
    - **Detection Rules**: `SELECT photos where a "person" object is detected with confidence > 75%`.
    - Apply rules manually at any time or enable the **auto-apply** feature to have selections made for you as soon as photos are analyzed.
- **"Uncategorized" Filtering**:
    - Set a custom **"uncertainty threshold"** (from 0% to 50%) in your profile based on *classification* scores.
    - If all of an image's classification scores fall below this threshold, it is automatically marked as `Uncategorized`, separating ambiguous images for manual review.
- **Advanced Selection Tools**:
    - **Select/Clear All**: Bulk-select or deselect photos. This action smartly respects the current label filter.
    - **Isolate Selection**: Instantly hide all unselected photos to focus only on what's important. Click again to show all photos.
    - **Permanent Deletion**: Securely delete selected photos directly from your hard drive (with confirmation).

### Filtering & Sorting
- **Unified Filter**: Quickly find photos by searching for a specific label in the filter bar. The search now looks through both scene classifications and detected objects.
- **Sortable Folders**: In Folder View, sort the `Analyzed` category sub-folders alphabetically or by the number of photos they contain.

### Profile Management
- **Personalized Experience**: The app greets you by your name, which you can set in your profile.
- **Custom "Saved" Folder**: Customize the name of the folder where your saved photos are moved (e.g., change "Pixo Saved" to "My Favorites").
- **Import/Export Profile**: Save your complete user profile, including all your custom classification and detection rules, to a JSON file. This is great for backing up your settings or sharing them across devices.

## 🚀 How to Use

### Method 1: Direct Browser
1.  **Launch the App**: Open the `index.html` file in a modern web browser that supports the File System Access API (e.g., Google Chrome, Microsoft Edge).
2.  **Follow Onboarding**: Enter your name and set up your initial rules.
3.  **Start Organizing**: Select a directory to begin.

### Method 2: 🐳 Docker
You can easily run Pixo using Docker to serve the application locally.

1.  **Build the image**:
    ```bash
    docker build -t pixo .
    ```

2.  **Run the container**:
    ```bash
    docker run -d -p 8080:80 pixo
    ```

3.  **Access the app**:
    Open your browser and navigate to [http://localhost:8080](http://localhost:8080).

> **Note**: The File System Access API requires a secure context. `localhost` is treated as secure by browsers, so the app will function correctly when accessed via the Docker container on your local machine.

## 🕹 Usage Guide

1.  **Set Up Your Profile**: On your first visit, you'll be prompted to enter your name to create a user profile with some helpful default rules.
2.  **Load Photos**: Click the **"Select Directory"** button in the sidebar to choose a folder of photos from your computer.
3.  **Let the AI Work**: The application will begin scanning and analyzing your photos using both AI models. You can watch the progress in real-time.
4.  **Organize**:
    - **Find Duplicates**: Click **"Find Duplicates"** to scan your library. Pixo will group duplicates and auto-select the lower-quality versions. Review them in the "Isolate" view and delete them in one click.
    - **Filter Blurry Photos**: Click **"Isolate Blurry"** to see only photos with low sharpness scores.
    - **Mark Favorites**: Click the heart icon on photos to mark them for saving.
    - **Browse & Filter**: Use the Grid/Folder views and the filter bar to find specific content.
    - **Apply Rules**: Use the "Apply Rules" button to auto-select photos based on your criteria.
    - **Move/Delete**: Move your hearted photos to a new location or permanently delete selected (or duplicate) photos to free up space.
5.  **Customize (Optional)**:
    - Click the **settings icon** next to your name to open your profile.
    - Add custom **classification** and **detection** rules, adjust the **uncertainty threshold**, change your **"Saved" folder name**, and manage your preferences.
    - Don't forget to **export your profile** to save your settings!

---

Built with ❤️ using React, TypeScript, Tailwind CSS, and TensorFlow.js.
