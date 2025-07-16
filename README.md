# AI Photo Sorter

A privacy-first, in-browser application to automatically sort and manage your local photo library using on-device AI.

![AI Photo Sorter Screenshot](https://storage.googleapis.com/project-screenshots/ai-photo-sorter-screenshot.png) *(This is a placeholder screenshot URL)*

---

## ✨ Core Features

-   **100% Private & Secure**: Your photos are processed entirely on your device. Nothing is ever uploaded to a server, ensuring complete privacy.
-   **AI-Powered Tagging**: Leverages a built-in TensorFlow.js model (MobileNet) to scan, classify, and tag your photos based on their content.
-   **Direct File System Access**: Select a folder on your computer and manage your photos directly. The app can delete files with your permission.
-   **Powerful Rule Engine**: Create custom rules to automatically select photos that match specific labels and confidence levels (e.g., "select all photos with 'cat' at >80% confidence").
-   **Flexible Views**: Switch between a classic grid layout and a hierarchical folder view that groups photos by status and AI-detected labels.
-   **Profile Management**: Save your settings and rules into a profile that can be exported and imported as a simple JSON file.
-   **No Backend Required**: Runs entirely in the browser, making it portable and easy to use anywhere.

---

## 🚀 How It Works

This application is a modern single-page application built with the following technologies:

-   **Frontend**: **React** (with Hooks), **TypeScript**, and **Tailwind CSS** for a responsive and maintainable user interface.
-   **AI Engine**: **TensorFlow.js** with the **MobileNet** model for efficient, in-browser image classification. The WASM backend is preferred for performance.
-   **File System**: The modern **File System Access API** allows the browser to securely interact with your local files and folders *after you grant permission*.

---

## 🖥️ Getting Started

1.  **Open the App**: Launch the application in a supported web browser (e.g., Google Chrome, Microsoft Edge).
2.  **Create Profile**: On the landing page, enter your name to create a user profile. Default rules are added to get you started.
3.  **Load Photos**: In the main view, click **"Select Directory"** in the sidebar and choose a folder containing your photos.
4.  **AI Analysis**: The app will begin scanning and analyzing your photos. You can monitor the progress in the status bar.
5.  **Organize**:
    -   Use the **Grid View** for a quick overview or switch to the **Folder View** to see photos grouped by category.
    -   Click on photos to select them or double-click to view them in a larger modal with detailed prediction scores.
    -   Apply your custom rules or use the action buttons to select, clear, and delete photos.
6.  **Customize**: Click the settings icon next to your name to open the profile editor, where you can add, remove, and modify your filter rules. You can also import/export your entire profile.

---

## ⚠️ Browser Compatibility

This application relies on the **File System Access API**. As of now, this API is primarily supported by Chromium-based browsers like:

-   Google Chrome
-   Microsoft Edge
-   Opera

The app will show a warning if your browser is not supported.

---

## 📂 Project Structure

The codebase is organized for maintainability and scalability:

-   `/components`: Contains all reusable React components, broken down by feature (e.g., `PhotoCard`, `PhotoSorterSidebar`, `FolderView`).
-   `/hooks`: Houses custom React hooks, such as `usePhotoManager`, which encapsulates the core business logic for photo management and analysis.
-   `/services`: Includes modules for external interactions, such as `api.ts` (TensorFlow.js model interaction) and `storage.ts` (localStorage management).
-   `/App.tsx`: The main application component that handles routing and state management.
-   `/index.html`: The entry point of the application, which loads Tailwind CSS and sets up the import map for modules.
