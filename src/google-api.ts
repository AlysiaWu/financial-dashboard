import debug from "debug";
import fs from "fs";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import readline from "readline";

const logger = debug("google");

// If modifying these scopes, delete token.json.
const SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
];

const TOKEN_PATH = "./config/token.json";
const CRED_PATH = "./config/client_secret.json";

interface ICredentials {
    installed: {
        client_secret: string;
        client_id: string;
        redirect_uris: string;
    };
}

interface IFile {
    id: string;
    name: string;
}

interface ISheetClient {
    getContent: (sheetId: string, range?: string) => Promise<string[]>;
    getSheets: (query?: string) => Promise<IFile[]>;
    writeContent: (spreadsheetId: string, range: string, values: string[][]) => Promise<boolean>;
}

// Load client secrets from a local file.
export function getClient(): Promise<ISheetClient> {
    return new Promise((resolve, reject) => {
        fs.readFile(CRED_PATH, "utf8", (err, content) => {
            if (err) {
                logger("Error loading client secret file:", err);
                reject(err);
            }
            // Authorize a client with credentials, then call the Google Sheets API.
            const credObj = JSON.parse(content);
            authorize(credObj).then((oAuth2Client) => {
                const client = clientFactory(oAuth2Client);
                resolve(client);
            });
        });
    });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 */
function authorize(credentials: ICredentials): Promise<OAuth2Client> {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    return new Promise((resolve, reject) => {
        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, "utf8", (err, token) => {
            if (err) {
                getNewToken(oAuth2Client).then(resolve);
            } else {
                oAuth2Client.setCredentials(JSON.parse(token));
                resolve(oAuth2Client);
            }
        });
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 */
function getNewToken(oAuth2Client: OAuth2Client): Promise<OAuth2Client> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
    });
    logger("Authorize this app by visiting this url:", authUrl);

    rl.question("Enter the code from that page here: ", (code: string) => {
        rl.close();
        oAuth2Client.getToken({code}, (err, token) => {
          if (err) {
              logger("Error while trying to retrieve access token", err);
              reject(err);
          }
          if (token) {
              oAuth2Client.setCredentials(token);
              // Store the token to disk for later program executions
              fs.writeFile(TOKEN_PATH, JSON.stringify(token), (tokenErr) => {
                if (tokenErr) {
                    logger(tokenErr);
                    reject(tokenErr);
                }
                logger("Token stored to", TOKEN_PATH);
              });
              resolve(oAuth2Client);
          }
        });
      });
  });
}

function clientFactory(auth: OAuth2Client): ISheetClient {
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
