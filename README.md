# Kode Club - Backend ⚙️

The robust API engine powering the Kode Club platform. Built with a focus on security, scalability, and real-time data handling.

## 🚀 core Functionalities

- **Authentication System**: Secure JWT-based auth and seamless Google OAuth 2.0 integration.
- **Role-Based Access Control (RBAC)**: Distinct permissions for Students, Members, and Admins.
- **Visitor Tracking**: Intelligent analytics system to track unique site visits and user engagement.
- **Announcement Engine**: Real-time management of global sitewide announcements.
- **Leaderboard Logic**: Advanced aggregation of quiz scores and attempt history.
- **DPP Management**: Automated handling of daily coding challenges.

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **ORM**: [Mongoose](https://mongoosejs.com/)
- **Security**: [Passport.js](https://www.passportjs.org/), JWT, Bcrypt
- **Deployment**: [Render](https://render.com/)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Connection String

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/vjain5375/kode-klub-backend.git
   cd kode-klub-backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=https://your-frontend.vercel.app
   GOOGLE_CLIENT_ID=your_id
   GOOGLE_CLIENT_SECRET=your_secret
   GOOGLE_CALLBACK_URL=https://your-backend.onrender.com/api/auth/google/callback
   ```

4. **Run the Server**
   ```bash
   npm start
   ```
   The server will start on [http://localhost:4000](http://localhost:4000).

## 📊 API Endpoints

- **Auth**: `/api/auth` (Login, Register, Google OAuth)
- **Quizzes**: `/api/quiz` (List, Create, Toggle)
- **DPPs**: `/api/dpp` (Daily problems, Admin management)
- **Leaderboards**: `/api/leaderboard` (Live rankings)
- **Admin**: `/api/admin` (Statistics, Announcements, Site health)

## 🛡️ Security

This API implements standard security practices including:
- CORS configuration for frontend isolation.
- Password hashing using Bcrypt.
- Protected routes via JWT Middleware.
- Secure environment variable management.

---
*Maintained by the Kode Club Development Team.*
