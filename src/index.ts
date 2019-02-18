import moment from "moment";

import * as Plaid from "./lib/plaid-client";

import { default as PlaidClient } from "./lib/plaid-client";

import { getPersistance, IPersistance } from "./persistance";

import { IBalance } from "./persistance/balance-store";
import { ILink } from "./persistance/link-store";

export { ISheet } from "./lib/google-sheet-api";

// tslint:disable:no-console

const plaidAccountToBalance = (item: Plaid.Item, acct: Plaid.Account): IBalance => ({
    balance: acct.balances.current,
    date: moment().format("YYYY-MM-DD"),
    id: acct.account_id,
    institutionId: item.institution_id,
    name: acct.name || "",
    type: acct.type || "",
} as IBalance);

const saveLinkBalances = (db: IPersistance) => async (link: ILink) => {
    const store = db.getBalanceStore();

    const plaid = await PlaidClient(link.accessToken);

    // const results = await plaid.getItem(accessToken);
    // const results = await plaid.getTransactionsFor30Days(accessToken);

    const results = await plaid.getAccounts();
    const accounts = results.accounts.map((acct) => plaidAccountToBalance(results.item, acct));
    console.dir(accounts, {depth: null});
    return store.save(accounts);
};

const main = async (db: IPersistance) => {
    try {
        const linkSaver = saveLinkBalances(db);
        const links = await db.getLinkStore().getAll();
        const linkPromises = links.map(linkSaver);
        return Promise.all(linkPromises);
    } catch (err) {
        console.error(err);
    }
};

getPersistance().then(main).then(console.log).catch(console.error);
