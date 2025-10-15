const db = require('../config/db');

const Notification = {
  // Create a new notification and assign to students
  create: async ({ notif_type, notif_message, recipient_mode, selected_courses = [], selected_students = [] }) => {
    // Insert notification
    const [result] = await db.execute(
      `INSERT INTO notifications (notif_type, notif_message, recipient_mode, selected_courses, selected_students)
       VALUES (?, ?, ?, ?, ?)`,
      [notif_type, notif_message, recipient_mode, JSON.stringify(selected_courses), JSON.stringify(selected_students)]
    );

    const notificationId = result.insertId;

    // Assign notification to students
    if (recipient_mode === 'all') {
      const [students] = await db.execute('SELECT id FROM students');
      for (const student of students) {
        await db.execute(
          'INSERT INTO student_notifications (student_id, notification_id, mark_read) VALUES (?, ?, 0)',
          [student.id, notificationId]
        );
      }
    } else if (recipient_mode === 'course') {
      for (const courseId of selected_courses) {
        const [students] = await db.execute(
          'SELECT id FROM students WHERE course_id = ?',
          [courseId]
        );
        for (const student of students) {
          await db.execute(
            'INSERT INTO student_notifications (student_id, notification_id, mark_read) VALUES (?, ?, 0)',
            [student.id, notificationId]
          );
        }
      }
    } else if (recipient_mode === 'selected') {
      for (const studentId of selected_students) {
        await db.execute(
          'INSERT INTO student_notifications (student_id, notification_id, mark_read) VALUES (?, ?, 0)',
          [studentId, notificationId]
        );
      }
    }

    return notificationId;
  },

  // Get all notifications (admin view)
  getAll: async () => {
    const [rows] = await db.execute('SELECT * FROM notifications ORDER BY created_at DESC');
    return rows;
  },

  // Get all notifications for a specific student
  getAllByStudent: async (studentId) => {
    const [rows] = await db.execute(
      `SELECT 
    n.id, 
    n.notif_type, 
    n.notif_message, 
    n.recipient_mode, 
    n.selected_courses,
    n.selected_students,
    n.created_at,
    IFNULL(sn.mark_read, 0) AS mark_read,
    (
        SELECT GROUP_CONCAT(s.id, s.first_name)
        FROM students s
        WHERE JSON_CONTAINS(n.selected_students, CONCAT('"', s.id, '"'))
    ) AS selected_student_names
FROM notifications n
LEFT JOIN student_notifications sn
    ON n.id = sn.notification_id AND sn.student_id = ?
ORDER BY n.created_at DESC
LIMIT 0, 25;`,
      [studentId]
    );

    return rows.map(r => ({
  id: r.id,
  notif_type: r.notif_type,
  notif_message: r.notif_message,
  recipient_mode: r.recipient_mode,
  selected_courses: JSON.parse(r.selected_courses || '[]'),
  selected_students: JSON.parse(r.selected_students || '[]'),
  created_at: new Date(r.created_at + 'Z').toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }),
  read: !!r.mark_read
    }));

  },

  // Get notification by ID
  getById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM notifications WHERE id = ?', [id]);
    return rows[0];
  },

  // Update notification
  update: async (id, { notif_type, notif_message, recipient_mode, selected_courses = [], selected_students = [] }) => {
    await db.execute(
      `UPDATE notifications
       SET notif_type=?, notif_message=?, recipient_mode=?, selected_courses=?, selected_students=?, updated_at=NOW()
       WHERE id=?`,
      [notif_type, notif_message, recipient_mode, JSON.stringify(selected_courses), JSON.stringify(selected_students), id]
    );
  },

  // Delete notification
  delete: async (id) => {
    await db.execute('DELETE FROM notifications WHERE id = ?', [id]);
    await db.execute('DELETE FROM student_notifications WHERE notification_id = ?', [id]);
  },

  // Mark notification as read
  markRead: async (studentId, notificationId) => {
    const [result] = await db.execute(
      'UPDATE student_notifications SET mark_read = 1 WHERE student_id = ? AND notification_id = ?',
      [studentId, notificationId]
    );

    // If no rows were updated, insert it (prevents 404)
    if (result.affectedRows === 0) {
      await db.execute(
        'INSERT INTO student_notifications (student_id, notification_id, mark_read) VALUES (?, ?, 1)',
        [studentId, notificationId]
      );
    }

    return true;
  }
};

module.exports = Notification;
