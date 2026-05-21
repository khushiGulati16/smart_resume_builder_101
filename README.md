# 🚀 Smart Resume Builder

A full-stack AI-powered Resume Builder web application that helps users create professional, ATS-friendly resumes with real-time live preview, PDF export, and ATS analysis features.

---

## 🌟 Features

### 📝 Resume Builder
- Create professional resumes easily
- Multiple modern resume templates
- Real-time live preview using Socket.io
- Dynamic resume editing

### 📄 PDF Export
- Download resumes as high-quality PDFs
- ATS-friendly formatting
- Puppeteer-powered PDF generation

### 🎯 ATS Checker
- Upload resume PDFs
- Upload job descriptions
- Keyword matching & ATS score analysis
- Resume parsing using PDF extraction

### 🔐 Authentication System
- User Registration & Login
- JWT Authentication
- Secure Cookies
- Password hashing using bcryptjs

### 🛡️ Admin Dashboard
- Manage all users
- View all resumes
- Admin-only protected routes

### ⚡ Real-Time Features
- Socket.io integration
- Instant resume updates
- Live editing preview

---

# 🛠️ Tech Stack

## Frontend
- HTML5
- CSS3
- JavaScript
- EJS Templates
- SweetAlert2

## Backend
- Node.js
- Express.js
- Socket.io
- Puppeteer

## Database
- MongoDB Atlas
- Mongoose

## Authentication & Security
- JWT
- bcryptjs
- cookie-parser
- helmet
- express-rate-limit

## File Handling
- Multer
- pdf-parse
- pdf2json

---

# 📂 Project Structure

```bash
smart-resume-builder/
│
├── controllers/
├── middleware/
├── models/
├── routes/
├── views/
├── public/
├── db/
├── app.js
├── package.json
├── .env
└── README.md
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/smart_resume_builder_101.git
```

---

## 2️⃣ Navigate to Project

```bash
cd smart_resume_builder_101
```

---

## 3️⃣ Install Dependencies

```bash
npm install
```

---

## 4️⃣ Create `.env` File

```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
PORT=3000
NODE_ENV=development
```

---

## 5️⃣ Run Application

```bash
npm start
```

---

# 🌐 Deployment

This project is deployed using:

- Railway
- MongoDB Atlas

---

# 🔒 Security Features

- JWT Authentication
- Password Hashing
- Rate Limiting
- Secure Cookies
- Helmet Security Headers

---

# 📸 Screenshots

## Home Page
(Add Screenshot Here)

## Resume Builder
(Add Screenshot Here)

## ATS Checker
(Add Screenshot Here)

## Admin Dashboard
(Add Screenshot Here)

---

# 🚀 Future Improvements

- AI Resume Suggestions
- LinkedIn Resume Import
- Dark Mode
- Resume Analytics
- Drag-and-Drop Resume Sections
- AI Skill Recommendations

---

# 👨‍💻 Author

## Khushi Gulati

- GitHub: https://github.com/khushiGulati16

---

# ⭐ Support

If you like this project, give it a ⭐ on GitHub!
