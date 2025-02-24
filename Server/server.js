//Dependecies
require("dotenv").config();
const express = require("express");
const app = express();
const Client = require("pg").Client;
const cors = require("cors");
app.use(express.json());
const https = require("https");
const serverPinger = require('./utils/cronJobs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Setting cors
app.use(
  cors({
    origin: ["https://windowaudit-demo.netlify.app", "https://ten-p521.onrender.com", "http://localhost:5173"],
    credentials: true
  })
);

// Let run server
const port = process.env.SERVER_PORT || 3002;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  serverPinger.start();
});

// Create config database
const dbConfig = {
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
};

// Create a new PostgreSQL client and pool
const db = new Client(dbConfig);
const pool = new Pool(dbConfig);

// Connect database
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

// Middleware kiểm tra token và phân quyền
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: "Không tìm thấy token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debug log

    // Tìm user trong bảng users_register với user_id
    const userResult = await db.query(
      'SELECT * FROM users_register WHERE id = $1',
      [decoded.userId]
    );

    console.log('Found user:', userResult.rows[0]); // Debug log

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "User không tồn tại" });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: "Token không hợp lệ" });
  }
};

// API đăng nhập
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const result = await db.query(
      'SELECT u.*, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Tên đăng nhập hoặc mật khẩu không đúng"
      });
    }

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role_name },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      role: user.role_name,
      mustChangePassword: user.must_change_password
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Đăng nhập thất bại"
    });
  }
});

// API đăng ký
app.post("/register", async (req, res) => {
  console.log("Received registration request:", req.body);
  
  const {
    username,
    password,
    fullName,
    phone,
    idCard,
    province,
    district,
    ward,
    street
  } = req.body;

  // Validation
  if (!username || !password || !fullName || !phone || !idCard) {
    console.log("Missing required fields");
    return res.status(400).json({
      success: false,
      error: "Vui lòng điền đầy đủ thông tin bắt buộc"
    });
  }

  const client = await db.connect();
  console.log("Database connected");

  try {
    await client.query('BEGIN');

    // Kiểm tra username đã tồn tại
    const userExists = await client.query(
      'SELECT username FROM users WHERE username = $1',
      [username]
    );

    if (userExists.rows.length > 0) {
      throw new Error("Tên đăng nhập đã tồn tại");
    }

    // Lấy role_id cho SR
    const roleResult = await client.query(
      'SELECT role_id FROM roles WHERE role_name = $1',
      ['SR']
    );

    if (roleResult.rows.length === 0) {
      throw new Error("Không tìm thấy role SR");
    }

    const roleId = roleResult.rows[0].role_id;

    // Thêm user mới
    const newUser = await client.query(
      `INSERT INTO users (username, password, must_change_password)
       VALUES ($1, $2, true)
       RETURNING id`,
      [username, password]
    );

    console.log("User created:", newUser.rows[0]);
    const userId = newUser.rows[0].id;

    // Thêm thông tin chi tiết user
    await client.query(
      `INSERT INTO user_details (
        user_id, full_name, phone, id_card, 
        province, district, ward, street
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId, fullName, phone, idCard,
        province, district, ward, street
      ]
    );

    await client.query('COMMIT');
    console.log("Registration successful");

    res.json({
      success: true,
      message: "Đăng ký tài khoản thành công"
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Registration error:", error);
    res.status(400).json({
      success: false,
      error: error.message || "Đăng ký thất bại"
    });
  } finally {
    client.release();
  }
});

// API đổi mật khẩu
app.post("/reset-password", async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: "Không tìm thấy token xác thực"
    });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, 'your-secret-key');
    
    const result = await db.query(
      'SELECT id FROM users WHERE id = $1 AND password = $2',
      [decoded.id, oldPassword]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Mật khẩu cũ không đúng"
      });
    }

    await db.query(
      'UPDATE users SET password = $1, must_change_password = false WHERE id = $2',
      [newPassword, decoded.id]
    );

    res.json({
      success: true,
      message: "Đổi mật khẩu thành công"
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      error: "Đổi mật khẩu thất bại"
    });
  }
});

// API quên mật khẩu
app.post("/forgot-password", async (req, res) => {
  const { username, newPassword } = req.body;

  try {
    const result = await db.query(
      'UPDATE users SET password = $1, must_change_password = true WHERE username = $2 RETURNING id',
      [newPassword, username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy tài khoản"
      });
    }

    res.json({
      success: true,
      message: "Khôi phục mật khẩu thành công"
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      error: "Khôi phục mật khẩu thất bại"
    });
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
        *
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

// Lấy thông tin cửa hàng cho sự kiện cụ thể (Updated)
app.get("/event-stores/:eventId", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT
        i.store_id,
        i.name,
        i.mobilephone,
        i.address,
        si.image_url,
        ses.status_type as status
      FROM info i
      INNER JOIN store_events se ON i.store_id = se.store_id
      LEFT JOIN store_images si ON i.store_id = si.store_id
      LEFT JOIN store_event_status ses ON i.store_id = ses.store_id 
        AND se.eventid = ses.eventid
      WHERE se.eventid = $1
      ORDER BY i.store_id ASC
    `, [req.params.eventId]);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching event stores:", error);
    res.status(500).json({ error: "Failed to fetch event stores" });
  }
});

// Get store info by ID
app.get("/store-info/:id", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM info WHERE store_id = $1",
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy thông tin cửa hàng" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Update store info
app.put("/store-info/:id", async (req, res) => {
  const { address, mobilephone, store_rank, province, district, ward } = req.body;
  try {
    // Kiểm tra xem cửa hàng có tồn tại không
    const checkStore = await db.query(
      "SELECT * FROM info WHERE store_id = $1",
      [req.params.id]
    );

    if (checkStore.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy cửa hàng" });
    }

    // Cập nhật thông tin cửa hàng
    const result = await db.query(
      `UPDATE info 
       SET address = $1, 
           mobilephone = $2, 
           store_rank = $3, 
           province = $4, 
           district = $5, 
           ward = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE store_id = $7
       RETURNING *`,
      [
        address, 
        mobilephone, 
        store_rank, 
        province, 
        district, 
        ward, 
        req.params.id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cập nhật thất bại" });
    }
    
    res.json({
      success: true,
      message: "Cập nhật thành công",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating store info:", error);
    res.status(500).json({ 
      success: false,
      error: "Lỗi khi cập nhật thông tin",
      details: error.message 
    });
  }
});

// Get districts by province name
app.get("/districts/:provinceName", async (req, res) => {
  try {
    const provinceName = decodeURIComponent(req.params.provinceName);
    
    // Mapping tên tỉnh sang mã tỉnh
    let provinceCode;
    switch(provinceName) {
      // HCM Region
      case 'Thành phố Hồ Chí Minh':
        provinceCode = 79;
        break;
      case 'Bình Dương':
        provinceCode = 74;
        break;
      case 'Đồng Nai':
        provinceCode = 75;
        break;
      
      // CE Region
      case 'Thành phố Đà Nẵng':
        provinceCode = 48;
        break;
      case 'Bình Định':
        provinceCode = 52;
        break;
      case 'Gia Lai':
        provinceCode = 64;
        break;
      case 'Kon Tum':
        provinceCode = 62;
        break;
      case 'Phú Yên':
        provinceCode = 54;
        break;
      case 'Quảng Bình':
        provinceCode = 44;
        break;
      case 'Quảng Nam':
        provinceCode = 49;
        break;
      case 'Quảng Ngãi':
        provinceCode = 51;
        break;
      case 'Quảng Trị':
        provinceCode = 45;
        break;
      case 'Thừa Thiên Huế':
        provinceCode = 46;
        break;

      // MKD Region
      case 'Thành phố Cần Thơ':
        provinceCode = 92;
        break;
      case 'An Giang':
        provinceCode = 89;
        break;
      case 'Bạc Liêu':
        provinceCode = 95;
        break;
      case 'Bến Tre':
        provinceCode = 83;
        break;
      case 'Cà Mau':
        provinceCode = 96;
        break;
      case 'Đồng Tháp':
        provinceCode = 87;
        break;
      case 'Hậu Giang':
        provinceCode = 93;
        break;
      case 'Kiên Giang':
        provinceCode = 91;
        break;
      case 'Long An':
        provinceCode = 80;
        break;
      case 'Sóc Trăng':
        provinceCode = 94;
        break;
      case 'Tiền Giang':
        provinceCode = 82;
        break;
      case 'Trà Vinh':
        provinceCode = 84;
        break;
      case 'Vĩnh Long':
        provinceCode = 86;
        break;
      default:
        throw new Error('Province not found');
    }
    
    // Sử dụng API của Vietnam Administrative Units với mã tỉnh chính xác
    const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
    const data = await response.json();
    
    if (data && data.districts) {
      // Format districts data
      const districts = data.districts.map(district => ({
        id: district.code,
        name: district.name
      }));
      res.json(districts);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ error: "Error fetching districts" });
  }
});

// Get wards by district code
app.get("/wards/:districtCode", async (req, res) => {
  try {
    const districtCode = req.params.districtCode;
    const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
    const data = await response.json();
    
    if (data && data.wards) {
      // Format wards data
      const wards = data.wards.map(ward => ({
        id: ward.code,
        name: ward.name
      }));
      res.json(wards);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching wards:', error);
    res.status(500).json({ error: "Error fetching wards" });
  }
});

// Get districts by province from info table
app.get("/districts-by-province/:province", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT DISTINCT district FROM info WHERE province = $1 ORDER BY district",
      [req.params.province]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching districts:", error);
    res.status(500).json({ error: "Error fetching districts" });
  }
});

// Get store images
app.get("/store-images/:storeId", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT store_id, image_url, image_type 
       FROM store_images 
       WHERE store_id = $1 
       ORDER BY 
         CASE 
           WHEN image_type = 'tongquan' THEN 1
           WHEN image_type = 'mattien' THEN 2
           ELSE 3
         END`,
      [req.params.storeId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching store images:", error);
    res.status(500).json({ error: "Lỗi khi lấy hình ảnh cửa hàng" });
  }
});

// Update store image
app.post("/store-images/:storeId", async (req, res) => {
  const { image_url } = req.body;
  const { storeId } = req.params;

  try {
    const result = await db.query(
      `INSERT INTO store_images (store_id, image_url)
       VALUES ($1, $2)
       RETURNING *`,
      [storeId, image_url]
    );

    res.json({
      success: true,
      message: "Thêm hình ảnh thành công",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error adding store image:", error);
    res.status(500).json({ 
      success: false,
      error: "Lỗi khi thêm hình ảnh" 
    });
  }
});

// Delete store image
app.delete("/store-images/:storeId/:imageId", async (req, res) => {
  try {
    const result = await db.query(
      `DELETE FROM store_images 
       WHERE store_id = $1 AND id = $2
       RETURNING *`,
      [req.params.storeId, req.params.imageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "Không tìm thấy hình ảnh" 
      });
    }

    res.json({
      success: true,
      message: "Xóa hình ảnh thành công"
    });
  } catch (error) {
    console.error("Error deleting store image:", error);
    res.status(500).json({ 
      success: false,
      error: "Lỗi khi xóa hình ảnh" 
    });
  }
});

// STORE ASSETS ENDPOINTS

// Lấy thông tin tài sản của cửa hàng
app.get("/store-assets/:storeId", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM taisan WHERE store_id = $1 ORDER BY loaidoituong, mataisan`,
      [req.params.storeId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching store assets:", error);
    res.status(500).json({ error: "Lỗi khi lấy thông tin tài sản" });
  }
});

// API mới: Thêm cửa hàng vào sự kiện
app.post("/event-stores", async (req, res) => {
  const { store_id, eventid } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO store_events (store_id, eventid)
       VALUES ($1, $2)
       ON CONFLICT (store_id, eventid) DO NOTHING
       RETURNING *`,
      [store_id, eventid]
    );
    
    res.status(201).json({
      success: true,
      message: "Đã thêm cửa hàng vào sự kiện",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error adding store to event:", error);
    res.status(500).json({ 
      success: false,
      error: "Lỗi khi thêm cửa hàng vào sự kiện" 
    });
  }
});

// API mới: Xóa cửa hàng khỏi sự kiện
app.delete("/event-stores/:eventId/:storeId", async (req, res) => {
  try {
    const result = await db.query(
      `DELETE FROM store_events 
       WHERE eventid = $1 AND store_id = $2
       RETURNING *`,
      [req.params.eventId, req.params.storeId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy cửa hàng trong sự kiện này"
      });
    }
    
    res.json({
      success: true,
      message: "Đã xóa cửa hàng khỏi sự kiện"
    });
  } catch (error) {
    console.error("Error removing store from event:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi xóa cửa hàng khỏi sự kiện"
    });
  }
});

// Lấy danh sách sự kiện của một cửa hàng (Updated)
app.get("/store-events/:storeId", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        e.eventid,
        e.event_name,
        e.start_time,
        e.end_time,
        GREATEST(0, DATE_PART('day', e.end_time - NOW())) AS days_remaining,
        ses.status_type as status,
        ses.updated_at as status_updated_at
      FROM event e
      INNER JOIN store_events se ON e.eventid = se.eventid
      LEFT JOIN store_event_status ses ON se.store_id = ses.store_id 
        AND e.eventid = ses.eventid
      WHERE se.store_id = $1
      ORDER BY e.start_time DESC
    `, [req.params.storeId]);
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching store events:", error);
    res.status(500).json({ error: "Lỗi khi lấy danh sách sự kiện của cửa hàng" });
  }
});

// API cập nhật trạng thái của cửa hàng trong sự kiện
app.put("/store-event-status", async (req, res) => {
  const { store_id, eventid, status_type, updated_by } = req.body;
  
  try {
    const result = await db.query(`
      INSERT INTO store_event_status (store_id, eventid, status_type, updated_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (store_id, eventid) 
      DO UPDATE SET 
        status_type = $3,
        updated_by = $4,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [store_id, eventid, status_type, updated_by]);

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error updating store event status:", error);
    res.status(500).json({ 
      success: false,
      error: "Lỗi khi cập nhật trạng thái" 
    });
  }
});

// Optional: API endpoint để kiểm tra trạng thái ping
app.get('/ping-status', (req, res) => {
  res.json(serverPinger.getStatus());
});

// Upload hình ảnh kiểm tra cửa hàng
app.post("/store-audit-images/:storeId", async (req, res) => {
  const { image_url, image_type, location, event_id } = req.body;
  const { storeId } = req.params;

  try {
    // Xóa ảnh cũ cùng loại trong cùng sự kiện nếu có
    await db.query(
      `DELETE FROM store_audit_images 
       WHERE store_id = $1 AND event_id = $2 AND image_type = $3`,
      [storeId, event_id, image_type]
    );

    // Thêm ảnh mới
    const result = await db.query(
      `INSERT INTO store_audit_images 
         (store_id, event_id, image_url, image_type, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        storeId,
        event_id,
        image_url,
        image_type,
        location?.latitude || null,
        location?.longitude || null
      ]
    );

    res.status(201).json({
      success: true,
      message: "Upload ảnh thành công",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Error uploading store audit image:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi upload ảnh"
    });
  }
});

// Lấy hình ảnh kiểm tra của cửa hàng
app.get("/store-audit-images/:storeId/:eventId", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM store_audit_images 
       WHERE store_id = $1 AND event_id = $2
       ORDER BY 
         CASE 
           WHEN image_type = 'tongquan' THEN 1
           WHEN image_type = 'mattien' THEN 2
           ELSE 3
         END`,
      [req.params.storeId, req.params.eventId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching store audit images:", error);
    res.status(500).json({ error: "Lỗi khi lấy hình ảnh kiểm tra cửa hàng" });
  }
});

// Lấy danh sách loại ảnh theo event
app.get("/photo-types/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const result = await db.query(
      `SELECT * FROM photo_types 
       WHERE 'all' = ANY(event_ids) 
       OR $1 = ANY(event_ids)
       ORDER BY display_order ASC`,
      [eventId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching photo types:", error);
    res.status(500).json({ error: "Lỗi khi lấy thông tin loại ảnh" });
  }
});

// Get store status for event
app.get("/store-status/:storeId/:eventId", async (req, res) => {
  try {
    const { storeId, eventId } = req.params;
    
    const result = await db.query(
      `SELECT status_type 
       FROM store_event_status 
       WHERE store_id = $1 AND eventid = $2`,
      [storeId, eventId]
    );

    if (result.rows.length === 0) {
      // Kiểm tra xem cửa hàng có ảnh không
      const photoResult = await db.query(
        `SELECT COUNT(*) 
         FROM store_audit_images 
         WHERE store_id = $1 AND event_id = $2`,
        [storeId, eventId]
      );

      // Nếu có ảnh nhưng chưa có status, mặc định là "Đang chờ duyệt"
      if (parseInt(photoResult.rows[0].count) > 0) {
        return res.json({ status: "Đang chờ duyệt" });
      }
      
      return res.json({ status: null });
    }

    res.json({ status: result.rows[0].status_type });
  } catch (error) {
    console.error("Error fetching store status:", error);
    res.status(500).json({ error: "Failed to fetch store status" });
  }
});

// Update store status
app.put("/store-event-status", async (req, res) => {
  try {
    const { store_id, eventid, status_type } = req.body;

    const result = await db.query(
      `INSERT INTO store_event_status (store_id, eventid, status_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (store_id, eventid)
       DO UPDATE SET 
         status_type = $3,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [store_id, eventid, status_type]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating store status:", error);
    res.status(500).json({ error: "Failed to update store status" });
  }
});

// API lấy danh sách cửa hàng và sự kiện theo quyền
app.get("/stores-and-events", authenticateToken, async (req, res) => {
  try {
    let query = '';
    const params = [];

    switch (req.user.role_name) {
      case 'SR':
      case 'SO':
        query = `
          SELECT DISTINCT 
            i.*,
            e.eventid,
            e.event_name,
            e.start_time,
            e.end_time,
            GREATEST(0, DATE_PART('day', e.end_time - NOW())) AS days_remaining,
            ses.status_type
          FROM user_store us
          JOIN info i ON us.store_id = i.store_id
          LEFT JOIN store_events se ON i.store_id = se.store_id
          LEFT JOIN event e ON se.eventid = e.eventid
          LEFT JOIN store_event_status ses ON i.store_id = ses.store_id 
            AND e.eventid = ses.eventid
          WHERE us.username = $1
          ORDER BY i.store_id, e.start_time DESC
        `;
        params.push(req.user.username);
        break;

      case 'TSM':
        query = `
          SELECT DISTINCT 
            i.*,
            e.eventid,
            e.event_name,
            e.start_time,
            e.end_time,
            GREATEST(0, DATE_PART('day', e.end_time - NOW())) AS days_remaining,
            ses.status_type,
            us.username as assigned_to
          FROM user_hierarchy uh
          JOIN user_store us ON uh.user_id = us.username
          JOIN info i ON us.store_id = i.store_id
          LEFT JOIN store_events se ON i.store_id = se.store_id
          LEFT JOIN event e ON se.eventid = e.eventid
          LEFT JOIN store_event_status ses ON i.store_id = ses.store_id 
            AND e.eventid = ses.eventid
          WHERE uh.manager_id = $1
          ORDER BY us.username, i.store_id, e.start_time DESC
        `;
        params.push(req.user.username);
        break;

      case 'ASM':
        query = `
          SELECT DISTINCT 
            i.*,
            e.eventid,
            e.event_name,
            e.start_time,
            e.end_time,
            GREATEST(0, DATE_PART('day', e.end_time - NOW())) AS days_remaining,
            ses.status_type,
            us.username as assigned_to,
            uh1.manager_id as tsm_id
          FROM user_hierarchy uh2
          JOIN user_hierarchy uh1 ON uh2.user_id = uh1.manager_id
          JOIN user_store us ON uh1.user_id = us.username
          JOIN info i ON us.store_id = i.store_id
          LEFT JOIN store_events se ON i.store_id = se.store_id
          LEFT JOIN event e ON se.eventid = e.eventid
          LEFT JOIN store_event_status ses ON i.store_id = ses.store_id 
            AND e.eventid = ses.eventid
          WHERE uh2.manager_id = $1
          ORDER BY uh1.manager_id, us.username, i.store_id, e.start_time DESC
        `;
        params.push(req.user.username);
        break;

      default:
        return res.status(403).json({ error: 'Không có quyền truy cập' });
    }

    const result = await db.query(query, params);

    // Kiểm tra nếu không có dữ liệu cho SR hoặc SO
    if ((req.user.role_name === 'SR' || req.user.role_name === 'SO') && result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Bạn chưa có cửa hàng nào được đăng ký, vui lòng liên hệ MKT!'
      });
    }

    // Format dữ liệu trả về
    const formattedData = {};
    
    if (req.user.role_name === 'SR' || req.user.role_name === 'SO') {
      // Format cho SR và SO: Nhóm theo cửa hàng
      result.rows.forEach(row => {
        if (!formattedData[row.store_id]) {
          formattedData[row.store_id] = {
            store_info: {
              store_id: row.store_id,
              store_name: row.store_name,
              address: row.address
              // Thêm các thông tin cửa hàng khác nếu cần
            },
            events: []
          };
        }
        if (row.eventid) {
          formattedData[row.store_id].events.push({
            event_id: row.eventid,
            event_name: row.event_name,
            start_time: row.start_time,
            end_time: row.end_time,
            days_remaining: row.days_remaining,
            status: row.status_type
          });
        }
      });
    } else if (req.user.role_name === 'TSM') {
      // Format cho TSM: Nhóm theo nhân viên
      result.rows.forEach(row => {
        if (!formattedData[row.assigned_to]) {
          formattedData[row.assigned_to] = {
            stores: {}
          };
        }
        if (!formattedData[row.assigned_to].stores[row.store_id]) {
          formattedData[row.assigned_to].stores[row.store_id] = {
            store_info: {
              store_id: row.store_id,
              store_name: row.store_name,
              address: row.address
            },
            events: []
          };
        }
        if (row.eventid) {
          formattedData[row.assigned_to].stores[row.store_id].events.push({
            event_id: row.eventid,
            event_name: row.event_name,
            start_time: row.start_time,
            end_time: row.end_time,
            days_remaining: row.days_remaining,
            status: row.status_type
          });
        }
      });
    } else if (req.user.role_name === 'ASM') {
      // Format cho ASM: Nhóm theo TSM và nhân viên
      result.rows.forEach(row => {
        if (!formattedData[row.tsm_id]) {
          formattedData[row.tsm_id] = {
            sales_reps: {}
          };
        }
        if (!formattedData[row.tsm_id].sales_reps[row.assigned_to]) {
          formattedData[row.tsm_id].sales_reps[row.assigned_to] = {
            stores: {}
          };
        }
        if (!formattedData[row.tsm_id].sales_reps[row.assigned_to].stores[row.store_id]) {
          formattedData[row.tsm_id].sales_reps[row.assigned_to].stores[row.store_id] = {
            store_info: {
              store_id: row.store_id,
              store_name: row.store_name,
              address: row.address
            },
            events: []
          };
        }
        if (row.eventid) {
          formattedData[row.tsm_id].sales_reps[row.assigned_to].stores[row.store_id].events.push({
            event_id: row.eventid,
            event_name: row.event_name,
            start_time: row.start_time,
            end_time: row.end_time,
            days_remaining: row.days_remaining,
            status: row.status_type
          });
        }
      });
    }

    res.json({
      success: true,
      role: req.user.role_name,
      data: formattedData
    });

  } catch (error) {
    console.error('Error fetching stores and events:', error);
    res.status(500).json({ 
      success: false,
      error: 'Lỗi khi lấy danh sách cửa hàng và sự kiện' 
    });
  }
});

// Mobile Register API
app.post("/mobile/register", async (req, res) => {
  console.log('Received registration request:', req.body);

  const {
    phone,
    password,
    fullName,
    idCard,
    address
  } = req.body;

  // Validate required fields
  if (!phone || !password || !fullName || !idCard || !address) {
    console.log('Missing required fields:', { phone, password, fullName, idCard, address });
    return res.status(400).json({
      success: false,
      message: "Vui lòng điền đầy đủ thông tin bắt buộc"
    });
  }

  try {
    await db.query('BEGIN');

    // Check if phone exists
    const phoneExists = await db.query(
      'SELECT phone FROM users_register WHERE phone = $1',
      [phone]
    );

    if (phoneExists.rows.length > 0) {
      throw new Error("Phone number already exists");
    }

    // Check if id_card exists
    const idCardExists = await db.query(
      'SELECT id_card FROM users_register WHERE id_card = $1',
      [idCard]
    );

    if (idCardExists.rows.length > 0) {
      throw new Error("ID card already exists");
    }

    console.log('Inserting user into database with data:', {
      phone,
      fullName,
      idCard,
      address
    });

    // Insert into users_register
    const registerResult = await db.query(
      `INSERT INTO users_register (
        phone, 
        password, 
        full_name,
        id_card, 
        province,
        district,
        ward,
        street,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id`,
      [
        phone,
        password,
        fullName,
        idCard,
        address.province,
        address.district,
        address.ward,
        address.street
      ]
    );

    const userId = registerResult.rows[0].id;

    console.log('User registered successfully with ID:', userId);

    // Insert into users_login
    await db.query(
      `INSERT INTO users_login (
        user_id,
        phone,
        password,
        created_at
      ) VALUES ($1, $2, $3, NOW())`,
      [userId, phone, password]
    );

    await db.query('COMMIT');

    console.log('Registration completed successfully');

    res.json({
      success: true,
      message: "Đăng ký tài khoản thành công"
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Mobile registration error:", error);
    
    if (error.message === "Phone number already exists") {
      res.status(400).json({
        success: false,
        message: "Số điện thoại đã được đăng ký"
      });
    } else if (error.message === "ID card already exists") {
      res.status(400).json({
        success: false,
        message: "Số CCCD đã được đăng ký"
      });
    } else {
      console.error('Detailed error:', error);
      res.status(500).json({
        success: false,
        message: "Đăng ký thất bại, vui lòng thử lại sau",
        error: error.message
      });
    }
  }
});

// Mobile Login API
app.post("/mobile/login", async (req, res) => {
  const { phone, password } = req.body;

  try {
    // Check login credentials
    const userResult = await db.query(
      `SELECT ul.*, ur.full_name, ur.id_card, ur.province, ur.district, ur.ward, ur.street
       FROM users_login ul
       JOIN users_register ur ON ul.user_id = ur.id 
       WHERE ul.phone = $1 AND ul.password = $2`,
      [phone, password]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Số điện thoại hoặc mật khẩu không đúng"
      });
    }

    const user = userResult.rows[0];

    // Generate JWT token - Sửa lại cấu trúc token
    const token = jwt.sign(
      { 
        userId: user.user_id,
        phone: user.phone
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
    await db.query(
      'UPDATE users_login SET last_login = NOW() WHERE user_id = $1',
      [user.user_id]
    );

    res.json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        token,
        user: {
          id: user.user_id,
          phone: user.phone,
          fullName: user.full_name,
          idCard: user.id_card,
          address: {
            province: user.province,
            district: user.district, 
            ward: user.ward,
            street: user.street
          }
        }
      }
    });

  } catch (error) {
    console.error("Mobile login error:", error);
    res.status(500).json({
      success: false,
      message: "Đăng nhập thất bại, vui lòng thử lại sau"
    });
  }
});

// Mobile Forgot Password API
app.post("/mobile/forgot-password", async (req, res) => {
  const { phone, newPassword, idCard } = req.body;

  try {
    await db.query('BEGIN');

    // Kiểm tra số điện thoại và CCCD có khớp không
    const userExists = await db.query(
      'SELECT id FROM users_register WHERE phone = $1 AND id_card = $2',
      [phone, idCard]
    );

    if (userExists.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Số điện thoại hoặc CCCD không chính xác"
      });
    }

    const userId = userExists.rows[0].id;

    // Cập nhật mật khẩu trong cả hai bảng
    await db.query(
      'UPDATE users_register SET password = $1 WHERE id = $2',
      [newPassword, userId]
    );

    await db.query(
      'UPDATE users_login SET password = $1 WHERE user_id = $2',
      [newPassword, userId]
    );

    // Ghi log vào bảng user_forgot
    await db.query(
      `INSERT INTO user_forgot (
        user_id, phone, reset_token, created_at
      ) VALUES ($1, $2, $3, NOW())`,
      [userId, phone, 'mobile_reset']
    );

    await db.query('COMMIT');

    res.json({
      success: true,
      message: "Khôi phục mật khẩu thành công"
    });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error("Mobile forgot password error:", error);
    
    res.status(500).json({
      success: false,
      message: "Khôi phục mật khẩu thất bại, vui lòng thử lại sau"
    });
  }
});

// Cấu hình multer để xử lý upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/avatars';
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file duy nhất với timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
  },
  fileFilter: (req, file, cb) => {
    // Chỉ cho phép upload ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép upload file ảnh'), false);
    }
  }
});

// API endpoint để update avatar
app.post("/mobile/update-avatar", authenticateToken, upload.single('avatar'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Không tìm thấy file ảnh"
    });
  }

  try {
    const userId = req.user.id;
    const avatarUrl = `https://ten-p521.onrender.com/uploads/avatars/${req.file.filename}`;

    // Xóa avatar cũ nếu có
    const oldAvatarResult = await db.query(
      'SELECT avatar_url FROM users_register WHERE id = $1',
      [userId]
    );

    if (oldAvatarResult.rows[0]?.avatar_url) {
      const oldAvatarPath = oldAvatarResult.rows[0].avatar_url.replace('https://ten-p521.onrender.com/', '');
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Cập nhật đường dẫn avatar mới trong database
    await db.query(
      'UPDATE users_register SET avatar_url = $1 WHERE id = $2',
      [avatarUrl, userId]
    );

    res.json({
      success: true,
      message: "Cập nhật avatar thành công",
      data: {
        avatarUrl
      }
    });

  } catch (error) {
    console.error('Error updating avatar:', error);
    // Xóa file đã upload nếu có lỗi
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật avatar. Vui lòng thử lại sau."
    });
  }
});

// Serve static files
app.use('/uploads', express.static('uploads'));

// API endpoint để lấy thông tin user
app.get("/mobile/user-info", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT id, phone, full_name, avatar_url 
       FROM users_register 
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User không tồn tại"
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin người dùng"
    });
  }
});

// API endpoint để cập nhật thông tin profile
app.post("/mobile/update-profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      full_name,
      id_card,
      province,
      district,
      ward,
      street,
      tax_code,
      business_license
    } = req.body;

    // Validate dữ liệu bắt buộc
    if (!full_name) {
      return res.status(400).json({
        success: false,
        message: "Họ tên không được để trống"
      });
    }

    // Lấy tên địa chỉ từ API provinces
    let provinceName = '', districtName = '', wardName = '';
    
    try {
      if (province) {
        const provinceResponse = await axios.get(`https://provinces.open-api.vn/api/p/${province}`);
        provinceName = provinceResponse.data.name;
      }
      
      if (district) {
        const districtResponse = await axios.get(`https://provinces.open-api.vn/api/d/${district}`);
        districtName = districtResponse.data.name;
      }
      
      if (ward) {
        const wardResponse = await axios.get(`https://provinces.open-api.vn/api/w/${ward}`);
        wardName = wardResponse.data.name;
      }
    } catch (error) {
      console.error('Error fetching address details:', error);
    }

    // Cập nhật thông tin trong database - Bỏ updated_at khỏi SET clause
    const updateResult = await db.query(
      `UPDATE users_register 
       SET full_name = $1,
           id_card = $2,
           province = $3,
           province_code = $4,
           district = $5,
           district_code = $6,
           ward = $7,
           ward_code = $8,
           street = $9,
           tax_code = $10,
           business_license = $11
       WHERE id = $12
       RETURNING id, full_name, phone, id_card, 
                 province, province_code,
                 district, district_code,
                 ward, ward_code,
                 street, tax_code, business_license, avatar_url`,
      [
        full_name,
        id_card,
        provinceName,
        province,
        districtName,
        district,
        wardName,
        ward,
        street,
        tax_code,
        business_license,
        userId
      ]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng"
      });
    }

    // Format lại dữ liệu trả về
    const updatedUser = updateResult.rows[0];
    
    res.json({
      success: true,
      message: "Cập nhật thông tin thành công",
      data: {
        id: updatedUser.id,
        full_name: updatedUser.full_name,
        phone: updatedUser.phone,
        id_card: updatedUser.id_card,
        province: updatedUser.province,
        province_code: updatedUser.province_code,
        district: updatedUser.district,
        district_code: updatedUser.district_code,
        ward: updatedUser.ward,
        ward_code: updatedUser.ward_code,
        street: updatedUser.street,
        tax_code: updatedUser.tax_code,
        business_license: updatedUser.business_license,
        avatar_url: updatedUser.avatar_url
      }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật thông tin. Vui lòng thử lại sau."
    });
  }
});

// Thêm migration để cập nhật cấu trúc bảng users_register
const updateTableQuery = `
ALTER TABLE users_register
ADD COLUMN IF NOT EXISTS province_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS district_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS ward_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS tax_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS business_license VARCHAR(50),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
`;

// Thực thi migration
db.query(updateTableQuery)
  .then(() => {
    console.log('Updated users_register table structure successfully');
  })
  .catch(error => {
    console.error('Error updating table structure:', error);
  });

