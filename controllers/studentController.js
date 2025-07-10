const studentModel = require('../models/studentModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const registerStudent = async (req, res) => {
  try {
    const student = req.body;
    const plainPassword = student.password;
    const hashedPassword = await bcrypt.hash(student.password, 10);
    student.password = hashedPassword;

    const studentId = await studentModel.createStudent(student);

    // Send Email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'cpcevents135@gmail.com',
        pass: 'hqcq rmrc alba cqvb',
      },
    });

    const mailOptions = {
      from: 'cpcevents135@gmail.com',
      to: student.email,
      subject: 'Student Registration - Password Info',
      text: `Hello ${student.first_name},\n\nYour Account Registration is successful.\n\nYour username is your Student ID: ${student.student_id}\nDefault password: ${plainPassword}\n\nPlease keep it safe.\n\n`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Student registered successfully', id: studentId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await studentModel.getAllStudents();
    res.json({ students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

const deactivateStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    await studentModel.deactivateStudent(studentId);
    res.json({ message: 'Student deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const activateStudent = async (req, res) => {
  const studentId = req.params.id;
  try {
    await studentModel.updateStatus(studentId, 0);  // 0 = active
    res.json({ message: 'Student activated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to activate student' });
  }
};


module.exports = { registerStudent, getAllStudents, deactivateStudent, activateStudent };
