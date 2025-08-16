const Queue = require("bull");
require("dotenv").config();

const emailQueue = new Queue("email notifications", {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD || undefined,
  },
});

// Process late notification emails
emailQueue.process("late-notification", async (job) => {
  const { employeeId, employeeName, checkInTime, minutesLate } = job.data;

  console.log(
    `Processing late notification for ${employeeName} (${minutesLate} minutes late)`
  );

  // In a real application, you would send an actual email here
  // For now, we'll just log it
  console.log(
    `EMAIL SENT: ${employeeName} was ${minutesLate} minutes late at ${checkInTime}`
  );

  return { sent: true, employee: employeeName };
});

// Error handling
emailQueue.on("error", (error) => {
  console.error("Email queue error:", error);
});

emailQueue.on("waiting", (jobId) => {
  console.log(`Email job ${jobId} is waiting`);
});

emailQueue.on("active", (job, jobPromise) => {
  console.log(`Email job ${job.id} started`);
});

emailQueue.on("completed", (job, result) => {
  console.log(`Email job ${job.id} completed`, result);
});

emailQueue.on("failed", (job, err) => {
  console.error(`Email job ${job.id} failed`, err);
});

console.log("Email worker is running...");
console.log("Press CTRL+C to stop");

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down email worker...");
  await emailQueue.close();
  process.exit(0);
});
