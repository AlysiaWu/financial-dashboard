import { SandboxPublicTokenCreateResponse, TokenResponse } from "plaid";
import { client } from "./plaidClient";

import { clientFactory } from "./google-api";
import { getClient } from "./google-client";

import moment from "moment";

// tslint:disable:no-console

const SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
];

const getAccessToken = async (resp: SandboxPublicTokenCreateResponse) => {
    const token = await client.exchangePublicToken(resp.public_token);
    return token.access_token;
};

const getItem = async (accessToken: string) => {
    const item = await client.getItem(accessToken);
    console.dir(item);
    return accessToken;
};

const getAccounts = (accessToken: string) => client.getAccounts(accessToken);

const getTransactions = (startDate: string, endDate: string) => (accessToken: string) =>
    client.getTransactions(accessToken, startDate, endDate, {
        count: 250,
        offset: 0,
    });

const plaidDate = "YYYY-MM-DD";
const now = moment();
const thirtyDaysAgo = now.subtract(30, "days").format(plaidDate);
const today = now.format(plaidDate);

export const getTransactionsFor30Days = getTransactions(thirtyDaysAgo, today);

const main = async () => {
    try {
        const token = await client.createPublicToken("access-development-834bb25a-091e-46d5-adee-8d658a5c772c");
        const accessToken = await getAccessToken(token);

        // const results = await getItem(accessToken);
        // const results = await getTransactionsFor30Days(accessToken);

        const results = await getAccounts(accessToken);
        const accounts = results.accounts.map((acct) => [
            today,
            results.item.institution_id,
            acct.account_id,
            acct.name || "",
            acct.type || "",
            acct.balances.current ? String(acct.balances.current) : "",
        ]);
        console.dir(accounts, {depth: null});

        const oAuthClient = await getClient(SCOPES);
        const gClient = clientFactory(oAuthClient);
        const files = await gClient.getSheets("Financial Dashboard");
        if (files.length === 1) {
            const sheetId = files[0].id;
            // const content = await gClient.getContent(sheetId);
            const result = await gClient.writeContent(sheetId, "balances!A1:A1", accounts);
            console.dir(result, {depth: null});
        } else {
            console.error("more than one file found or no files found");
        }
    } catch (err) {
        console.error(err);
    }
};

main();
