//Dependecies
require("dotenv").config();
const express = require("express");
const app = express();
const Client = require("pg").Client;
const cors = require("cors");
const bcrypt = require("bcryptjs"); // Add this for password hashing
const jwt = require("jsonwebtoken"); // Add this for JWT
const cron = require("node-cron"); // Import the cron library
const https = require("https");

// Setting crors
app.use(
  cors({
    origin: ["https://windowaudit-demo.netlify.app","https://ten-server.onrender.com", "http://localhost:5173"],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

// Make sure this CORS configuration is placed BEFORE your routes
app.use(express.json());

// Let run server
const port = process.env.SERVER_PORT || 3002;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Create config database
const dbConfig = {
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
};

// Create a new PostgreSQL client
const db = new Client(dbConfig);

// Connet database
db.connect().then(() => {
  console.log("Connected to PostgreSQL database");
});

// Rate login
const rateLimit = require("express-rate-limit");
const { connectionString, password, host, database } = require("pg/lib/defaults");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 10 login requests per windowMs
  message: { error: "Hệ thống quá tải, hãy thử lại sau ít phút" },
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: "Không tìm thấy token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
};

// Login endpoint
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await db.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        message: "Tài khoản hoặc mật khẩu không đúng" 
      });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ 
        message: "Tài khoản hoặc mật khẩu không đúng" 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, userscode: user.userscode },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await db.query(
      "UPDATE users SET last_login = NOW() WHERE id = $1",
      [user.id]
    );

    res.json({
      success: true,
      token,
      mustChangePassword: user.must_change_password,
      message: "Đăng nhập thành công"
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
});

// Reset password endpoint
app.post("/reset-password", verifyToken, async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  try {
    const userResult = await db.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        message: "Người dùng không tồn tại" 
      });
    }

    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(oldPassword, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ 
        message: "Mật khẩu cũ không chính xác" 
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await db.query(
      `UPDATE users 
       SET password_hash = $1, 
           must_change_password = false,
           updated_at = NOW()
       WHERE username = $2`,
      [newPasswordHash, username]
    );

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
<<<<<<< HEAD
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
=======
    console.error("Error during password reset:", error);
    res.status(500).send({ error: "Lỗi hệ thống" });
>>>>>>> parent of 75f9be2 (add event show)
  }
});

// Cron Job: Runs every 5 minutes to check the database health
cron.schedule("*/1 * * * *", async () => {
  const url = "https://ten-server.onrender.com";

  https
    .get(url, (res) => {
      if (res.statusCode === 404) {
        console.log("Server pinged successfully to prevent sleep.");
      } else {
        console.error(`Server ping failed with status code: ${res.statusCode}`);
      }
    })
    .on("error", (error) => {
      console.error("Error pinging server:", error);
    });

  try {
    console.log("Running Cron Job: Checking database health...");

    // Example query to check for stale data
    const result = await db.query(
      "SELECT COUNT(*) FROM users WHERE last_login < NOW() - INTERVAL '30 days'"
    );
    const staleUsers = result.rows[0].count;

    console.log(
      `There are ${staleUsers} users who haven't logged in for the past 30 days.`
    );

    // Additional actions, such as cleaning up old data, can be added here
  } catch (error) {
    console.error("Error running cron job:", error);
  }
});

// Admin login endpoint
app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Log the received credentials (remove in production)
    console.log('Login attempt:', { username });

    const result = await db.query(
      "SELECT * FROM admin_users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        message: "Tài khoản hoặc mật khẩu không đúng" 
      });
    }

    const admin = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ 
        message: "Tài khoản hoặc mật khẩu không đúng" 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, isAdmin: true },
      process.env.JWT_SECRET || 'your-secret-key', // Make sure you have JWT_SECRET in .env
      { expiresIn: '24h' }
    );

    // Send success response
    res.json({
      success: true,
      token,
      message: "Đăng nhập thành công"
    });

  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
});

// Admin middleware
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Create user endpoint (admin only)
app.post("/admin/create-user", verifyAdmin, async (req, res) => {
  const { username, password, userscode } = req.body;

  try {
    // Check if username or userscode already exists
    const existingUser = await db.query(
      "SELECT * FROM users WHERE username = $1 OR userscode = $2",
      [username, userscode]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        message: "Username or userscode already exists" 
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await db.query(
      `INSERT INTO users (username, password_hash, userscode, must_change_password)
       VALUES ($1, $2, $3, true)
       RETURNING id, username, userscode`,
      [username, passwordHash, userscode]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all users (admin only)
app.get("/admin/users", verifyAdmin, async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, username, userscode, is_active, created_at FROM users"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Toggle user status (admin only)
app.put("/admin/toggle-user/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `UPDATE users 
       SET is_active = NOT is_active 
       WHERE id = $1 
       RETURNING id, username, is_active`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Toggle user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Test endpoint to verify server is running
app.get("/admin/test", (req, res) => {
  res.json({ message: "Admin API is working" });
});
