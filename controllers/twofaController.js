const TwoFA = require("../models/twofaModel");

exports.get2FARecords = async (req, res) => {
  try {
    const results = await TwoFA.getAll();
    res.json(results);
  } catch (err) {
    console.error("Error fetching 2FA records:", err);
    res.status(500).json({ error: "Error fetching 2FA records" });
  }
};

exports.toggle2FA = async (req, res) => {
  const { student_id, status } = req.body;

  if (!student_id) {
    return res.status(400).json({ error: "Missing student_id" });
  }

  try {
    await TwoFA.updateStatus(student_id, status);
    res.json({ message: "2FA status updated successfully" });
  } catch (err) {
    console.error("Error updating 2FA:", err);
    res.status(500).json({ error: "Error updating 2FA status" });
  }
};

// 🧩 New method for student self-update
exports.update2FAByStudent = async (req, res) => {
  try {
    const { student_id, status } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: "Missing student_id" });
    }

    await TwoFA.updateStatus(student_id, status);

    res.json({
      message: `Two-Factor Authentication has been ${
        status === 1 ? "enabled" : "disabled"
      } successfully.`,
    });
  } catch (err) {
    console.error("Error updating 2FA for student:", err);
    res.status(500).json({ error: "Failed to update 2FA status" });
  }
};
