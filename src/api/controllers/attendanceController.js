const attendanceService = require("../../services/attendanceService");

class AttendanceController {
  async checkIn(req, res) {
    try {
      const userId = req.user.id;
      const userName = req.user.name;

      const result = await attendanceService.checkIn(userId, userName);
      res.json(result);
    } catch (error) {
      console.error("Check-in error:", error);

      if (error.message === "Already checked in today") {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: "Check-in failed" });
    }
  }

  async checkOut(req, res) {
    try {
      const userId = req.user.id;

      const result = await attendanceService.checkOut(userId);
      res.json(result);
    } catch (error) {
      console.error("Check-out error:", error);

      if (error.message === "No check-in record found for today") {
        return res.status(400).json({ error: error.message });
      }

      res.status(500).json({ error: "Check-out failed" });
    }
  }

  async getCurrentEmployees(req, res) {
    try {
      const employeesInOffice =
        await attendanceService.getCurrentEmployeesInOffice();
      res.json({ employeesInOffice });
    } catch (error) {
      console.error("Current employees error:", error);
      res.status(500).json({ error: "Failed to get current employees" });
    }
  }

  async getReports(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ error: "Start date and end date are required" });
      }

      const report = await attendanceService.getAttendanceReport(
        startDate,
        endDate
      );
      res.json(report);
    } catch (error) {
      console.error("Reports error:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  }
}

module.exports = new AttendanceController();

