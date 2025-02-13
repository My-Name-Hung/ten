//Dependecies
require("dotenv").config();
const express = require("express");
const app = express();
const Client = require("pg").Client;
const cors = require("cors");
app.use(express.json());
const https = require("https");

// Setting cors
app.use(
  cors({
    origin: ["https://windowaudit-demo.netlify.app", "http://localhost:5173"],
    credentials: true
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
const {
  connectionString,
  password,
  host,
  database,
} = require("pg/lib/defaults");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 10 login requests per windowMs
  message: { error: "Hệ thống quá tải, hãy thử lại sau ít phút" },
});

// Add login endpoint
app.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({ 
      success: false,
      message: "Username và password là bắt buộc" 
    });
  }

  try {
    // Log để debug
    console.log("Attempting login for username:", username);

    // Tìm người dùng theo username và password
    const result = await db.query(
      "SELECT * FROM users WHERE username = $1 AND password = $2",
      [username, password]
    );

    if (result.rows.length === 0) {
      console.log("No user found with provided credentials");
      return res.status(401).json({
        success: false,
        message: "Tài khoản hoặc mật khẩu không đúng"
      });
    }

    const user = result.rows[0];
    console.log("User found:", user.username);

    // Kiểm tra trạng thái "must_change_password"
    if (user.must_change_password) {
      return res.status(200).json({
        success: false,
        message: "Bạn cần đổi mật khẩu trước khi truy cập hệ thống",
        mustChangePassword: true,
      });
    }

    // Cập nhật thời gian đăng nhập lần cuối
    await db.query(
      "UPDATE users SET last_login = NOW() WHERE id = $1",
      [user.id]
    );

    // Tạo và gửi token response
    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      mustChangePassword: false,
      token: "your-token-here", // Thêm token nếu bạn đang sử dụng
      username: user.username
    });

  } catch (error) {
    console.error("Detailed login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Lỗi hệ thống",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

// Event
// Add an endpoint to fetch events
app.get("/events", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        eventid, 
        event_name, 
        start_time, 
        end_time,
        GREATEST(0, DATE_PART('day', end_time - NOW())) AS days_remaining
      FROM event
      ORDER BY start_time ASC
    `);
    res.status(200).send(result.rows);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send({ error: "Failed to fetch events." });
  }
});

// Add endpoint to fetch all store info
app.get("/store-info", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        store_id, name, shop_owner, telephone, mobilephone,
        address, district, province, region,
        channel, store_rank,
        npp_code, npp_name,
        sr_code, sr_name,
        tsm_code, tsm_name,
        asm_code, asm_name
      FROM info
      ORDER BY store_id ASC
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching store info:", error);
    res.status(500).json({ error: "Failed to fetch store information." });
  }
});

// Add endpoint to update store status
app.post("/update-status", async (req, res) => {
  const { store_id, status_type, note } = req.body;
  
  try {
    const result = await db.query(`
      INSERT INTO status (store_id, status_type, note)
      VALUES ($1, $2, $3)
      ON CONFLICT (store_id) 
      DO UPDATE SET 
        status_type = $2,
        note = $3,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [store_id, status_type, note]);
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Failed to update status." });
  }
});

// Get event details
app.get("/events/:eventId", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        eventid, 
        event_name, 
        start_time, 
        end_time,
        GREATEST(0, DATE_PART('day', end_time - NOW())) AS days_remaining
      FROM event
      WHERE eventid = $1
    `, [req.params.eventId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching event details:", error);
    res.status(500).json({ error: "Failed to fetch event details" });
  }
});

// Get stores for specific event with status
app.get("/event-stores/:eventId", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        i.store_id,
        i.name,
        i.mobilephone,
        i.address,
        si.image_url,
        s.status_type,
        COALESCE(s.status_type, 'Đang chờ duyệt') as status
      FROM info i
      LEFT JOIN store_images si ON i.store_id = si.store_id
      LEFT JOIN status s ON i.store_id = s.store_id
      WHERE i.eventid = $1
      ORDER BY i.store_id ASC
    `, [req.params.eventId]);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching event stores:", error);
    res.status(500).json({ error: "Failed to fetch event stores" });
  }
});

