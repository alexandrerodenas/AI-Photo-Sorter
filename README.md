
# AI Photo Sorter

An intelligent web application to automatically sort and manage your photos using AI-powered analysis. Load photos from a local directory, view AI-generated tags, and apply custom rules to keep your collection organized.

## ✨ Features

-   **Local Directory Loading**: Securely load photos directly from your computer's file system. No uploads required!
-   **Client-Side AI-Powered Object Detection**: Automatically analyze photos to identify objects using a machine learning model that runs **entirely in your browser**. Your photos are never uploaded, ensuring complete privacy.
-   **Customizable Filter Rules**: Create rules to automatically select photos based on detected labels and confidence scores (e.g., "select all photos with 'cat' at >80% confidence").
-   **Manual & Automatic Rule Application**: Apply your custom rules with a single click or have them run automatically when photos are loaded.
-   **Interactive Photo Gallery**: View, select, and manage your photos in a responsive and intuitive grid.
-   **Photo Viewer**: Double-click a photo to see a larger view and detailed AI predictions.
-   **Bulk Deletion**: Select multiple photos and permanently delete them from your local disk.
-   **Profile Management**: Save your preferences and rules in a user profile that can be exported and imported.

## 🧠 How It Works

This application leverages the power of **TensorFlow.js** to run a state-of-the-art object detection model (COCO-SSD) directly in your web browser.

-   **100% Client-Side**: All processing, including the AI analysis, happens on your computer.
-   **Privacy First**: Your photos are never sent to a server. They remain on your local machine at all times.
-   **Offline Capable**: Once the application and the model are loaded, you can disconnect from the internet and continue sorting your photos.


## 🚀 Getting Started

1.  Open the `index.html` file in your browser.
2.  You'll be prompted to enter your name to create a user profile.
3.  Click the "Select Directory" button.
4.  Choose a folder on your computer that contains photos.
5.  The application will begin scanning and analyzing your images. This may take a moment the first time as the AI model is loaded.
6.  Use the filters, rules, and selection tools to manage your photos.

## ⚠️ Browser Compatibility

This application uses the modern **File System Access API** (`window.showDirectoryPicker`) to allow you to select and interact with local directories directly in the browser. This API provides enhanced security and performance.

**As a result, full functionality is only available on browsers that support this API.**

-   ✅ **Supported Browsers**:
    -   Google Chrome (version 86+)
    -   Microsoft Edge (version 86+)

-   ❌ **Unsupported Browsers**:
    -   Firefox (all versions)
    -   Safari (all versions)

If you open this application in an unsupported browser, the "Select Directory" feature will be disabled, and a message will inform you of the incompatibility. For the best experience, please use a recent version of Chrome or Edge.