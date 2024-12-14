//Dependecies
require("dotenv").config();
const express = require("express");
const app = express();
const Client = require("pg").Client;
const cors = require("cors");
app.use(express.json());
const cron = require("node-cron"); // Import the cron library

// Setting crors
const corsOptions = {
  origin: ["https://windowaudit-demo.netlify.app", "http://localhost:5173"], // Allow only requests from this origin
  methods: "GET,POST", // Allow only these methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allow only these headers
};
app.use(cors(corsOptions));

// Let run server
const port = process.env.SERVER_PORT || 3002;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Create config database
const dbConfig = {
  connectionString: process.env.POSTGRES_URL + "?sslmode=require",
};

// Create a new PostgreSQL client
const db = new Client(dbConfig);

// Connet database
db.connect().then(() => {
  console.log("Connected to PostgreSQL database");
});

// Rate login
const rateLimit = require("express-rate-limit");
const { connectionString } = require("pg/lib/defaults");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 10 login requests per windowMs
  message: { error: "Hệ thống quá tải, hãy thử lại sau ít phút" },
});

// Add login endpoint
app.post("/login", loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  try {
    // Query the user by username
    const result = await db.query(
      "SELECT * FROM users WHERE username = $1 and password = $2",
      [username, password]
    );

    if (result.rows.length === 0) {
      return res
        .status(401)
        .send({ message: "Tài khoản hoặc mật khẩu không đúng" });
    }

    const user = result.rows[0];
    console.log("User found:", user);

    // Update the last_login column
    await db.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
      user.id,
    ]);

    // Successful login
    res.send({ success: true });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send({ error: "Lỗi hệ thống" });
  }
});

// Cron Job: Runs every 5 minutes to check the database health
cron.schedule("*/1 * * * *", async () => {
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
