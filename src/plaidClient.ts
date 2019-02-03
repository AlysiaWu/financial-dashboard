import * as plaid from "plaid";

const env = process.env.PLAID_ENV === "development" ? plaid.environments.development :
            process.env.PLAID_ENV === "production" ? plaid.environments.production :
            plaid.environments.sandbox;

export const client = new plaid.Client(
    process.env.PLAID_CLIENT_ID || "",
    process.env.PLAID_SECRET || "",
    process.env.PLAID_PUBLIC_KEY || "",
    env,
);
