import debug from "debug";
import fs from "fs";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import readline from "readline";

const logger = debug("google");

const TOKEN_PATH = "./config/token.json";
const CRED_PATH = "./config/client_secret.json";

interface ICredentials {
    installed: {
        client_secret: string;
        client_id: string;
        redirect_uris: string;
    };
}

// Load client secrets from a local file.
export async function getClient(scopes: string[]): Promise<OAuth2Client> {
    const clientSecret = await readClientSecret();
    try {
        return authorize(clientSecret);
    } catch ( err ) {
        return getNewToken(scopes, clientSecret);
    }
}

const readClientSecret = (): Promise<ICredentials> => {
    return new Promise((resolve, reject) => {
        fs.readFile(CRED_PATH, "utf8", (err, content) => {
            if (err) {
                logger("Error loading client secret file:", err);
                reject(err);
            }
            // Authorize a client with credentials, then call the Google Sheets API.
            const credObj: ICredentials = JSON.parse(content);
            resolve(credObj);
        });
    });
};

const clientFromCredentials = (credentials: ICredentials): OAuth2Client => {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
};

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 */
const authorize = (credentials: ICredentials): Promise<OAuth2Client> => {
    return new Promise((resolve, reject) => {
        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, "utf8", (err, token) => {
            if (err) {
                logger("Token not found, generating new token");
                reject(err);
            } else {
                const oAuth2Client = clientFromCredentials(credentials);
                oAuth2Client.setCredentials(JSON.parse(token));
                resolve(oAuth2Client);
            }
        });
    });
};

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 */
const getNewToken = (scope: string[], credentials: ICredentials): Promise<OAuth2Client> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    const oAuth2Client = clientFromCredentials(credentials);
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope,
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
};
