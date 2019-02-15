import moment from "moment";

import { clientFactory as getPlaidClient } from "./lib/plaid-client";

import { getClient } from "./lib/google-client";
import { clientFactory } from "./lib/google-sheet-api";

// tslint:disable:no-console

const SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
];

const main = async () => {
    try {
        const plaid = await getPlaidClient("access-development-834bb25a-091e-46d5-adee-8d658a5c772c");

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
