# Secrets-App

A secure platform where users can anonymously share their secrets and view others’ — because everyone has something they’re not saying out loud.

---

### ✨ Features

- 🔒 **User Authentication** — Sign up or log in using either traditional credentials or OAuth providers (e.g., Google).
- 🛡️ **Data Encryption** — Secrets are encrypted before being stored to keep user data private and secure.
- 👻 **Anonymous Sharing** — Secrets are displayed without usernames, offering a safe space to express yourself.
- 📄 **Session Management** — Ensures secure and persistent login using best practices for web authentication.

---

### 🔧 Tech Stack

- **Node.js + Express** — Server-side backend
- **MongoDB + Mongoose** — Database and modeling
- **Passport.js + OAuth 2.0** — Authentication strategy
- **bcrypt + mongoose-encryption** — Password hashing and secret encryption
- **EJS Templates** — Dynamic rendering on the frontend

---

### 🛡️ Security Practices

We take security seriously:
- 🔐 **Passwords are hashed** using industry-standard algorithms.
- 📦 **Environment variables** are used to store sensitive keys (via `.env` file).
- 🚫 **No secrets are committed to the repo**, guaranteed by a strict `.gitignore` policy.

---

### 🚀 Getting Started

To run this app locally:

```bash
git clone https://github.com/your-username/secrets-app.git
cd secrets-app
npm install
npm start
```

Make sure to set up your `.env` file with the necessary variables:

```
PORT=3000
MONGO_URI=your-mongodb-url
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
SESSION_SECRET=your-session-secret
```
