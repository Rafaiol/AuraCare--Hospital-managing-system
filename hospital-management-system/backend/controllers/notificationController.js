/**
 * Notification Controller
 */
const { executeQuery, executeQueryWithPagination } = require('../config/database');
const { APIError, asyncHandler } = require('../middlewares/errorHandler');

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = 'false' } = req.query;
  const userId = req.user.userId;

  let query = `SELECT * FROM NOTIFICATIONS WHERE (USER_ID = $1 OR USER_ID IS NULL)`;
  const params = [userId];

  if (unreadOnly === 'true') {
    query += ` AND IS_READ = 0`;
  }

  query += ` ORDER BY CREATED_AT DESC`;

  const result = await executeQueryWithPagination(query, params, parseInt(page), parseInt(limit));

  const notifications = result.data.map(row => ({
    id: row.NOTIFICATION_ID,
    userId: row.USER_ID,
    title: row.TITLE,
    message: row.MESSAGE,
    type: row.TYPE,
    isRead: row.IS_READ === 1,
    createdAt: row.CREATED_AT
  }));

  res.json({
    success: true,
    data: notifications,
    pagination: result.pagination
  });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const result = await executeQuery(
    `UPDATE NOTIFICATIONS SET IS_READ = 1 
     WHERE NOTIFICATION_ID = $1 AND (USER_ID = $2 OR USER_ID IS NULL)
     RETURNING NOTIFICATION_ID`,
    [parseInt(id), userId]
  );

  if (result.rows.length === 0) {
    throw new APIError('Notification not found', 404);
  }

  res.json({ success: true, message: 'Notification marked as read' });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  await executeQuery(
    `UPDATE NOTIFICATIONS SET IS_READ = 1 WHERE USER_ID = $1 OR USER_ID IS NULL`,
    [userId]
  );

  res.json({ success: true, message: 'All notifications marked as read' });
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const result = await executeQuery(
    `DELETE FROM NOTIFICATIONS WHERE NOTIFICATION_ID = $1 AND (USER_ID = $2 OR USER_ID IS NULL) RETURNING *`,
    [parseInt(id), userId]
  );

  if (result.rows.length === 0) {
    throw new APIError('Notification not found', 404);
  }

  res.json({ success: true, message: 'Notification deleted' });
});

/**
 * Utility to create notifications (internal use)
 */
const createNotification = async ({ userId, title, message, type = 'INFO' }) => {
  try {
    await executeQuery(
      `INSERT INTO NOTIFICATIONS (USER_ID, TITLE, MESSAGE, TYPE) VALUES ($1, $2, $3, $4)`,
      [userId || null, title, message, type.toUpperCase()]
    );
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification
};
