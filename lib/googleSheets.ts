// Sheet and range constants
/** Name of the daily schedule sheet */
const SHEET_DAILY_SCHEDULE = "Daily schedule";
/** Name of the slots for grabs sheet */
const SHEET_SLOTS_FOR_GRABS = "Slots for grabs";
/** Name of the user mapping sheet */
const SHEET_USER_MAPPING = "User mapping";
/** Range for the schedule (update as needed for new rows) */
const RANGE_SCHEDULE = `${SHEET_DAILY_SCHEDULE}!B5:D`;
/** Range for the slots for grabs sheet */
const RANGE_SLOTS = SHEET_SLOTS_FOR_GRABS;
/** Range for the user mapping sheet */
const RANGE_USER_MAPPING = `${SHEET_USER_MAPPING}!A2:C`;
/** The starting row for the schedule (for C column updates) */
const SCHEDULE_START_ROW = 5;

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
    key: key.replace(/\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  await auth.authorize();
  return google.sheets({ version: "v4", auth });
}

/**
 * Fetches the schedule from the Google Sheet.
 */
export async function getSchedule() {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: RANGE_SCHEDULE });
  return res.data.values;
}

/**
 * Fetches the user mapping from the Google Sheet.
 */
export async function getUserMapping() {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  // Read all rows from A2:C (skip header)
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: RANGE_USER_MAPPING,
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
    range: RANGE_SLOTS,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[date, time, player, 'offered', 'no', '', '', '', now]],
    },
  });
  return { success: true };
}

export async function requestSlotSwap({ date, time, player, requestedDate, requestedTime }: { date: string; time: string; player: string; requestedDate: string; requestedTime: string; }) {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  const now = new Date().toISOString();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: RANGE_SLOTS,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[date, time, player, 'offered', 'yes', requestedDate, requestedTime, '', now]],
    },
  });
  return { success: true };
}

export async function claimSlot({ date, time, player, claimer }: { date: string; time: string; player: string; claimer: string }) {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  const now = new Date().toISOString();

  // If claiming a free spot (not an offered slot), just add an entry to Slots for grabs
  if (player === 'free spot') {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: RANGE_SLOTS,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[date, time, 'free spot', 'claimed', 'no', '', '', claimer, now]],
      },
    });
    // Also update the Daily schedule sheet to add the claimer to the session's player list
    const scheduleRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: RANGE_SCHEDULE,
    });
    const scheduleRows = scheduleRes.data.values || [];
    // Helper to parse session details from column B
    function parseSessionDetails(details: string) {
      // Format: 'DD.MM / weekDay / HH:MM - HH:MM'
      const [datePart, , timePart] = details.split(' / ');
      return { date: datePart.trim(), time: timePart.trim() };
    }
    for (let i = 0; i < scheduleRows.length; i++) {
      const [details, playerList] = scheduleRows[i];
      if (!details) continue;
      const { date: rowDate, time: rowTime } = parseSessionDetails(details);
      if (rowDate === date && rowTime === time) {
        // Append the claimer to the player list
        let players = (playerList || '').split(',').map((p: string) => p.trim()).filter(Boolean);
        players.push(claimer);
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_DAILY_SCHEDULE}!C${i + SCHEDULE_START_ROW}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[players.join(', ')]],
          },
        });
        break;
      }
    }
    return { success: true };
  }

  // Read all rows to find the first matching slot
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: RANGE_SLOTS,
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
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: `${SHEET_SLOTS_FOR_GRABS}!D${rowNumber}`,
          values: [['claimed']],
        },
        {
          range: `${SHEET_SLOTS_FOR_GRABS}!H${rowNumber}`,
          values: [[claimer]],
        },
        {
          range: `${SHEET_SLOTS_FOR_GRABS}!I${rowNumber}`,
          values: [[now]],
        },
      ],
    },
  });

  // --- Update Daily schedule sheet ---
  const scheduleRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: RANGE_SCHEDULE,
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
        range: `${SHEET_DAILY_SCHEDULE}!C${i + SCHEDULE_START_ROW}`,
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
    range: RANGE_SLOTS,
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
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: `${SHEET_SLOTS_FOR_GRABS}!D${rowNumber}`,
          values: [['retracted']],
        },
        {
          range: `${SHEET_SLOTS_FOR_GRABS}!H${rowNumber}`,
          values: [['']],
        },
        {
          range: `${SHEET_SLOTS_FOR_GRABS}!I${rowNumber}`,
          values: [[now]],
        },
      ],
    },
  });
  return { success: true };
}

export async function getAvailableSlots() {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: RANGE_SLOTS,
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
    range: RANGE_SLOTS,
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

export async function acceptSlotSwap({ date, time, player, requestedDate, requestedTime, acceptingPlayer }: { date: string; time: string; player: string; requestedDate: string; requestedTime: string; acceptingPlayer: string }) {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  // Find the swap request row
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: RANGE_SLOTS,
  });
  const values = res.data.values || [];
  const header = values[0];
  const rows = values.slice(1);
  const idx = rows.findIndex(row =>
    row[0] === date &&
    row[1] === time &&
    row[2] === player &&
    row[3] === 'offered' &&
    row[4] === 'yes' &&
    row[5] === requestedDate &&
    row[6] === requestedTime
  );
  if (idx === -1) throw new Error('Swap request not found');
  const rowNumber = idx + 2; // +2 for 1-based index and header
  const now = new Date().toISOString();
  // Update Status (D), ClaimedBy (H), Timestamp (I)
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `${SHEET_SLOTS_FOR_GRABS}!D${rowNumber}`, values: [['claimed']] },
        { range: `${SHEET_SLOTS_FOR_GRABS}!H${rowNumber}`, values: [[acceptingPlayer]] },
        { range: `${SHEET_SLOTS_FOR_GRABS}!I${rowNumber}`, values: [[now]] },
      ],
    },
  });

  // --- Swap players in Daily schedule sheet ---
  // Fetch the relevant range (B5:C28)
  const scheduleRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: RANGE_SCHEDULE,
  });
  const scheduleRows = scheduleRes.data.values || [];

  // Helper to parse session details from column B
  function parseSessionDetails(details: string) {
    // Format: 'DD.MM / weekDay / HH:MM - HH:MM'
    const [datePart, , timePart] = details.split(' / ');
    return { date: datePart.trim(), time: timePart.trim() };
  }

  let offerRowIdx = -1;
  let requestRowIdx = -1;
  let offerPlayers: string[] = [];
  let requestPlayers: string[] = [];

  for (let i = 0; i < scheduleRows.length; i++) {
    const [details, playerList] = scheduleRows[i];
    if (!details) continue;
    const { date: rowDate, time: rowTime } = parseSessionDetails(details);
    if (rowDate === date && rowTime === time) {
      offerRowIdx = i;
      offerPlayers = (playerList || '').split(',').map((p: string) => p.trim()).filter(Boolean);
    }
    if (rowDate === requestedDate && rowTime === requestedTime) {
      requestRowIdx = i;
      requestPlayers = (playerList || '').split(',').map((p: string) => p.trim()).filter(Boolean);
    }
  }
  if (offerRowIdx === -1 || requestRowIdx === -1) throw new Error('Session(s) not found in schedule');

  // Remove offering player from their slot, add accepting player (replace one instance, or add if not found)
  const offerIdx = offerPlayers.findIndex(p => p.toLowerCase() === player.toLowerCase());
  if (offerIdx !== -1) {
    offerPlayers.splice(offerIdx, 1, acceptingPlayer);
  } else {
    offerPlayers.push(acceptingPlayer);
  }
  // In the target session, replace one instance of accepting player with offering player (or add if not found)
  const acceptIdx = requestPlayers.findIndex(p => p.toLowerCase() === acceptingPlayer.toLowerCase());
  if (acceptIdx !== -1) {
    requestPlayers.splice(acceptIdx, 1, player);
  } else {
    requestPlayers.push(player);
  }

  // Write back the updated player lists
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_DAILY_SCHEDULE}!C${offerRowIdx + SCHEDULE_START_ROW}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[offerPlayers.join(', ')]] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_DAILY_SCHEDULE}!C${requestRowIdx + SCHEDULE_START_ROW}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[requestPlayers.join(', ')]] },
  });

  return { success: true };
}