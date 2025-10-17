const axios = require("axios");

async function sendEmail(userEmail, notificationText) {
  try {
    const response = await axios.post("https://api.emailjs.com/api/v1.0/email/send", {
      service_id: "service_3mkfu08",
      template_id: "template_2ks6jo9",
      user_id: "RdP-enZ2jU7ops5sy",
      template_params: {
        user_name: userEmail,
        notification_text: notificationText,
      },
    }, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Email sent!", response.data);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

sendEmail("kendrickp.2023@smu.edu.sg", "hi")
sendEmail("yf.leong.2023@smu.edu.sg", "hi")
sendEmail("gerald.chee.2023@smu.edu.sg", "hi")
