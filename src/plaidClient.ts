import * as plaid from "plaid";

export const env = process.env.PLAID_ENV;

export const plaidEnv = env === "development" ? plaid.environments.development :
            env === "production" ? plaid.environments.production :
            plaid.environments.sandbox;

export const client = new plaid.Client(
    process.env.PLAID_CLIENT_ID || "",
    process.env.PLAID_SECRET || "",
    process.env.PLAID_PUBLIC_KEY || "",
    plaidEnv,
);
