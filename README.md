# AI Photo Sorter

An intelligent web application to automatically sort and manage your photos using AI-powered semantic search and auto-tagging. Describe the photos you're looking for, or browse by AI-generated categories.

## ✨ Features

-   **Local Directory Loading**: Securely load photos directly from your computer's file system. No uploads required!
-   **Client-Side Semantic Search**: Use natural language to find your photos. Search for "a dog playing on the beach" or "sunsets over mountains" and a local AI model will find matching images.
-   **AI Auto-Tagging**: Photos are automatically analyzed and tagged with relevant keywords (e.g., "Nature", "Sunset", "Animals") using the Google Gemini vision model.
-   **Dual View Modes**:
    -   **Grid View**: A classic, responsive photo gallery.
    -   **Folder View**: Browse your photos in an organized structure, grouped first by analysis status and then by their AI-generated tags.
-   **Interactive Photo Gallery**: View, select, and manage your photos in a responsive and intuitive grid that shows search results ranked by relevance.
-   **Photo Viewer**: Double-click a photo to see a larger view.
-   **Bulk Deletion**: Select multiple photos and permanently delete them from your local disk.
-   **Profile Management**: Save your preferences in a user profile that can be exported and imported.

## 🧠 How It Works

This application leverages a hybrid AI approach for powerful and private photo management:

-   **On-Device AI for Search**: It uses **`@xenova/transformers.js`** to run a state-of-the-art multi-modal model (**CLIP**) directly in your web browser for semantic search. This part of the processing is 100% client-side and can work offline after initial load.
-   **Cloud AI for Categorization**: To automatically generate descriptive tags for your photos, the application sends them to the **Google Gemini API**. This requires an internet connection and a valid API key.

## 🔒 Privacy & Data Usage

-   **Semantic Search**: Performed entirely on your device. Your photos are **never** sent to a server for search-related tasks.
-   **Auto-Tagging**: To generate tags, images are sent to the Google Gemini API. According to Google's policies, data is not stored or used for model training. However, be aware that this feature involves sending your photo data to a cloud service.

## 🚀 Getting Started

1.  **API Key Setup**: This application requires a Google Gemini API key. You must set it as an environment variable named `API_KEY`.
2.  Open the `index.html` file in your browser.
3.  You'll be prompted to enter your name to create a user profile.
4.  Click the "Select Directory" button.
5.  Choose a folder on your computer that contains photos.
6.  The application will begin scanning and analyzing your images. This requires an internet connection and may take a moment.
7.  Use the search bar for semantic search, or switch to the Folder View to browse by AI-generated categories.

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