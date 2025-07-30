import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: NextRequest) {
  try {
    const { expiredSlots } = await req.json();

    if (!expiredSlots || !Array.isArray(expiredSlots) || expiredSlots.length === 0) {
      return NextResponse.json({ success: true, message: "No slots to update" });
    }

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

    if (!spreadsheetId) {
      return NextResponse.json({ success: false, error: "Sheet ID not configured" });
    }

    // Read the current slots data to find row numbers
    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Slots for grabs!A:Z',
      });
    } catch (error) {
      console.error('Error calling Google Sheets API:', error);
      return NextResponse.json({ success: false, error: "Failed to read sheet data" });
    }

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: "No data found" });
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Find column indices
    const dateColIndex = headers.findIndex((h: string) => h === 'Date');
    const timeColIndex = headers.findIndex((h: string) => h === 'Time');
    const playerColIndex = headers.findIndex((h: string) => h === 'Player');
    const statusColIndex = headers.findIndex((h: string) => h === 'Status');

    if (dateColIndex === -1 || timeColIndex === -1 || playerColIndex === -1 || statusColIndex === -1) {
      return NextResponse.json({ success: false, error: "Required columns not found" });
    }

    const updates: any[] = [];

    // For each expired slot, find the corresponding row and update it
    expiredSlots.forEach((slot: any) => {
      const rowIndex = dataRows.findIndex((row: any[]) => {
        const rowDate = row[dateColIndex];
        const rowTime = row[timeColIndex];
        const rowPlayer = row[playerColIndex];
        const rowStatus = row[statusColIndex];
        
        return rowDate === slot.Date && 
               rowTime === slot.Time && 
               rowPlayer === slot.Player &&
               rowStatus === 'offered';
      });

      if (rowIndex !== -1) {
        const columnLetter = String.fromCharCode(65 + statusColIndex);
        const range = `Slots for grabs!${columnLetter}${rowIndex + 2}`;
        
        updates.push({
          range: range,
          values: [['expired']]
        });
      }
    });

    // Apply all updates if there are any
    if (updates.length > 0) {
      let result;
      try {
        result = await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: {
            valueInputOption: 'RAW',
            data: updates
          }
        });
      } catch (error) {
        console.error('Error updating sheet:', error);
        return NextResponse.json({ success: false, error: "Failed to update sheet data" });
      }
    }

    return NextResponse.json({ 
      success: true, 
      updatedCount: updates.length,
      message: `Updated ${updates.length} slots to expired status`
    });

  } catch (error: any) {
    console.error('Error updating expired slots:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to update expired slots' 
    });
  }
} 