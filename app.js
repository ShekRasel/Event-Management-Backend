require("dotenv").config();
// This environment's system DNS refuses MongoDB Atlas SRV lookups.
// Preserve the project's working resolver configuration.
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const contactRoute = require("./routes/contact");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Static folder for profile photos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/set-cookie", (req, res) => {
  res.cookie("m", "value", { httpOnly: true, secure: true });
  res.send("Cookie has been set");
});

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Event management API is running',
    description: 'This is the backend API. Open the frontend application to use the website.'
  });
});

app.use("/api", authRoutes);
app.use("/api", serviceRoutes);
app.use("/api", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoute);

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status >= 400 && err.status < 500 ? err.status : 500;
  res.status(status).json({ message: status === 500 ? 'Server error' : err.message });
});

async function start() {
  for (const key of ['MONGODB_URI', 'JWT_SECRET']) {
    if (!process.env[key]) throw new Error(`${key} is required`);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');
  return app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}

if (require.main === module) {
  start().catch((err) => {
    const missing = ['MONGODB_URI', 'JWT_SECRET'].filter(key => !process.env[key]);
    if (missing.length) {
      console.error(`Startup failed: missing ${missing.join(', ')}.`);
    } else {
      // Report diagnostic codes without logging connection strings or credentials.
      console.error(`Startup failed (${err.name || 'Error'}${err.code ? `: ${err.code}` : ''}${err.syscall ? `, ${err.syscall}` : ''}). Check MongoDB connectivity and configuration.`);
    }
    process.exitCode = 1;
  });
}

module.exports = { app, start };
