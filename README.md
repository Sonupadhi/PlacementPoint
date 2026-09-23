# PlacementPoint - Campus Placement Portal

PlacementPoint is a full-stack campus placement management system built with **Django REST Framework** (Backend) and **React + Vite + TailwindCSS** (Frontend).

---

## 🚀 Quick Setup Guide

### 1. Prerequisites
Ensure you have the following installed:
* **Python 3.10+**
* **Node.js 18+** & `npm`
* **MySQL** (or SQLite fallback)

---

### 2. Backend Setup (Django)

1. Open terminal and navigate to the backend folder:
   ```bash
   cd PlacementPoint_Bankend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Navigate into the Django server folder:
   ```bash
   cd BackendServer
   ```
5. Apply database migrations:
   ```bash
   python manage.py migrate
   ```
6. (Optional) Populate initial demo data:
   ```bash
   python seed_data.py
   ```
7. Start the backend server:
   ```bash
   python manage.py runserver
   ```
   * The API will run at `http://127.0.0.1:8000/`.

---

### 3. Frontend Setup (React + Vite)

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd PlacementPoint_Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   * The app will run at `http://localhost:5173/`.

---

## 🔑 Default Login Credentials (from seed data)

* **Super Admin:** `admin` / `admin123`
* **Placement Coordinator:** `coord1` / `Coord@123`
* **Student:** `25C216A01` / `Student@123`
