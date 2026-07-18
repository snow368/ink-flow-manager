import { db } from '../db';

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let accessToken: string | null = null;

export function getGoogleAuthUrl(): string {
  const redirectUri = window.location.origin + '/drive-callback';
  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=${SCOPES}&prompt=consent`;
}

export function setAccessToken(token: string) {
  accessToken = token;
  localStorage.setItem('inkflow_gdrive_token', token);
}

export function loadAccessToken(): string | null {
  if (!accessToken) {
    accessToken = localStorage.getItem('inkflow_gdrive_token');
  }
  return accessToken;
}

export function clearAccessToken() {
  accessToken = null;
  localStorage.removeItem('inkflow_gdrive_token');
}

export async function createBackupFolder(): Promise<string | null> {
  const token = loadAccessToken();
  if (!token) return null;

  try {
    const folderName = 'InkFlow Backups';
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const searchData = await searchRes.json();

    if (searchData.files?.length > 0) {
      return searchData.files[0].id;
    }

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });
    const createData = await createRes.json();
    return createData.id || null;
  } catch {
    return null;
  }
}

export async function backupToDrive(): Promise<{ success: boolean; message: string }> {
  const token = loadAccessToken();
  if (!token) return { success: false, message: 'Not connected to Google Drive' };

  try {
    const folderId = await createBackupFolder();
    if (!folderId) return { success: false, message: 'Failed to create backup folder' };

    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      clients: await db.clients.toArray(),
      appointments: await db.appointments.toArray(),
      waivers: await db.waivers.toArray(),
      sessions: await db.sessions.toArray(),
      inventory: await db.inventory.toArray(),
      portfolio: await db.portfolio.toArray(),
    };

    const jsonStr = JSON.stringify(data);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const formData = new FormData();
    const metadata = {
      name: `inkflow_backup_${new Date().toISOString().slice(0, 10)}.json`,
      parents: [folderId],
      mimeType: 'application/json',
    };
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', blob);

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (uploadRes.ok) {
      const userId = localStorage.getItem('inkflow_current_user');
      if (userId) {
        await db.users.update(userId, {
          googleDriveConnected: true,
          googleDriveFolderId: folderId,
          lastBackupAt: Date.now(),
        });
      }
      return { success: true, message: 'Backup saved to Google Drive' };
    }
    return { success: false, message: 'Upload failed' };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Backup failed' };
  }
}

export async function restoreFromDrive(): Promise<{ success: boolean; message: string }> {
  const token = loadAccessToken();
  if (!token) return { success: false, message: 'Not connected to Google Drive' };

  try {
    const folderId = await createBackupFolder();
    if (!folderId) return { success: false, message: 'No backup folder found' };

    const listRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and mimeType='application/json' and trashed=false&orderBy=createdTime desc&pageSize=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const listData = await listRes.json();
    if (!listData.files?.length) return { success: false, message: 'No backup files found' };

    const fileId = listData.files[0].id;
    const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await downloadRes.json();

    if (json.clients) {
      await db.clients.clear();
      for (const c of json.clients) await db.clients.add(c);
    }
    if (json.appointments) {
      await db.appointments.clear();
      for (const a of json.appointments) await db.appointments.add(a);
    }
    if (json.waivers) {
      await db.waivers.clear();
      for (const w of json.waivers) await db.waivers.add(w);
    }
    if (json.sessions) {
      await db.sessions.clear();
      for (const s of json.sessions) await db.sessions.add(s);
    }
    if (json.inventory) {
      await db.inventory.clear();
      for (const i of json.inventory) await db.inventory.add(i);
    }
    if (json.portfolio) {
      await db.portfolio.clear();
      for (const p of json.portfolio) await db.portfolio.add(p);
    }

    return { success: true, message: 'Data restored from Google Drive' };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Restore failed' };
  }
}
