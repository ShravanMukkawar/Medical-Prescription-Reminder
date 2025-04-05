const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const dotenv = require("dotenv");
const cors = require("cors");
const twilio = require("twilio");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Twilio Setup
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_PHONE = process.env.TWILIO_PHONE;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("MongoDB connection success👌");
}).catch((err) => {
  console.error("MongoDB connection failed ❌", err);
});

// Medication Schema
const medicationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  phone: { type: String, required: true },
  medicine: { type: String, required: true },
  dosage: { type: String, required: true },
  timing: [{ type: String }], // ['Morning', 'Night']
  duration: { type: String },
  total: { type: String },
  instructions: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Medication = mongoose.model("Medication", medicationSchema);

// Email Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Save Medications Route
app.post("/medications", async (req, res) => {
  try {
    const { email, phone, medications } = req.body;

    if (!email || !phone || !Array.isArray(medications)) {
      return res.status(400).json({ error: "Invalid request." });
    }

    const medsToInsert = medications
      .filter(med => med.medicine && med.dosage && med.timing)
      .map(med => ({
        email,
        phone,
        medicine: med.medicine,
        dosage: med.dosage,
        timing: med.timing,
        duration: med.duration || "",
        total: med.total || "",
        instructions: med.instructions || "",
      }));

    if (medsToInsert.length === 0) {
      return res.status(400).json({ error: "No valid medications provided." });
    }

    await Medication.insertMany(medsToInsert);
    res.status(200).json({ message: "Medications saved." });
  } catch (err) {
    console.error("[Save Medications Error]", err);
    res.status(500).json({ error: "Failed to save medications." });
  }
});

// Twilio Voice Call Function
function sendVoiceCallReminder(phone, message) {
  twilioClient.calls
    .create({
      twiml: `<Response><Say>${message}</Say></Response>`,
      to: phone,
      from: TWILIO_PHONE,
    })
    .then(call => console.log(`📞 Call initiated: ${call.sid} to ${phone}`))
    .catch(err => console.error("❌ Twilio Call Error:", err));
}

// Reminder Function
function sendRemindersForTime(timing) {
  Medication.find({ timing: timing }).then(async (meds) => {
    const groupedByUser = {};

    meds.forEach(med => {
      const key = med.email + "|" + med.phone;
      if (!groupedByUser[key]) groupedByUser[key] = [];
      groupedByUser[key].push(med);
    });

    for (const [key, meds] of Object.entries(groupedByUser)) {
      const [email, phone] = key.split("|");
      const plainText = meds.map(m => `• ${m.medicine} (${m.dosage})`).join('\n');
      const voiceMessage = `Hello! This is your ${timing} medication reminder. ` +
      meds.map(m => `Please take ${m.dosage} of ${m.medicine}. ${m.instructions ? `Instructions: ${m.instructions}.` : ''}`).join(" ");
    
// Email Reminder with enhanced professional design
const mailOptions = {
  from: `"MediCheck Reminder" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: `⏰ MediCheck: Your ${timing} Medication Reminder`,
  text: `MEDICATION REMINDER - ${timing.toUpperCase()}\n\nPlease take the following medication(s):\n\n${plainText}\n\nContact: ${phone}\n\nThis is an automated reminder from MediCheck. Do not reply to this email.`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MediCheck Reminder</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #1e88e5;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #ffffff;
          padding: 30px;
          border-left: 1px solid #e0e0e0;
          border-right: 1px solid #e0e0e0;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #757575;
          border-radius: 0 0 8px 8px;
          border: 1px solid #e0e0e0;
          border-top: none;
        }
        h1 {
          color: white;
          margin: 0;
          font-size: 24px;
        }
        h2 {
          color: #1e88e5;
          font-size: 20px;
          margin-top: 0;
        }
        .med-list {
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #e0e0e0;
        }
        .med-item {
          padding: 15px;
          background-color: #f9f9f9;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          align-items: center;
        }
        .med-item:last-child {
          border-bottom: none;
        }
        .med-icon {
          background-color: #e3f2fd;
          color: #1e88e5;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          font-weight: bold;
        }
        .med-details {
          flex: 1;
        }
        .med-name {
          font-weight: bold;
          color: #1e88e5;
          margin: 0;
        }
        .med-dosage {
          color: #757575;
          margin: 0;
        }
        .timing-badge {
          background-color: #e8f5e9;
          color: #2e7d32;
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          display: inline-block;
          margin-bottom: 15px;
        }
        .contact-info {
          background-color: #fffde7;
          padding: 15px;
          border-radius: 6px;
          margin-top: 20px;
          border-left: 4px solid #fbc02d;
        }
        .contact-label {
          font-weight: bold;
          margin: 0;
          color: #f57c00;
        }
        .contact-value {
          margin: 5px 0 0 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 MediCheck Reminder</h1>
        </div>
        <div class="content">
          <div class="timing-badge">${timing} Medication</div>
          <h2>Time to take your medication</h2>
          <p>Please take the following medication(s) as prescribed by your doctor:</p>
          
          <div class="med-list">
            ${meds.map(m => `
              <div class="med-item">
                <div class="med-icon">Rx</div>
                <div class="med-details">
                  <p class="med-name">${m.medicine}</p>
                  <p class="med-dosage">${m.dosage}</p>
                </div>
              </div>
            `).join("")}
          </div>
          
          <div class="contact-info">
            <p class="contact-label">Emergency Contact</p>
            <p class="contact-value">${phone}</p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated reminder from MediCheck. Please do not reply to this email.</p>
          <p>If you need to update your medication schedule, please contact your healthcare provider.</p>
        </div>
      </div>
    </body>
    </html>
  `,
};

      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${email} for ${timing}`);

      // Voice Call Reminder
      sendVoiceCallReminder(phone, voiceMessage);
    }
  }).catch(err => {
    console.error(`[Cron Error - ${timing}]`, err);
  });
}

// 🕒 CRON JOBS

// Morning reminder - 1:40 PM
cron.schedule("24 15 * * *", () => {
  console.log("📨 Sending 1:40 PM Morning Reminders...");
  sendRemindersForTime("Morning");
});

// Night reminder - 9:00 PM
cron.schedule("0 21 * * *", () => {
  console.log("📨 Sending 9:00 PM Night Reminders...");
  sendRemindersForTime("Night");
});

// Server Start
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on Port: ${PORT}`);
});
