import debug from "debug";
import fs from "fs";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import readline from "readline";

const logger = debug("google");

interface IFile {
    id: string;
    name: string;
}
interface ISheetClient {
    getContent: (sheetId: string, range?: string) => Promise<string[]>;
    getSheets: (query?: string) => Promise<IFile[]>;
    writeContent: (spreadsheetId: string, range: string, values: string[][]) => Promise<boolean>;
}

export function clientFactory(auth: OAuth2Client): ISheetClient {
    return {
        getContent: (sheetId, range?) => getContent(auth, sheetId, range),
        getSheets: (query?) => getSheets(auth, query),
        writeContent: (spreadsheetId, range, values) => writeContent(auth, spreadsheetId, range, values),
    };
}

/**
 * Lists the names and IDs of up to 10 files.
 */
function getSheets(auth: OAuth2Client, query?: string): Promise<IFile[]> {
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
                logger("Files:");
                const ifiles = files.map((file) => {
                    logger(`${file.name} (${file.id})`);
                    return { id: file.id, name: file.name } as IFile;
                });
                resolve(ifiles);
            } else {
                logger("No files found.");
                reject(new Error("No files found."));
        }
        });
    });
}

function getContent(auth: OAuth2Client, spreadsheetId: string, range = "Sheet1!A1:A1"): Promise<string[]> {
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
            resolve(...rows);
        } else {
            logger("No data found.");
            reject(new Error("No data found."));
        }
      });
  });
}

function writeContent(auth: OAuth2Client, spreadsheetId: string, range: string, values: string[][]): Promise<boolean> {
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
}
