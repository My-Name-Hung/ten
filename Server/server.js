//Dependecies
require("dotenv").config();
const express = require("express");
const app = express();
const Client = require("pg").Client;
const cors = require("cors");
app.use(express.json());
const cron = require("node-cron"); // Import the cron library
const https = require("https");

// Setting crors
app.use(
  cors({
    origin: ["https://windowaudit-demo.netlify.app", "http://localhost:5173"],
  })
);

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

// Add login endpoint
app.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  try {
    // Tìm người dùng theo username và password
    const result = await db.query(
      "SELECT * FROM users WHERE username = $1 AND password = $2",
      [username, password]
    );

    if (result.rows.length === 0) {
      return res
        .status(401)
        .send({ message: "Tài khoản hoặc mật khẩu không đúng" });
    }

    const user = result.rows[0];

    // Kiểm tra trạng thái "must_change_password"
    if (user.must_change_password) {
      return res.status(200).send({
        success: false,
        message: "Bạn cần đổi mật khẩu trước khi truy cập hệ thống",
        mustChangePassword: true,
      });
    }

    // Cập nhật thời gian đăng nhập lần cuối
    await db.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
      user.id,
    ]);

    res.status(200).send({
      success: true,
      message: "Đăng nhập thành công",
      mustChangePassword: false,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send({ error: "Lỗi hệ thống" });
  }
});

// Đổi mật khẩu
app.post("/reset-password", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;

  try {
    // Kiểm tra mật khẩu cũ
    const userResult = await db.query(
      "SELECT * FROM users WHERE username = $1 AND password = $2",
      [username, oldPassword]
    );

    if (userResult.rows.length === 0) {
      return res
        .status(401)
        .send({ message: "Mật khẩu cũ không chính xác. Vui lòng thử lại." });
    }

    // Cập nhật mật khẩu mới
    const updateResult = await db.query(
      "UPDATE users SET password = $1, must_change_password = false WHERE username = $2 RETURNING *",
      [newPassword, username]
    );

    if (updateResult.rowCount === 0) {
      return res.status(400).send({ message: "Đổi mật khẩu thất bại." });
    }

    res.status(200).send({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).send({ error: "Lỗi hệ thống" });
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
