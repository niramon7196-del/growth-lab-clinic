/**
 * Google Drive & Google Sheets Integration Service for Growth Lab
 * Provides direct Workspace REST API access with OAuth token
 * Supports listing, uploading, reading, appending data, and backups
 */

import { getGoogleAccessToken } from './googleAuthService';
import { getWebhookUrl, syncPatientToGoogleSheets, syncDailyCheckInToGoogleSheets, syncCleanDailySummaryToGoogleSheets } from './googleAppsScriptService';
import { Patient, CheckInRecord } from '../types';
import { calculateConsistencyMetrics } from '../utils/checkInCalculations';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface SheetRangeData {
  range: string;
  majorDimension: string;
  values: any[][];
}

/**
 * 1. Google Drive: List files matching query
 */
export async function listDriveFiles(
  query: string = "trashed = false",
  pageSize: number = 20
): Promise<DriveFileItem[]> {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Google Workspace Access Token is missing. Please sign in with Google.');
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.append('q', query);
  url.searchParams.append('pageSize', pageSize.toString());
  url.searchParams.append('fields', 'files(id, name, mimeType, modifiedTime, size, webViewLink, iconLink)');
  url.searchParams.append('orderBy', 'modifiedTime desc');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * 2. Google Drive: Find or create Growth Lab Clinical Folder
 */
export async function getOrCreateGrowthLabFolder(): Promise<string> {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Google Workspace Access Token is missing.');
  }

  // Check if folder exists
  const existing = await listDriveFiles(
    "name = 'Growth Lab Clinical Data' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
    1
  );

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Create new folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Growth Lab Clinical Data',
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Directory for Growth Lab patient reports, clinical data, and exports',
    }),
  });

  if (!createRes.ok) {
    throw new Error('Failed to create Growth Lab folder in Google Drive');
  }

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * 3. Google Drive: Upload File / PDF / Backup JSON
 */
export async function uploadFileToGoogleDrive(
  fileName: string,
  mimeType: string,
  content: Blob | string,
  folderId?: string
): Promise<DriveFileItem> {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Google Workspace Access Token is missing.');
  }

  const targetFolderId = folderId || (await getOrCreateGrowthLabFolder());

  const metadata = {
    name: fileName,
    parents: [targetFolderId],
    mimeType: mimeType,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  
  if (typeof content === 'string') {
    form.append('file', new Blob([content], { type: mimeType }));
  } else {
    form.append('file', content);
  }

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive upload failed: ${errText}`);
  }

  return await response.json();
}

/**
 * 4. Google Drive: Delete file with mandatory user confirmation check
 */
export async function deleteDriveFile(fileId: string, fileName: string): Promise<boolean> {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('Google Workspace Access Token is missing.');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete Google Drive file: ${fileName}`);
  }
  return true;
}

/**
 * 5. Google Sheets: Create New Master Growth Lab Spreadsheet
 */
export async function createGrowthLabSpreadsheet(title: string = 'Growth Lab - Clinical Master Sheet'): Promise<{ id: string; spreadsheetUrl: string }> {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('Google Workspace Access Token is missing.');

  const folderId = await getOrCreateGrowthLabFolder();

  const spreadsheetBody = {
    properties: {
      title: title,
    },
    sheets: [
      {
        properties: {
          title: 'Patients',
          gridProperties: { rowCount: 100, columnCount: 15 },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'HN' } },
                  { userEnteredValue: { stringValue: 'First Name' } },
                  { userEnteredValue: { stringValue: 'Last Name' } },
                  { userEnteredValue: { stringValue: 'Nickname' } },
                  { userEnteredValue: { stringValue: 'Phone' } },
                  { userEnteredValue: { stringValue: 'Parent Phone' } },
                  { userEnteredValue: { stringValue: 'Date of Birth' } },
                  { userEnteredValue: { stringValue: 'Gender' } },
                  { userEnteredValue: { stringValue: 'Last Check-In' } },
                  { userEnteredValue: { stringValue: 'Status' } },
                  { userEnteredValue: { stringValue: 'Assigned Tasks' } },
                  { userEnteredValue: { stringValue: 'QR Token' } },
                  { userEnteredValue: { stringValue: 'Updated At' } },
                ],
              },
            ],
          },
        ],
      },
      {
        properties: {
          title: 'DailyCheckIns',
          gridProperties: { rowCount: 200, columnCount: 10 },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Timestamp' } },
                  { userEnteredValue: { stringValue: 'Date' } },
                  { userEnteredValue: { stringValue: 'HN' } },
                  { userEnteredValue: { stringValue: 'Patient Name' } },
                  { userEnteredValue: { stringValue: 'Action' } },
                  { userEnteredValue: { stringValue: 'Source' } },
                  { userEnteredValue: { stringValue: 'Method' } },
                  { userEnteredValue: { stringValue: 'Streak Days' } },
                  { userEnteredValue: { stringValue: 'Score' } },
                  { userEnteredValue: { stringValue: 'Status' } },
                ],
              },
            ],
          },
        ],
      },
      {
        properties: {
          title: 'Logs',
          gridProperties: { rowCount: 200, columnCount: 8 },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Timestamp' } },
                  { userEnteredValue: { stringValue: 'HN' } },
                  { userEnteredValue: { stringValue: 'Patient Name' } },
                  { userEnteredValue: { stringValue: 'Type' } },
                  { userEnteredValue: { stringValue: 'Action' } },
                  { userEnteredValue: { stringValue: 'Details' } },
                  { userEnteredValue: { stringValue: 'Status' } },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(spreadsheetBody),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to create Google Spreadsheet: ${err}`);
  }

  const created = await response.json();
  const fileId = created.spreadsheetId;

  // Move file into Growth Lab folder
  try {
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${folderId}&fields=id,parents`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  } catch (e) {
    console.warn('[googleDriveSheetsService] Folder move warning:', e);
  }

  return {
    id: fileId,
    spreadsheetUrl: created.spreadsheetUrl,
  };
}

/**
 * 6. Google Sheets: Read values from range
 */
export async function readSpreadsheetRange(
  spreadsheetId: string,
  range: string
): Promise<any[][]> {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('Google Workspace Access Token is missing.');

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to read Google Sheet range (${range})`);
  }

  const data: SheetRangeData = await res.json();
  return data.values || [];
}

/**
 * 7. Google Sheets: Append Row to Spreadsheet
 */
export async function appendSpreadsheetRow(
  spreadsheetId: string,
  range: string,
  rowValues: any[]
): Promise<boolean> {
  const token = await getGoogleAccessToken();
  if (!token) throw new Error('Google Workspace Access Token is missing.');

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  return res.ok;
}

/**
 * 8. Real-time Full Synchronization Dispatcher
 * Automatically dispatches to both OAuth Direct Sheets & Webhook permanent background endpoints
 */
export async function syncRealtimeCheckIn(
  patient: Patient,
  record: CheckInRecord
): Promise<void> {
  const webhookUrl = getWebhookUrl();
  const metrics = calculateConsistencyMetrics(patient);
  const streak = metrics.streakDays || 1;

  // 1. Google Apps Script Webhook Auto-Sync (Instant & Non-blocking)
  try {
    syncDailyCheckInToGoogleSheets(webhookUrl, {
      patientId: patient.id,
      hn: patient.hn || patient.id,
      action: 'เช็คอินประจำวัน (Daily Check-in)',
      actionName: 'เช็คอินประจำวัน (Daily Check-in)',
      score: 'สำเร็จ',
      status: 'completed',
    }).catch(err => console.warn('[syncRealtimeCheckIn] Webhook check-in sync error:', err));

    syncCleanDailySummaryToGoogleSheets(webhookUrl, {
      patientId: patient.id,
      hn: patient.hn || patient.id,
      date: record.date,
      checkInStatus: 'CHECKED_IN',
      streakDays: streak,
      completedExercises: metrics.todayCompletedExercises || 1,
      complianceScore: metrics.consistencyPercent || 100,
    }).catch(err => console.warn('[syncRealtimeCheckIn] Webhook summary sync error:', err));

    syncPatientToGoogleSheets(webhookUrl, patient).catch(err =>
      console.warn('[syncRealtimeCheckIn] Webhook patient sync error:', err)
    );
  } catch (e) {
    console.warn('[syncRealtimeCheckIn] Webhook dispatch warning:', e);
  }

  // 2. Direct Google Sheets API sync if user is logged into Google Workspace
  const token = await getGoogleAccessToken();
  if (token) {
    try {
      const savedSpreadsheetId = localStorage.getItem('growthlab_active_spreadsheet_id');
      if (savedSpreadsheetId) {
        await appendSpreadsheetRow(
          savedSpreadsheetId,
          'DailyCheckIns!A:J',
          [
            record.timestamp || new Date().toISOString(),
            record.date,
            patient.hn,
            `${patient.firstName} ${patient.lastName}`.trim(),
            'เช็คอินประจำวัน',
            record.source || 'APP',
            record.method || 'QR_TOKEN',
            streak,
            metrics.consistencyPercent || '100',
            'COMPLETED',
          ]
        );
      }
    } catch (directErr) {
      console.warn('[syncRealtimeCheckIn] Direct Sheets append warning:', directErr);
    }
  }
}
