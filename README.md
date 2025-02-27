# User Management System

A complete user management system with authentication built using React, Tailwind CSS, Node.js, Express.js, and MySQL.

## Features

- User registration and login
- JWT authentication with HTTP-only cookies
- Protected routes
- User profile management
- Responsive design with Tailwind CSS
- MySQL database integration

## Project Structure

- `/src` - React frontend
  - `/components` - Reusable UI components
  - `/context` - React context for state management
  - `/pages` - Application pages
- `/server` - Express.js backend
  - `/routes` - API routes
  - `/middleware` - Express middleware

## Setup Instructions

### Prerequisites

- Node.js
- MySQL

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the MySQL connection details and JWT secret

4. Initialize the database:
   ```
   npm run server
   ```

5. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

## Technologies Used

- **Frontend**:
  - React
  - React Router
  - Tailwind CSS
  - Axios
  - Lucide React (icons)

- **Backend**:
  - Node.js
  - Express.js
  - MySQL
  - JSON Web Tokens (JWT)
  - bcrypt.js