const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

const SCHEDULE_SET = 'notifications_schedule';

// Schedule notification 10 seconds from now
const notification = {
  notif_text: "Test scheduled message",
  notif_type: "info",
  from_user: "5a10c7c2-7a06-4f2a-9ce4-2948e1fce384",
  to_user: "5a10c7c2-7a06-4f2a-9ce4-2948e1fce384",
  resource_type: "task",
  resource_id: "e9cd9203-e8d2-42fa-a081-b2db6bc443a5",
  project_id: "e9cd9203-e8d2-42fa-a081-b2db6bc443a5",
  priority: "normal",
  delivery_channels: ["in_app"],
  read: false
};

const fireTime = Date.now() + 10000; // 10 seconds from now

redis.zadd(SCHEDULE_SET, fireTime, JSON.stringify(notification))
  .then(() => {
    console.log('Scheduled notification for 10 seconds from now!');
    redis.quit();
  })
  .catch(err => {
    console.error('Error scheduling:', err);
    redis.quit();
  });