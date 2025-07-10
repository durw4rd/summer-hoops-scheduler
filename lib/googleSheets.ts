import { google } from "googleapis";

export async function getGoogleSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  if (!email || !key || !sheetId) {
    throw new Error("Missing Google Sheets environment variables");
  }
  const auth = new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  await auth.authorize();
  return google.sheets({ version: "v4", auth });
}

export async function getSchedule(range = "Daily schedule!B5:C28") {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
  return res.data.values;
}

export async function getUserMapping() {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  // Read all rows from A2:C (skip header)
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'User mapping!A2:C',
  });
  const values = res.data.values || [];
  // Convert to mapping: { [playerName]: { email, color } }
  const mapping: Record<string, { email: string; color?: string }> = {};
  for (const row of values) {
    if (row[0] && row[1]) {
      mapping[row[0]] = { email: row[1], color: row[2] };
    }
  }
  return mapping;
}

export async function offerSlotForGrabs({ date, time, player }: { date: string; time: string; player: string }) {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  const now = new Date().toISOString();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Slots for grabs',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[date, time, player, 'offered', '', now]],
    },
  });
  return { success: true };
}

export async function claimSlot({ date, time, player, claimer }: { date: string; time: string; player: string; claimer: string }) {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  // Read all rows to find the first matching slot
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Slots for grabs',
  });
  const values = res.data.values || [];
  // Find header row and data rows
  const header = values[0];
  const rows = values.slice(1);
  const idx = rows.findIndex(row =>
    row[0] === date && row[1] === time && row[2] === player && row[3] === 'offered'
  );
  if (idx === -1) throw new Error('Slot not found or already claimed');
  const rowNumber = idx + 2; // +2 for 1-based index and header
  const now = new Date().toISOString();
  // Find the index of the 'ClaimedBy' column
  const claimedByColIdx = header.findIndex((col: string) => col === 'ClaimedBy');
  if (claimedByColIdx === -1) throw new Error("'ClaimedBy' column not found in Slots for grabs sheet");
  // Update the row in Slots for grabs: Status, ClaimedBy, Timestamp
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Slots for grabs!D${rowNumber}:F${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      // D = Status, E = ClaimedBy, F = Timestamp
      values: [['claimed', claimer, now]],
    },
  });

  // --- Update Daily schedule sheet ---
  // Fetch the relevant range (B5:C28)
  const scheduleRange = 'Daily schedule!B5:C28';
  const scheduleRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: scheduleRange,
  });
  const scheduleRows = scheduleRes.data.values || [];

  // Helper to parse session details from column B
  function parseSessionDetails(details: string) {
    // Format: 'DD.MM / weekDay / HH:MM - HH:MM'
    const [datePart, , timePart] = details.split(' / ');
    return { date: datePart.trim(), time: timePart.trim() };
  }

  // Find the first row that matches date and time
  let found = false;
  for (let i = 0; i < scheduleRows.length; i++) {
    const [details, playerList] = scheduleRows[i];
    if (!details) continue;
    const { date: rowDate, time: rowTime } = parseSessionDetails(details);
    if (rowDate === date && rowTime === time) {
      // Update player list: remove offering player, add claimer
      let players = (playerList || '').split(',').map((p: string) => p.trim()).filter(Boolean);
      const playerIdx = players.findIndex((p: string) => p.toLowerCase() === player.toLowerCase());
      if (playerIdx !== -1) {
        players.splice(playerIdx, 1, claimer); // Replace offering player with claimer
      } else {
        players.push(claimer); // If not found, just add
      }
      // Write back the updated player list
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Daily schedule!C${i + 5}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[players.join(', ')]],
        },
      });
      found = true;
      break;
    }
  }
  // Optionally, could throw if not found, but for now just proceed

  return { success: true };
}

export async function retractSlot({ date, time, player }: { date: string; time: string; player: string }) {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  // Read all rows to find the first matching slot
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Slots for grabs',
  });
  const values = res.data.values || [];
  // Find header row and data rows
  const header = values[0];
  const rows = values.slice(1);
  const idx = rows.findIndex(row =>
    row[0] === date && row[1] === time && row[2] === player && row[3] === 'offered'
  );
  if (idx === -1) throw new Error('Slot not found or not offered');
  const rowNumber = idx + 2; // +2 for 1-based index and header
  const now = new Date().toISOString();
  // Update the row
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Slots for grabs!D${rowNumber}:F${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [['retracted', '', now]],
    },
  });
  return { success: true };
}

export async function getAvailableSlots() {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Slots for grabs',
  });
  const values = res.data.values || [];
  const header = values[0];
  const rows = values.slice(1);
  // Only slots with Status='offered'
  return rows.filter(row => row[3] === 'offered').map(row => {
    const slot: Record<string, string> = {};
    header.forEach((col, i) => { slot[col] = row[i] || ''; });
    return slot;
  });
}

export async function getAllSlots() {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Slots for grabs',
  });
  const values = res.data.values || [];
  const header = values[0];
  const rows = values.slice(1);
  return rows.map(row => {
    const slot: Record<string, string> = {};
    header.forEach((col, i) => { slot[col] = row[i] || ''; });
    return slot;
  });
}