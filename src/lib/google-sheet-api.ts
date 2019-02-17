import debug from "debug";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

const logger = debug("google");

export interface ISheet {
    getContent(range: string): Promise<string[][]>;
    writeContent(range: string, values: string[][]): Promise<boolean>;
}

export function clientFactory(auth: OAuth2Client) {
    return Object.freeze({
        getSheets: getSheets(auth),
    });
}

const sheetFactory = (auth: OAuth2Client, sheetId: string): ISheet => {
    return Object.freeze({
        getContent: getContent(auth, sheetId),
        writeContent: writeContent(auth, sheetId),
    });
};

/**
 * Lists the names and IDs of up to 10 files.
 */
const getSheets = (auth: OAuth2Client) => (query?: string): Promise<ISheet[]> => {
    const nameQuery = query ? `name contains '${query}' and` : "";
    const q = `${nameQuery} mimeType = 'application/vnd.google-apps.spreadsheet'`;

    const drive = google.drive({version: "v3", auth});

    return new Promise((resolve, reject) => {
        drive.files.list({
            fields: "nextPageToken, files(id, name)",
            pageSize: 20,
            q,
        }, async (err, res) => {
            if (err) {
                logger("The API returned an error: " + err);
                reject(err);
            } else if (res && res.data.files && res.data.files.length) {
                const files = res.data.files;
                logger(`Files: ${files.length}`);
                const ids = files.filter((_) => _.id).map((_) => _.id) as string[];
                const sheets = ids.map((_) => sheetFactory(auth, _));
                resolve(sheets);
            } else {
                logger("No files found.");
                reject(new Error("No files found."));
        }
        });
    });
};

const getContent = (auth: OAuth2Client, spreadsheetId: string) => (range = "Sheet1!A1:A1"): Promise<string[][]> => {
  const sheets = google.sheets({version: "v4", auth});
  return new Promise((resolve, reject) => {
      sheets.spreadsheets.values.get({
        range,
        spreadsheetId,
      }, (err, res) => {
        if (err) {
            logger("The API returned an error: " + err);
            reject(err);
        } else if (res && res.data.values && res.data.values.length) {
            const rows = res.data.values;
            resolve(rows);
        } else {
            logger("No data found.");
            reject(new Error("No data found."));
        }
      });
  });
};

const writeContent = (auth: OAuth2Client, spreadsheetId: string) =>
    (range: string, values: string[][]): Promise<boolean> => {

    const sheets = google.sheets({version: "v4", auth});
    return new Promise((resolve, reject) => {
        sheets.spreadsheets.values.append({
            range,
            requestBody: {
                values,
            },
            spreadsheetId,
            valueInputOption: "USER_ENTERED",
        }, (err) => {
            if (err) {
                logger(err);
                reject(err);
            } else {
                logger("write complete");
                resolve(true);
            }
        });
    });
};
