//Dependecies
require("dotenv").config();
const express = require("express");
const app = express();
const Client = require("pg").Client;
const cors = require("cors");
app.use(express.json());
const https = require("https");
const serverPinger = require('./utils/cronJobs');

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

// Get asset by barcode
app.get("/asset/:code", async (req, res) => {
  try {
    const { code } = req.params;
    
    const result = await db.query(
      `SELECT * FROM taisan WHERE mataisan = $1`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy tài sản" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching asset:", error);
    res.status(500).json({ error: "Failed to fetch asset information" });
  }
});

// Add asset to store
app.post("/store-assets/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const { asset_id, event_id } = req.body;
    
    await db.query(
      `INSERT INTO store_assets (store_id, asset_id, event_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (store_id, asset_id) 
       DO UPDATE SET event_id = $3`,
      [storeId, asset_id, event_id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error adding asset to store:", error);
    res.status(500).json({ error: "Failed to add asset to store" });
  }
});

