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
    origin: [
      "https://windowaudit-demo.netlify.app",
      "https://ten-p521.onrender.com",
      "http://localhost:5173",
    ],
    credentials: true,
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
      message: "Username và password là bắt buộc",
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
        message: "Tài khoản hoặc mật khẩu không đúng",
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
    await db.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
      user.id,
    ]);

    // Tạo và gửi token response
    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      mustChangePassword: false,
      token: "your-token-here", // Thêm token nếu bạn đang sử dụng
      username: user.username,
    });
  } catch (error) {
    console.error("Detailed login error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
    const result = await db.query(
      `
      INSERT INTO status (store_id, status_type, note)
      VALUES ($1, $2, $3)
      ON CONFLICT (store_id) 
      DO UPDATE SET 
        status_type = $2,
        note = $3,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `,
      [store_id, status_type, note]
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Failed to update status." });
  }
});

// Get event details
app.get("/events/:eventId", async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT 
        eventid, 
        event_name, 
        start_time, 
        end_time,
        GREATEST(0, DATE_PART('day', end_time - NOW())) AS days_remaining
      FROM event
      WHERE eventid = $1
    `,
      [req.params.eventId]
    );

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
    const result = await db.query(
      `
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
    `,
      [req.params.eventId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching event stores:", error);
    res.status(500).json({ error: "Failed to fetch event stores" });
  }
});

// Get store info by ID
app.get("/store-info/:id", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM info WHERE store_id = $1", [
      req.params.id,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy thông tin cửa hàng" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// Update store info
app.put("/store-info/:id", async (req, res) => {
  const { address, mobilephone, store_rank, province, district, ward } =
    req.body;
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
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cập nhật thất bại" });
    }

    res.json({
      success: true,
      message: "Cập nhật thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating store info:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi cập nhật thông tin",
      details: error.message,
    });
  }
});

// Get districts by province name
app.get("/districts/:provinceName", async (req, res) => {
  try {
    const provinceName = decodeURIComponent(req.params.provinceName);

    // Mapping tên tỉnh sang mã tỉnh
    let provinceCode;
    switch (provinceName) {
      // HCM Region
      case "Thành phố Hồ Chí Minh":
        provinceCode = 79;
        break;
      case "Bình Dương":
        provinceCode = 74;
        break;
      case "Đồng Nai":
        provinceCode = 75;
        break;

      // CE Region
      case "Thành phố Đà Nẵng":
        provinceCode = 48;
        break;
      case "Bình Định":
        provinceCode = 52;
        break;
      case "Gia Lai":
        provinceCode = 64;
        break;
      case "Kon Tum":
        provinceCode = 62;
        break;
      case "Phú Yên":
        provinceCode = 54;
        break;
      case "Quảng Bình":
        provinceCode = 44;
        break;
      case "Quảng Nam":
        provinceCode = 49;
        break;
      case "Quảng Ngãi":
        provinceCode = 51;
        break;
      case "Quảng Trị":
        provinceCode = 45;
        break;
      case "Thừa Thiên Huế":
        provinceCode = 46;
        break;

      // MKD Region
      case "Thành phố Cần Thơ":
        provinceCode = 92;
        break;
      case "An Giang":
        provinceCode = 89;
        break;
      case "Bạc Liêu":
        provinceCode = 95;
        break;
      case "Bến Tre":
        provinceCode = 83;
        break;
      case "Cà Mau":
        provinceCode = 96;
        break;
      case "Đồng Tháp":
        provinceCode = 87;
        break;
      case "Hậu Giang":
        provinceCode = 93;
        break;
      case "Kiên Giang":
        provinceCode = 91;
        break;
      case "Long An":
        provinceCode = 80;
        break;
      case "Sóc Trăng":
        provinceCode = 94;
        break;
      case "Tiền Giang":
        provinceCode = 82;
        break;
      case "Trà Vinh":
        provinceCode = 84;
        break;
      case "Vĩnh Long":
        provinceCode = 86;
        break;
      default:
        throw new Error("Province not found");
    }

    // Sử dụng API của Vietnam Administrative Units với mã tỉnh chính xác
    const response = await fetch(
      `https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`
    );
    const data = await response.json();

    if (data && data.districts) {
      // Format districts data
      const districts = data.districts.map((district) => ({
        id: district.code,
        name: district.name,
      }));
      res.json(districts);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("Error fetching districts:", error);
    res.status(500).json({ error: "Error fetching districts" });
  }
});

// Get wards by district code
app.get("/wards/:districtCode", async (req, res) => {
  try {
    const districtCode = req.params.districtCode;
    const response = await fetch(
      `https://provinces.open-api.vn/api/d/${districtCode}?depth=2`
    );
    const data = await response.json();

    if (data && data.wards) {
      // Format wards data
      const wards = data.wards.map((ward) => ({
        id: ward.code,
        name: ward.name,
      }));
      res.json(wards);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("Error fetching wards:", error);
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
           WHEN image_type = 'overview' THEN 1
           WHEN image_type = 'frontage' THEN 2
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
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding store image:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi thêm hình ảnh",
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
        error: "Không tìm thấy hình ảnh",
      });
    }

    res.json({
      success: true,
      message: "Xóa hình ảnh thành công",
    });
  } catch (error) {
    console.error("Error deleting store image:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi xóa hình ảnh",
    });
  }
});
