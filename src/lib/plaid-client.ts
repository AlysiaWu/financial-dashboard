import moment from "moment";

import { config } from "../config";

import * as plaid from "plaid";

export * from "plaid";

const plaidDate = "YYYY-MM-DD";
const now = moment();
const today = now.format(plaidDate);

const plaidEnv = config.plaid.env === "development" ? plaid.environments.development :
    config.plaid.env === "production" ? plaid.environments.production :
    plaid.environments.sandbox;

export const getClient = () => new plaid.Client(
    config.plaid.clientId || "",
    config.plaid.secret || "",
    config.plaid.publicKey || "",
    plaidEnv,
);

export default async (accessToken: string) => {
    const client = getClient();
    const token = await getAccessToken(client, accessToken);

    return Object.freeze({
        getAccounts: getAccounts(client, token),
        getItem: getItem(client, token),
        getPublicToken: client.exchangePublicToken,
        getTransactionsFor30Days: getTransactionsFor30Days(client, token),
    });
};

const getAccessToken = async (client: plaid.Client, accessToken: string) => {
    const resp = await client.createPublicToken(accessToken);
    const token = await client.exchangePublicToken(resp.public_token);
    return token.access_token;
};

const getItem = (client: plaid.Client, accessToken: string) => async () => client.getItem(accessToken);

const getAccounts = (client: plaid.Client, accessToken: string) => () => client.getAccounts(accessToken);

const getTransactions = (client: plaid.Client, accessToken: string, startDate: string, endDate: string) =>
    client.getTransactions(accessToken, startDate, endDate, {
        count: 250,
        offset: 0,
    });

const getTransactionsFor30Days = (client: plaid.Client, token: string) => () => {
    const thirtyDaysAgo = now.subtract(30, "days").format(plaidDate);
    return getTransactions(client, token, thirtyDaysAgo, today);
};
