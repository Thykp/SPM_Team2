//preprocess email before this

const axios = require("axios")
// emailPayload 
//   type: "deadline_reminder",
//   resource_type: "task",
//   resource_id: "0a4ac2d0-b9d9-460a-98e1-99fa479cf567",
//   user_id: "cea4cf27-bf34-4991-b571-e7f35f7e27d8",
//   username: "Utkarsh",
//   day: 7,
//   notify_at: "2025-10-18T18:00:00.000Z", // calculated notify date based on deadline - reminderDays
//   key: "0a4ac2d0-b9d9-460a-98e1-99fa479cf567:cea4cf27-bf34-4991-b571-e7f35f7e27d8:7",
//   push: true,   // in-app enabled
//   email: "utkarshtayal90@gmail.com", 
//   task: {
//     id: "0a4ac2d0-b9d9-460a-98e1-99fa479cf567",
//     title: "test",
//     description: "task test",
//     deadline: "2025-10-22T17:35:15.042+00:00",
//     project_id: "cfcf9fd7-5749-4e09-aa59-4d3290214c74",
//     priority: 7
//   }
  
async function sendDeadlineOrAddedEmail(emailPayload) {
  try {
    const response = await axios.post(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_RESOURCE_TEMPLATE,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: {
          payload: emailPayload,
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log("Email sent!", response.data);
  } catch (err) {
    console.error("[Email] Failed to send Deadline/Added email:", err.response?.data || err.message);
  }
}

async function sendUpdates(emailPayload){
try {
    const response = await axios.post(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_UPDATE_TEMPLATE,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: {
          payload: emailPayload,
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log("Email sent!", response.data);
  } catch (err) {
    console.error("[Email] Failed to send Updates email:", err.response?.data || err.message);
  }
}

module.exports = {
  sendDeadlineOrAddedEmail,
  sendUpdates
}