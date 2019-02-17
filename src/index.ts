import moment from "moment";

import { default as PlaidClient } from "./lib/plaid-client";

import { getClient } from "./lib/google-client";
import { clientFactory } from "./lib/google-sheet-api";

import { getPersistance } from "./persistance";

export { ISheet } from "./lib/google-sheet-api";

// tslint:disable:no-console

const SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
];

export const getSheet = async () => {
    const oAuthClient = await getClient(SCOPES);
    const gClient = clientFactory(oAuthClient);
    const files = await gClient.getSheets("Financial Dashboard");
    return files.length === 1 ? files[0] : undefined;
};

const main = async () => {
    try {
        const links = await getLinks();
        const plaid = await PlaidClient(links[0].accessToken);

        // const results = await plaid.getItem(accessToken);
        // const results = await plaid.getTransactionsFor30Days(accessToken);

        const results = await plaid.getAccounts();
        const accounts = results.accounts.map((acct) => [
            moment().format("YYYY-MM-DD"),
            results.item.institution_id,
            acct.account_id,
            acct.name || "",
            acct.type || "",
            acct.balances.current ? String(acct.balances.current) : "",
        ]);
        console.dir(accounts, {depth: null});

        const file = await getSheet();
        if (file) {
            // const content = await gClient.getContent(sheetId);
            // const result = await file.writeContent("balances!A1:A1", accounts);
            const result = true;
            console.dir(result, {depth: null});
        } else {
            console.error("more than one file found or no files found");
        }
    } catch (err) {
        console.error(err);
    }
};

const getLinks = async () => {
    try {
        const db = await getPersistance();
        const store = db.getLinkStore();
        const tokens = await store.getAll();
        return tokens;
    } catch (err) {
        console.error(err);
        return [];
    }
};

main();
