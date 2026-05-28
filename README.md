
<p align="center">
  <img src="public/logo.png" alt="Pixo Logo" width="128">
</p>

<h1 align="center">Pixo</h1>

<p align="center">
  <em>Organize your photos effortlessly.</em>
</p>

<p align="center">
  <a href="https://github.com/alexandrerodenas/Pixo/blob/develop/LICENSE"><img src="https://img.shields.io/github/license/alexandrerodenas/Pixo?color=blue" alt="License"></a>
  <a href="https://github.com/alexandrerodenas/Pixo/releases"><img src="https://img.shields.io/github/package-json/v/alexandrerodenas/Pixo?color=green" alt="Version"></a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.7">
  <img src="https://img.shields.io/badge/TensorFlow.js-4.20-FF6F00?logo=tensorflow&logoColor=white" alt="TensorFlow.js 4.20">
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite 6">
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" alt="Docker">
  <a href="https://github.com/alexandrerodenas/Pixo/commits/develop"><img src="https://img.shields.io/github/last-commit/alexandrerodenas/Pixo?color=blue" alt="Last commit"></a>
</p>

Pixo is a privacy-first web application that organizes your local photos using AI — entirely in your browser. No uploads, no servers, no data collection.

Leveraging the File System Access API and TensorFlow.js, it runs MobileNet and COCO-SSD models locally for scene classification, object detection, blur scoring, and duplicate matching.

## Features

- **100% Local & Private** — All processing stays in your browser. Your photos never leave your machine.
- **AI Analysis** — Scene classification (MobileNet) and object detection (COCO-SSD), accelerated via WebGPU, WASM, or WebGL.
- **Blur Detection** — Laplacian Variance analysis on GPU, scoring each photo 0–100 with visual indicators.
- **Duplicate Detection** — Semantic embeddings to find exact duplicates, near-duplicates, and burst photos, auto-selecting the best version.
- **Dual View Modes** — Grid View for browsing, Folder View grouped by AI classification labels.
- **Custom Rules** — Create classification and detection rules (e.g., *"SELECT photos with 'beach' classification > 80%"*) with optional auto-apply.
- **Uncertainty Filtering** — Configurable threshold to flag ambiguous photos as *Uncategorized* for manual review.
- **Save & Organize** — Mark favorites, isolate selections, move saved photos to a dedicated folder, or permanently delete.
- **Dark Mode** — Respects your system's appearance settings.
- **Profile Import/Export** — Backup or share your rules and preferences as JSON.

## Quick Start

### Direct Browser

Open `index.html` in a browser supporting the File System Access API (Chrome, Edge). Follow the onboarding, then select a photo directory.

### Docker

```bash
docker build -t pixo .
docker run -d -p 8080:80 pixo
```

Open [http://localhost:8080](http://localhost:8080).

> **Note**: `localhost` is treated as a secure context by browsers, satisfying the File System Access API requirement.

## Usage

1. **Onboarding** — Enter your name to create a profile with sensible default rules.
2. **Load Photos** — Click *Select Directory* in the sidebar.
3. **AI Analysis** — Models run automatically; track progress in real-time.
4. **Organize** — Find duplicates, isolate blurry shots, mark favorites, apply rules, move or delete.
5. **Customize** — Add rules, adjust uncertainty threshold, change the saved folder name, export your profile.

## Tech Stack

**React 19**, **TypeScript**, **TensorFlow.js** (MobileNet, COCO-SSD), **Vite**, **Tailwind CSS**, **Docker**.
