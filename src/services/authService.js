
const { client } = require("../config/redis");
const { pool } = require("../config/database");
const crypto = require("crypto");

class AuthService {
  generateToken(userId) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString("hex");
    return `token_${timestamp}_${userId}_${random}`;
  }

  async findEmployeeByEmail(email) {
    const [rows] = await pool.execute(
      "SELECT id, name, email, department FROM employees WHERE email = ?",
      [email]
    );
    return rows[0] || null;
  }

  async createSession(user) {
    const token = this.generateToken(user.id);
    const sessionExpiry = parseInt(process.env.SESSION_EXPIRY) || 28800;

    await client.setEx(`session:${token}`, sessionExpiry, JSON.stringify(user));

    return token;
  }

  async getSession(token) {
    const sessionData = await client.get(`session:${token}`);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  async destroySession(token) {
    await client.del(`session:${token}`);
  }

  async login(email) {
    if (!email) {
      throw new Error("Email is required");
    }

    const user = await this.findEmployeeByEmail(email);
    if (!user) {
      throw new Error("Employee not found");
    }

    const token = await this.createSession(user);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
      },
    };
  }

  async logout(token) {
    if (token) {
      await this.destroySession(token);
    }
    return { message: "Logged out successfully" };
  }
}

module.exports = new AuthService();
