import { client } from "./plaidClient";

client.sandboxPublicTokenCreate("ins_109508", ["identity", "auth"])
    .then((resp) => client.exchangePublicToken(resp.public_token))
    .then((resp) => client.getAccounts(resp.access_token))
    // tslint:disable-next-line:no-console
    .then((results) => console.dir(results, {depth: null}))
    // tslint:disable-next-line:no-console
    .catch((err) => console.dir(err));
