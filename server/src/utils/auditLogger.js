const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Log an audit action to the database.
 * Non-blocking: will catch and log errors without crashing requests.
 */
async function logAudit(req, { action, entity, entityId, details, userId, userEmail, userRole }) {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';
    const effectiveUserId = userId || (req && req.user ? req.user.id : null);
    const effectiveUserEmail = userEmail || (req && req.user ? req.user.email : null);
    const effectiveUserRole = userRole || (req && req.user ? req.user.role : null);

    await prisma.auditLog.create({
      data: {
        userId: effectiveUserId,
        userEmail: effectiveUserEmail,
        userRole: effectiveUserRole,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        details: typeof details === 'object' ? JSON.stringify(details) : String(details || ''),
        ipAddress: String(ip),
      },
    });
  } catch (err) {
    console.error('⚠️ Failed to record audit log:', err.message);
  }
}

module.exports = { logAudit, prisma };
