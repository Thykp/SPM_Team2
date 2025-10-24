
const axios = require("axios")

async function sendDeadlineOrAddedEmail() {
  try {
    const response = await axios.post(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        service_id: "service_3mkfu08",
        template_id: "template_4r9p5n2",
        user_id: "RdP-enZ2jU7ops5sy",
        template_params: {
        email:"utkarshtayal90@gmail.com",
          tasks: [
    {
      "title": "Prepare report",
      "deadline": "2025-10-17"
    },
    {
      "title": "Review budget",
      "deadline": "2025-10-20"
    },
    {
      "title": "Team meeting",
      "deadline": "2025-10-22"
    }
  ],
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log("Email sent!", response.data);
  } catch (err) {
    console.error("Failed to send email:", err.response?.data || err.message);
  }
}

sendDeadlineOrAddedEmail()