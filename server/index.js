const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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

// Save Medication Route
app.post("/medications", async (req, res) => {
  try {
    const { email, medications } = req.body;

    if (!email || !Array.isArray(medications)) {
      return res.status(400).json({ error: "Invalid request." });
    }

    const medsToInsert = medications
      .filter(med => med.medicine && med.dosage && med.timing)
      .map(med => ({
        email,
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

// Reminder Function
function sendRemindersForTime(timing) {
  Medication.find({ timing: timing }).then(async (meds) => {
    const groupedByEmail = {};

    meds.forEach(med => {
      if (!groupedByEmail[med.email]) groupedByEmail[med.email] = [];
      groupedByEmail[med.email].push(med);
    });

    for (const [email, meds] of Object.entries(groupedByEmail)) {
      const plainText = meds.map(m => `• ${m.medicine} (${m.dosage})`).join('\n');
      const htmlList = meds.map(m => `<li>${m.medicine} (${m.dosage})</li>`).join("");

      const mailOptions = {
        from: `"MediCheck Reminder" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `⏰ Medication Reminder - ${timing}`,
        text: `Please take the following medication(s):\n\n${plainText}`,
        html: `<h3>Your ${timing} Medication Reminder</h3><ul>${htmlList}</ul>`,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Reminder sent to ${email} for ${timing}`);
    }
  }).catch(err => {
    console.error(`[Cron Error - ${timing}]`, err);
  });
}

// 🕒 CRON JOBS

// 1:40 PM for Morning meds
cron.schedule("45 13 * * *", () => {
  console.log("📨 Sending 1:40 PM Morning Reminders...");
  sendRemindersForTime("Morning");
});

// 9:00 PM for Night meds
cron.schedule("0 21 * * *", () => {
  console.log("📨 Sending 9:00 PM Night Reminders...");
  sendRemindersForTime("Night");
});

// Server
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on Port: ${PORT}`);
});
