const cron = require('node-cron');

const RENDER_SERVER_URL = 'https://ten-p521.onrender.com';

class ServerPinger {
  constructor() {
    this.lastPingTime = null;
    this.pingCount = 0;
  }

  async ping() {
    try {
      const startTime = Date.now();
      const response = await fetch(RENDER_SERVER_URL);
      const endTime = Date.now();
      
      if (response.ok) {
        this.lastPingTime = new Date();
        this.pingCount++;
        
        console.log(`Server ping successful:
          Time: ${this.lastPingTime.toLocaleString()}
          Response time: ${endTime - startTime}ms
          Total pings: ${this.pingCount}
        `);
      } else {
        console.warn(`Server ping failed:
          Status: ${response.status}
          Time: ${new Date().toLocaleString()}
        `);
      }
    } catch (error) {
      console.error(`Server ping error:
        Message: ${error.message}
        Time: ${new Date().toLocaleString()}
      `);
    }
  }

  start() {
    // Ping mỗi 5 phút
    cron.schedule('*/5 * * * *', () => {
      this.ping();
    });

    // Ping ngay khi khởi động
    this.ping();
    
    console.log('Server pinger started successfully');
  }

  getStatus() {
    return {
      lastPingTime: this.lastPingTime,
      pingCount: this.pingCount,
      isActive: true
    };
  }
}

module.exports = new ServerPinger();