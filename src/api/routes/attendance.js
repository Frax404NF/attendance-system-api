const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.post('/checkin', authenticate, attendanceController.checkIn);
router.post('/checkout', authenticate, attendanceController.checkOut);
router.get('/current', authenticate, attendanceController.getCurrentEmployees);
router.get('/reports', authenticate, attendanceController.getReports);

module.exports = router;