import { google } from "googleapis";
import { normalizeDate } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';

// Sheet and range constants
/** Name of the daily schedule sheet */
const SHEET_DAILY_SCHEDULE = "Daily schedule";
/** Name of the marketplace sheet */
const SHEET_MARKETPLACE = "Marketplace";
/** Name of the user mapping sheet */
const SHEET_USER_MAPPING = "User mapping";
/** Range for the schedule (update as needed for new rows) */
const RANGE_SCHEDULE = `${SHEET_DAILY_SCHEDULE}!B5:D`;
/** Range for the marketplace sheet (now includes ID column) */
const RANGE_SLOTS = `${SHEET_MARKETPLACE}!A:K`;
/** Range for the user mapping sheet */
const RANGE_USER_MAPPING = `${SHEET_USER_MAPPING}!A2:C`;
/** The starting row for the schedule (for C column updates) */
const SCHEDULE_START_ROW = 5;

/**
 * Generates a unique ID for a slot
 */
function generateSlotId(): string {
  return uuidv4();
}

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
  const slotId = generateSlotId();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: RANGE_SLOTS,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[slotId, date, time, player, 'offered', 'no', '', '', '', now]],
    },
  });
  return { success: true, slotId };
}

export async function requestSlotSwapById({ slotId, requestedDate, requestedTime }: { slotId: string; requestedDate: string; requestedTime: string; }) {
  const { row, rowNumber } = await findSlotById(slotId);
  
  const date = row[1]; // Date column (B)
  const time = row[2]; // Time column (C)
  const player = row[3]; // Player column (D)
  const status = row[4]; // Status column (E)
  
  if (status !== 'offered') {
    throw new Error('Slot must be offered to request swap');
  }
  
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  const now = new Date().toISOString();
  
  // Update SwapRequested (F), RequestedDate (G), RequestedTime (H), Timestamp (J)
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `${SHEET_MARKETPLACE}!F${rowNumber}`, values: [['yes']] },
        { range: `${SHEET_MARKETPLACE}!G${rowNumber}`, values: [[requestedDate]] },
        { range: `${SHEET_MARKETPLACE}!H${rowNumber}`, values: [[requestedTime]] },
        { range: `${SHEET_MARKETPLACE}!J${rowNumber}`, values: [[now]] },
      ],
    },
  });
  
  return { success: true, slotId };
}

export async function claimSlotById({ slotId, claimer }: { slotId: string; claimer: string }) {
  const { row, rowNumber } = await findSlotById(slotId);
  
  const date = row[1]; // Date column (B)
  const time = row[2]; // Time column (C)
  const player = row[3]; // Player column (D)
  const status = row[4]; // Status column (E)
  
  if (status !== 'offered') {
    throw new Error('Slot must be offered to be claimed');
  }
  
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  const now = new Date().toISOString();
  
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: `${SHEET_MARKETPLACE}!E${rowNumber}`,
          values: [['claimed']],
        },
        {
          range: `${SHEET_MARKETPLACE}!I${rowNumber}`,
          values: [[claimer]],
        },
        {
          range: `${SHEET_MARKETPLACE}!J${rowNumber}`,
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
    if (normalizeDate(rowDate) === normalizeDate(date) && rowTime === time) {
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

export async function claimFreeSpot({ date, time, claimer }: { date: string; time: string; claimer: string }) {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  const now = new Date().toISOString();
  const slotId = generateSlotId();
  
  // Add new entry to Marketplace for the claimed free spot
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: RANGE_SLOTS,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[slotId, date, time, 'free spot', 'claimed', 'no', '', '', claimer, now]],
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
    if (normalizeDate(rowDate) === normalizeDate(date) && rowTime === time) {
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
  
  return { success: true, slotId };
}

export async function retractSlotById({ slotId }: { slotId: string }) {
  const { row, rowNumber } = await findSlotById(slotId);
  
  const status = row[4]; // Status column (E)
  if (status !== 'offered') {
    throw new Error('Slot must be offered to be retracted');
  }
  
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  const now = new Date().toISOString();
  
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: `${SHEET_MARKETPLACE}!E${rowNumber}`,
          values: [['retracted']],
        },
        {
          range: `${SHEET_MARKETPLACE}!I${rowNumber}`,
          values: [['']],
        },
        {
          range: `${SHEET_MARKETPLACE}!J${rowNumber}`,
          values: [[now]],
        },
      ],
    },
  });
  return { success: true };
}



export async function settleSlotById({ slotId, requestingUser, adminMode = false }: { slotId: string; requestingUser: string; adminMode?: boolean }) {
  const { row, rowNumber } = await findSlotById(slotId);
  
  const date = row[1]; // Date column (B)
  const time = row[2]; // Time column (C)
  const player = row[3]; // Player column (D)
  const status = row[4]; // Status column (E)
  const swapRequested = row[5]; // SwapRequested column (F)
  const settled = row[10]; // Settled column (K)
  
  // Validate that slot can be settled
  if (!['claimed', 'reassigned', 'admin-reassigned'].includes(status)) {
    throw new Error('Slot must be claimed, reassigned, or admin-reassigned to be settled');
  }
  
  // Exclude swapped slots
  if (swapRequested === 'yes') {
    throw new Error('Swapped slots cannot be settled');
  }
  
  // Check if slot is in the past
  const [day, month] = date.split('.').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const slotDate = new Date(new Date().getFullYear(), month - 1, day, hour, minute);
  const now = new Date();
  
  if (slotDate > now) {
    throw new Error('Only past slots can be settled');
  }
  
  // Check permissions - only original owner or admin can settle
  if (!adminMode && requestingUser !== player) {
    throw new Error('Only the original slot owner or admins can settle slots');
  }
  
  const newSettledValue = settled === 'yes' ? 'no' : 'yes';
  
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: `${SHEET_MARKETPLACE}!K${rowNumber}`,
          values: [[newSettledValue]],
        },
      ],
    },
  });
  return { success: true, settled: newSettledValue === 'yes' };
}

/**
 * Finds a slot by its unique ID
 */
export async function findSlotById(slotId: string) {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: RANGE_SLOTS,
  });
  const values = res.data.values || [];
  const header = values[0];
  const rows = values.slice(1);
  const idx = rows.findIndex(row => row[0] === slotId);
  if (idx === -1) throw new Error('Slot not found');
  return { row: rows[idx], rowNumber: idx + 2, header };
}

/**
 * Migrates existing slots to include unique IDs
 * This function adds IDs to slots that don't have them
 */
export async function migrateExistingSlots() {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  
  // Read all existing slots
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: RANGE_SLOTS,
  });
  const values = res.data.values || [];
  const header = values[0];
  const rows = values.slice(1);
  
  // Generate IDs for slots that don't have them
  const updates: any[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Check if slot already has an ID (column A)
    if (!row[0] || row[0] === '') {
      const newId = generateSlotId();
      updates.push({
        range: `${SHEET_MARKETPLACE}!A${i + 2}`, // +2 for header and 1-based index
        values: [[newId]]
      });
    }
  }
  
  // Apply all updates
  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      }
    });
  }
  
  return { success: true, updatedCount: updates.length };
}

export async function updateExpiredSlots(expiredSlots: any[]) {
  if (!expiredSlots || !Array.isArray(expiredSlots) || expiredSlots.length === 0) {
    return { success: true, message: "No slots to update" };
  }

  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  
  // Read the current slots data to find row numbers
  let response;
  try {
    response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: RANGE_SLOTS,
    });
  } catch (error) {
    console.error('Error calling Google Sheets API:', error);
    throw new Error('Failed to read sheet data');
  }

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    throw new Error('No data found');
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  // Find column indices
  const dateColIndex = headers.findIndex((h: string) => h === 'Date');
  const timeColIndex = headers.findIndex((h: string) => h === 'Time');
  const playerColIndex = headers.findIndex((h: string) => h === 'Player');
  const statusColIndex = headers.findIndex((h: string) => h === 'Status');

  if (dateColIndex === -1 || timeColIndex === -1 || playerColIndex === -1 || statusColIndex === -1) {
    throw new Error('Required columns not found');
  }

  const updates: any[] = [];

  // For each expired slot, find the corresponding row and update it
  expiredSlots.forEach((slot: any) => {
    const rowIndex = dataRows.findIndex((row: any[]) => {
      const rowDate = row[dateColIndex];
      const rowTime = row[timeColIndex];
      const rowPlayer = row[playerColIndex];
      const rowStatus = row[statusColIndex];
      
      return normalizeDate(rowDate) === normalizeDate(slot.Date) && 
             rowTime === slot.Time && 
             rowPlayer === slot.Player &&
             rowStatus === 'offered';
    });

    if (rowIndex !== -1) {
      const columnLetter = String.fromCharCode(65 + statusColIndex);
      const range = `${SHEET_MARKETPLACE}!${columnLetter}${rowIndex + 2}`;
      
      updates.push({
        range: range,
        values: [['expired']]
      });
    }
  });

  // Apply all updates if there are any
  if (updates.length > 0) {
    try {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: updates
        }
      });
    } catch (error) {
      console.error('Error updating sheet:', error);
      throw new Error('Failed to update sheet data');
    }
  }

  return { 
    success: true, 
    updatedCount: updates.length,
    message: `Updated ${updates.length} slots to expired status`
  };
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

export async function acceptSlotSwapById({ slotId, acceptingPlayer }: { slotId: string; acceptingPlayer: string }) {
  const { row, rowNumber } = await findSlotById(slotId);
  
  const date = row[1]; // Date column (B)
  const time = row[2]; // Time column (C)
  const player = row[3]; // Player column (D)
  const status = row[4]; // Status column (E)
  const swapRequested = row[5]; // SwapRequested column (F)
  const requestedDate = row[6]; // RequestedDate column (G)
  const requestedTime = row[7]; // RequestedTime column (H)
  
  if (status !== 'offered' || swapRequested !== 'yes') {
    throw new Error('Slot must be offered with swap requested to accept swap');
  }
  
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  const now = new Date().toISOString();
  
  // Update Status (E), ClaimedBy (I), Timestamp (J)
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `${SHEET_MARKETPLACE}!E${rowNumber}`, values: [['claimed']] },
        { range: `${SHEET_MARKETPLACE}!I${rowNumber}`, values: [[acceptingPlayer]] },
        { range: `${SHEET_MARKETPLACE}!J${rowNumber}`, values: [[now]] },
      ],
    },
  });

  // --- Swap players in Daily schedule sheet ---
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
    if (normalizeDate(rowDate) === normalizeDate(date) && rowTime === time) {
      offerRowIdx = i;
      offerPlayers = (playerList || '').split(',').map((p: string) => p.trim()).filter(Boolean);
    }
    if (normalizeDate(rowDate) === normalizeDate(requestedDate) && rowTime === requestedTime) {
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

export async function requestSlotSwapFromSchedule({ date, time, player, requestedDate, requestedTime }: { date: string; time: string; player: string; requestedDate: string; requestedTime: string; }) {
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;
  const now = new Date().toISOString();
  const slotId = generateSlotId();
  
  // First, create a marketplace entry for the slot being offered for swap
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: RANGE_SLOTS,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[slotId, date, time, player, 'offered', 'yes', requestedDate, requestedTime, '', now]],
    },
  });
  
  return { success: true, slotId };
}
