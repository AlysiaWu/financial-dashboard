import debug from "debug";

import moment from "moment";

import * as Plaid from "./lib/plaid-client";

import { default as PlaidClient } from "./lib/plaid-client";

import { IPersistance } from "./persistance";

import { IBalance } from "./persistance/balance-store";
import { ILink } from "./persistance/link-store";

export { ISheet } from "./lib/google-sheet-api";

const logger = debug("balances");

const plaidAccountToBalance = (item: Plaid.Item, acct: Plaid.Account): IBalance => ({
    balance: acct.balances.current,
    date: moment().format("YYYY-MM-DD"),
    id: acct.account_id,
    institutionId: item.institution_id,
    name: acct.name || "",
    type: acct.type || "",
} as IBalance);

const getLinkBalances = (db: IPersistance) => async (link: ILink) => {
    const plaid = await PlaidClient(link.accessToken);

    // const results = await plaid.getItem(accessToken);
    // const results = await plaid.getTransactionsFor30Days(accessToken);

    const results = await plaid.getAccounts();
    const accounts = results.accounts.map((acct) => plaidAccountToBalance(results.item, acct));
    logger(JSON.stringify(accounts));
    return accounts;
};

export default async (db: IPersistance) => {
    try {
        const links = await db.getLinkStore().getAll();
        logger(`number of links: ${links.length}`);
        const balances = await Promise.all(links.map(getLinkBalances(db)));
        const allBalances = balances.reduce((prev, curr) => prev.concat(curr), []);
        return db.getBalanceStore().save(allBalances);
    } catch (err) {
        logger(err);
    }
};
