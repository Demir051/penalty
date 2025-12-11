import fs from 'fs/promises';
import path from 'path';
import Log from '../models/Log.js';

const LOG_DIR = path.resolve('logs');
const LOG_FILE = path.join(LOG_DIR, 'activity.log');

const ensureLogDir = async () => {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
  } catch {
    // ignore
  }
};

export const logAction = async ({ actorId, actorName, action, targetType, targetId = null, message, metadata = {} }) => {
  if (!actorId || !actorName || !action || !targetType || !message) return;
  try {
    await ensureLogDir();
    const entry = `[${new Date().toISOString()}] ${actorName} (${actorId}) -> ${action} on ${targetType}${targetId ? ` (${targetId})` : ''} :: ${message} ${Object.keys(metadata || {}).length ? JSON.stringify(metadata) : ''}\n`;
    await fs.appendFile(LOG_FILE, entry, { encoding: 'utf8' });
  } catch (err) {
    // swallow file errors; db log still attempted
    console.error('Log file write error:', err?.message || err);
  }

  try {
    const doc = new Log({
      actor: actorId,
      actorName,
      action,
      targetType,
      targetId,
      message,
      metadata,
    });
    await doc.save();
  } catch (err) {
    console.error('DB log write error:', err?.message || err);
  }
};

