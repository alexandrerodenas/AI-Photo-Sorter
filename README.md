# AI Photo Sorter

An intelligent web application to automatically sort and manage your photos using AI-powered image classification. The AI analyzes your photos locally and assigns labels, allowing you to easily find and organize them.

## ✨ Features

-   **Local Directory Loading**: Securely load photos directly from your computer's file system. No uploads required!
-   **AI-Powered Labeling**: An AI model, running **entirely in your browser**, analyzes each photo and assigns relevant labels (e.g., "dog", "car", "beach"). You can then filter your photos based on these labels.
-   **Interactive Photo Gallery**: View, select, and manage your photos in a responsive and intuitive grid.
-   **Photo Viewer**: Double-click a photo to see a larger view with all its AI-generated labels.
-   **Bulk Deletion**: Select multiple photos and permanently delete them from your local disk.
-   **Profile Management**: Save your preferences and custom filtering rules in a profile that can be exported and imported.

## 🧠 How It Works

This application leverages the power of **TensorFlow.js** to run the **MobileNet** image classification model directly in your web browser.

-   **100% Client-Side**: All processing, including the AI analysis, happens on your computer. The MobileNet model identifies objects and themes in your photos.
-   **Privacy First**: Your photos are never sent to a server. They remain on your local machine at all times.
-   **Offline Capable**: Once the application and the model are loaded, you can disconnect from the internet and continue sorting your photos.


## 🚀 Getting Started

1.  Open the `index.html` file in your browser.
2.  You'll be prompted to enter your name to create a user profile.
3.  Click the "Select Directory" button.
4.  Choose a folder on your computer that contains photos.
5.  The application will begin scanning and analyzing your images. This may take a moment the first time as the AI model is downloaded and loaded.
6.  Use the filter bar to filter photos by their AI-generated labels.

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
