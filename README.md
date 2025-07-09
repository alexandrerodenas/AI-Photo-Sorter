# AI Photo Sorter

An intelligent web application designed to automatically sort and manage your photos using AI-powered analysis. Load photos from a local directory, view AI-generated predictions, and apply custom rules to keep your collection effortlessly organized.

## ✨ Features

-   **Load from Local Directory**: Securely connect to a local directory on your machine to stream and analyze photos. This requires a backend component with access to your filesystem.
-   **AI-Powered Object Detection**: Each photo is automatically analyzed to identify objects and content, providing you with a list of labels and confidence scores.
-   **Interactive Photo Gallery**: View your photos in a responsive grid. See their analysis status (Queued, Analyzing, Analyzed) at a glance.
-   **Customizable Filter Rules**: Create powerful rules to automatically select photos. For example, "Select all photos with 'cat' and confidence > 80%".
-   **Manual & Automatic Operation**: Choose to have your rules applied automatically as photos are loaded, or apply them manually with a single click.
-   **Bulk Actions**:
   -   **Select All / Clear All**: Quickly select or deselect all analyzed photos.
   -   **Delete Selected**: Permanently delete selected photos from your file system after review.
-   **Detailed Photo Viewer**: Double-click any photo to open a detailed view with a larger image and a complete list of its AI predictions.
-   **Persistent User Profiles**: Your name and custom rules are saved in your browser's local storage for a personalized experience every time you visit.
-   **Modern & Responsive UI**: Built with React and Tailwind CSS, the interface is clean, intuitive, and works beautifully across different screen sizes.

## 🚀 How to Use

1.  **Onboarding**: The first time you launch the application, you'll be asked for your name to personalize your workspace. Some default rules are created to get you started.

2.  **Load Photos**:
   -   In the sidebar, enter the full path to a directory on your computer containing the photos you want to sort.
   -   Click the **Load** button. The application will connect to the backend, find your photos, and begin streaming them for analysis.

3.  **Interact with Photos**:
   -   As photos are loaded, they will appear in the main content area.
   -   **Single-click** a photo to select or deselect it. Selected photos are highlighted with an accent color border.
   -   **Double-click** a photo to open the detailed viewer, where you can see a larger preview and the full list of AI predictions.

4.  **Manage Your Rules**:
   -   Click the **Settings icon** (⚙️) next to your name to open the Profile & Rules editor.
   -   Here you can:
      -   Change your name.
      -   Toggle whether rules are applied automatically on load.
      -   **Add new rules** by specifying a label (e.g., "dog", "car") and a minimum confidence level.
      -   **Delete** existing rules.

5.  **Apply Actions**:
   -   **Apply Manual Rules**: Click this to select all photos that match your currently defined rules without deselecting any photos you've manually selected.
   -   **Select All / Clear All**: Use these buttons for quick bulk selection management.
   -   **Delete Selected**: Once you have reviewed your selection, click this button to permanently delete the chosen photos from your directory.

## 🛠️ Technical Stack

-   **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons
-   **Backend**: The application requires a backend server (e.g., Python with Flask/FastAPI or Node.js with Express) to handle:
   -   File system access for reading and deleting photos.
   -   Serving photos to the frontend via a WebSocket stream.
   -   Interfacing with an object detection model for AI analysis.

## 🔧 Setup and Installation (For Developers)

This project consists of a frontend application and requires a corresponding backend service to be running.

### Frontend

1.  Clone the repository.
2.  Navigate to the project directory: `cd [project-name]`
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Run the development server (assuming a standard React setup):
    ```bash
    npm run start 
    ```
    The application will be available at `http://localhost:3000`.

### Backend

You must have a backend server running that exposes the following endpoints (as expected by `services/api.ts`):
-   `POST /detect`: Accepts an image file and returns an array of predictions (`[{label: string, score: number}]`).
-   `DELETE /photos/{path}`: Deletes a photo at the given URL-encoded path.
-   `GET /photos?directory={path}`: Checks if a directory is valid and returns the number of photos (`{count: number}`).
-   A WebSocket endpoint at `http://localhost:5000` that listens for a `stream_photos` event and streams back `photo` events with `{path: string, binary: string}` data.
