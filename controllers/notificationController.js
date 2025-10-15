const Notification = require('../models/notificationModel');
const axios = require('axios');
const db = require('../config/db');

// Get courses
const getCourses = async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5000/api/courses/list');
    res.json(response.data.courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
};

// Get students
const getStudents = async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5000/api/students/list');
    res.json(response.data);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
};

// Create notification
const createNotification = async (req, res) => {
  try {
    const { notif_type, notif_message, recipient_mode, selected_courses, selected_students } = req.body;
    const id = await Notification.create({ notif_type, notif_message, recipient_mode, selected_courses, selected_students });
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// List notifications for a student
const listNotifications = async (req, res) => {
  try {
    const studentId = req.query.student_id || req.session?.student?.student_id;
    if (!studentId) return res.status(400).json({ message: 'student_id is required' });

    const notifications = await Notification.getAllByStudent(studentId);
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// List all notifications (admin view)
const listAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.getAll();
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching all notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update notification
const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { notif_type, notif_message, recipient_mode, selected_courses, selected_students } = req.body;
    await Notification.update(id, { notif_type, notif_message, recipient_mode, selected_courses, selected_students });
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating notification:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.delete(id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as read
const markReadNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id } = req.body;
    if (!student_id) return res.status(400).json({ message: 'student_id is required' });

    const affected = await Notification.markRead(student_id, id);
    if (affected === 0) return res.status(404).json({ message: 'Notification not found for this student' });

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

module.exports = {
  getCourses,
  getStudents,
  createNotification,
  listNotifications,
  listAllNotifications,
  updateNotification,
  deleteNotification,
  markReadNotification
};
