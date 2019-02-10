import { config } from "./config";

import * as plaid from "plaid";

export const plaidEnv = config.plaid.env === "development" ? plaid.environments.development :
    config.plaid.env === "production" ? plaid.environments.production :
    plaid.environments.sandbox;

// tslint:disable-next-line:no-console
console.dir(config);

export const client = new plaid.Client(
    config.plaid.clientId || "",
    config.plaid.secret || "",
    config.plaid.publicKey || "",
    plaidEnv,
);
