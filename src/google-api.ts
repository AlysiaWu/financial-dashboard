import debug from "debug";
import fs from "fs";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import readline from "readline";

const logger = debug("google");

// If modifying these scopes, delete token.json.
const SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
];

const TOKEN_PATH = "./config/token.json";
const CRED_PATH = "./config/credentials.json";

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

// Load client secrets from a local file.
export function getClient(): Promise<any> {
    return new Promise((resolve, reject) => {
        fs.readFile(CRED_PATH, "utf8", (err, content) => {
            if (err) {
                logger("Error loading client secret file:", err);
                reject(err);
            }
            // Authorize a client with credentials, then call the Google Sheets API.
            resolve(authorize(JSON.parse(content)));
        });
    });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 */
function authorize(credentials: ICredentials): Promise<OAuth2Client> {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    return new Promise((resolve, reject) => {
        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, "utf8", (err, token) => {
            if (err) {
                resolve(getNewToken(oAuth2Client));
            }
            oAuth2Client.setCredentials(JSON.parse(token));
            resolve(oAuth2Client);
        });
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 */
function getNewToken(oAuth2Client: OAuth2Client): Promise<OAuth2Client> {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  logger("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve, reject) => {
      rl.question("Enter the code from that page here: ", (code) => {
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

/**
 * Lists the names and IDs of up to 10 files.
 */
export function listFiles(auth: OAuth2Client, q?: string): Promise<IFile[]> {
    const drive = google.drive({version: "v3", auth});
    return new Promise((resolve, reject) => {
        drive.files.list({
            fields: "nextPageToken, files(id, name)",
            pageSize: 20,
            q: q || "name = 'okrs' and mimeType = 'application/vnd.google-apps.folder'",
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

export function getContent(auth: OAuth2Client, spreadsheetId: string): Promise<string[]> {
  const sheets = google.sheets({version: "v4", auth});
  return new Promise((resolve, reject) => {
      sheets.spreadsheets.values.get({
        range: "Sheet1!A1:F7",
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
