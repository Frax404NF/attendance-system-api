const { client } = require("../config/redis");
const { pool } = require("../config/database");
const Queue = require("bull");

class AttendanceService {
  constructor() {
    this.emailQueue = new Queue("email notifications", {
      redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD || undefined,
      },
    });
  }

  getTodayDate() {
    return new Date().toISOString().split("T")[0];
  }

  isLate(checkInTime) {
    const workStartTime = process.env.WORK_START_TIME || "09:00";
    const [startHour, startMinute] = workStartTime.split(":").map(Number);

    const checkIn = new Date(checkInTime);
    const startTime = new Date(checkIn);
    startTime.setHours(startHour, startMinute, 0, 0);

    return checkIn > startTime;
  }

  calculateMinutesLate(checkInTime) {
    const workStartTime = process.env.WORK_START_TIME || "09:00";
    const startTimeString = checkInTime.toDateString() + " " + workStartTime;
    const startTime = new Date(startTimeString);

    return Math.floor((checkInTime - startTime) / (1000 * 60));
  }

  async hasCheckedInToday(userId, date) {
    const cacheKey = `checkin:${userId}:${date}`;
    const existingCheckin = await client.get(cacheKey);
    return !!existingCheckin;
  }

  async recordCheckIn(userId, date, checkInTime) {
    await pool.execute(
      "INSERT INTO attendance (employee_id, date, check_in_time) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE check_in_time = VALUES(check_in_time)",
      [userId, date, checkInTime]
    );

    const cacheKey = `checkin:${userId}:${date}`;
    await client.setEx(cacheKey, 86400, checkInTime.toISOString());

    await client.sAdd("employees_in_office", userId.toString());
  }

  async recordCheckOut(userId, date, checkOutTime) {
    const [result] = await pool.execute(
      "UPDATE attendance SET check_out_time = ? WHERE employee_id = ? AND date = ?",
      [checkOutTime, userId, date]
    );

    if (result.affectedRows === 0) {
      throw new Error("No check-in record found for today");
    }

    console.log(`Removing user ${userId} from Redis set...`);
    const removed = await client.sRem("employees_in_office", userId.toString());
    console.log(`Redis removal result: ${removed} (should be 1 if successful)`);
  }

  async queueLateNotification(
    employeeId,
    employeeName,
    checkInTime,
    minutesLate
  ) {
    await this.emailQueue.add("late-notification", {
      employeeId,
      employeeName,
      checkInTime: checkInTime.toISOString(),
      minutesLate,
    });
  }

  async getCurrentEmployeesInOffice() {
    const employeeIds = await client.sMembers("employees_in_office");

    if (employeeIds.length === 0) {
      return [];
    }

    const placeholders = employeeIds.map(() => "?").join(",");
    const [rows] = await pool.execute(
      `SELECT id, name, department FROM employees WHERE id IN (${placeholders})`,
      employeeIds
    );

    return rows;
  }

  async getAttendanceReport(startDate, endDate) {
    const cacheKey = `report:${startDate}:${endDate}`;
    const cachedReport = await client.get(cacheKey);

    if (cachedReport) {
      return JSON.parse(cachedReport);
    }

    const [rows] = await pool.execute(
      `SELECT
                e.id, e.name, e.department,
                a.date, a.check_in_time, a.check_out_time
            FROM employees e
            LEFT JOIN attendance a ON e.id = a.employee_id
                AND DATE(a.date) BETWEEN DATE(?) AND DATE(?)
            ORDER BY e.name, a.date`,
      [startDate, endDate]
    );

    const report = {
      startDate,
      endDate,
      records: rows,
    };

    await client.setEx(cacheKey, 3600, JSON.stringify(report));
    return report;
  }

  async checkIn(userId, userName) {
    const today = this.getTodayDate();
    const checkInTime = new Date();

    if (await this.hasCheckedInToday(userId, today)) {
      throw new Error("Already checked in today");
    }

    await this.recordCheckIn(userId, today, checkInTime);

    const late = this.isLate(checkInTime);
    if (late) {
      const minutesLate = this.calculateMinutesLate(checkInTime);
      await this.queueLateNotification(
        userId,
        userName,
        checkInTime,
        minutesLate
      );
    }

    return {
      message: "Checked in successfully",
      checkInTime: checkInTime.toISOString(),
      isLate: late,
    };
  }

  async checkOut(userId) {
    const today = this.getTodayDate();
    const checkOutTime = new Date();

    await this.recordCheckOut(userId, today, checkOutTime);

    return {
      message: "Checked out successfully",
      checkOutTime: checkOutTime.toISOString(),
    };
  }
}

module.exports = new AttendanceService();
