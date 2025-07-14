import { NextRequest, NextResponse } from "next/server";
import { getGoogleSheetsClient } from "@/lib/googleSheets";

const SCHEDULE_SHEET = "Daily schedule";
const SLOTS_SHEET = "Slots for grabs";

function normalizeDate(dateStr: string) {
  if (!dateStr) return '';
  const [d, m] = dateStr.split('.').map(Number);
  if (isNaN(d) || isNaN(m)) return dateStr.trim();
  return `${d.toString().padStart(2, '0')}.${m.toString().padStart(2, '0')}`;
}

export async function POST(req: NextRequest) {
  try {
    const { date, time, fromPlayer, toPlayer } = await req.json();
    if (!date || !time || !fromPlayer || !toPlayer) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

    // 1. Update the schedule: remove fromPlayer, add toPlayer for the session
    // Fetch the schedule rows
    const scheduleRange = `${SCHEDULE_SHEET}!B5:C28`;
    const scheduleRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: scheduleRange,
    });
    const scheduleRows = scheduleRes.data.values || [];

    // Find the row for the session
    let sessionRowIdx = -1;
    let players: string[] = [];
    for (let i = 0; i < scheduleRows.length; i++) {
      const [details, playerList] = scheduleRows[i];
      if (!details) continue;
      // Format: 'DD.MM / weekDay / HH:MM - HH:MM'
      const [rowDate, , rowTime] = details.split(' / ');
      if (normalizeDate(rowDate?.trim()) === normalizeDate(date) && rowTime?.trim() === time) {
        sessionRowIdx = i;
        players = (playerList || '').split(',').map((p: string) => p.trim()).filter(Boolean);
        break;
      }
    }
    if (sessionRowIdx === -1) {
      return NextResponse.json({ error: "Session not found in schedule." }, { status: 404 });
    }
    // Remove fromPlayer, add toPlayer (even if already present)
    players = players.filter(p => p.toLowerCase() !== fromPlayer.toLowerCase());
    players.push(toPlayer); // Always add, even if already present
    // Write back the updated player list
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SCHEDULE_SHEET}!C${sessionRowIdx + 5}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[players.join(', ')]] },
    });

    // 2. Add entry to Slots for grabs with status 'reassigned'
    const now = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: SLOTS_SHEET,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[date, time, fromPlayer, 'reassigned', '', '', '', toPlayer, now]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unknown error." }, { status: 500 });
  }
} 