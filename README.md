# Logistics Management System (Frontend)

A responsive, web-based frontend application for managing logistics tracking, shipments, and inventory. 

## 🛠️ Tech Stack
* **HTML5**: Project structure and semantic layout.
* **CSS3**: Custom styling, grid/flexbox layouts, and responsive design.
* **jQuery**: DOM manipulation, UI interactivity, and asynchronous API communication.

## ⚙️ Backend Integration
This frontend consumes data from a separate **Django REST Framework** backend API. It handles:
* User authentication (Login/Logout tokens)
* Real-time shipment status updates
* Driver and vehicle management data

## 🚀 Getting Started

### Prerequisites
You only need a modern web browser to run this project locally.

### Installation
1. Clone this repository:
   ```bash
   git clone https://github.com
   ```
2. Open the project folder.
3. Open `index.html` directly in your browser, or serve it using a local server (like VS Code Live Server).

### Connecting the API
Open your main JavaScript/jQuery file (e.g., `app.js` or `api.js`) and update the base API URL to point to your running Django backend:
```javascript
const API_BASE_URL = "http://127.0.0";
```

## 📂 Project Structure
* `/css` - Stylesheets for layouts and components.
* `/js` - jQuery scripts and API fetch requests.
* `/assets` - Images, icons, and fonts.
* `*.html` - Frontend user interface pages (Dashboard, Tracking, etc.).
