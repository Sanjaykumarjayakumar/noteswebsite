# Notes Website

A modern and responsive Notes Application built with **Next.js** that allows users to create, edit, delete, search, and organize their personal notes. The application features a clean UI, fast performance, and seamless integration with a backend API.

## Features

- User Authentication (Login & Signup)
- Create, Read, Update, and Delete (CRUD) Notes and Share Notes
- Search Notes
- Responsive Design
- Fast Performance with Next.js
- Real-time UI Updates
- Clean and Modern User Interface
- Secure API Integration

##  Tech Stack

- **Framework:** Next.js
- **Language:** TypeScript / JavaScript
- **Styling:** Tailwind CSS
- **State Management:** React Context API
- **HTTP Client:** Axios / Fetch API
- **Icons:** Lucide React
- **Deployment:** Vercel

## Project Structure

```
notes-frontend/
│── app/
│── components/
│── hooks/
│── lib/
│── public/
│── .env.local
│── package.json
│── README.md
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/notes-frontend.git
```

### 2. Navigate to the project

```bash
cd notes-frontend
```

### 3. Install dependencies

```bash
npm install
```

or

```bash
yarn install
```

or

```bash
pnpm install
```

## Environment Variables

Create a `.env.local` file in the root directory and add:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

##  Run the Development Server

```bash
npm run dev
```

Open your browser and visit:

```
http://localhost:3000
```

##  Build for Production

```bash
npm run build
```

##  Start Production Server

```bash
npm run start
```

##  Screens

- Login Page
- Signup Page
- Dashboard
- Create Note
- Search Notes
- Profile (Optional)

##  Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

##  Backend API

This project connects to a REST API backend for:

- User Authentication
- Notes CRUD Operations
- Search Functionality

Configure the API URL using the `.env.local` file.

##  Future Improvements

- Rich Text Editor
- Note Categories
- Tags
- Reminder Notifications
- Archive Notes
- Trash & Restore
- Markdown Support
