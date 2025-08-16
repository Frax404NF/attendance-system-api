const authService = require("../../services/authService");

class AuthController {
  async login(req, res) {
    try {
      const { email } = req.body;
      const result = await authService.login(email);
      res.json(result);
    } catch (error) {
      console.error("Login error:", error);

      if (error.message === "Email is required") {
        return res.status(400).json({ error: error.message });
      }

      if (error.message === "Employee not found") {
        return res.status(404).json({ error: error.message });
      }

      res.status(500).json({ error: "Internal server error" });
    }
  }

  async logout(req, res) {
    try {
      const token = req.headers.authorization;
      const result = await authService.logout(token);
      res.json(result);
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new AuthController();