import { google } from 'googleapis';

export interface SheetData {
  headers: string[];
  rows: string[][];
  tabName: string;
}

export async function fetchSheetData(): Promise<SheetData> {
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  const tab = process.env.GOOGLE_SHEET_TAB;

  if (!saJson || !spreadsheetId || !tab) {
    throw new Error(
      'Missing env vars: GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_SHEETS_ID, GOOGLE_SHEET_TAB'
    );
  }

  const credentials = JSON.parse(saJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: tab,
  });

  const values = res.data.values ?? [];
  if (values.length === 0) return { headers: [], rows: [], tabName: tab };

  const headers = values[0].map(String);
  const rows = values.slice(1).map(row =>
    headers.map((_, i) => (row[i] != null ? String(row[i]) : ''))
  );

  return { headers, rows, tabName: tab };
}
