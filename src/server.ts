import bodyParser from "body-parser";
import express from "express";

import { config } from "./config";
import { getTransactionsFor30Days } from "./index";
import { client } from "./plaidClient";

// We store the access_token in memory - in production, store it in a secure
// persistent data store
let ACCESS_TOKEN = null;
let PUBLIC_TOKEN = null;
let ITEM_ID = null;

// Accept the public_token sent from Link
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, resp) => resp.render("../pages/index", {
  env: config.plaid.env,
  publicKey: process.env.PLAID_PUBLIC_KEY,
}));

app.post("/get_access_token", (request, response, next) => {
  PUBLIC_TOKEN = request.body.public_token;
  // tslint:disable-next-line:no-console
  console.dir(request.body, {depth: null});
  // tslint:disable-next-line:no-console
  console.log(`public_token: ${PUBLIC_TOKEN}`);
  client.exchangePublicToken(PUBLIC_TOKEN, async (error, tokenResponse) => {
    if (error != null) {
      const msg = "Could not exchange public_token!";
      // tslint:disable-next-line:no-console
      console.log(`${msg}\n${JSON.stringify(error)}`);
      return response.json({error: msg});
    }
    ACCESS_TOKEN = tokenResponse.access_token;
    ITEM_ID = tokenResponse.item_id;
    // tslint:disable-next-line:no-console
    console.log("Access Token: " + ACCESS_TOKEN);
    // tslint:disable-next-line:no-console
    console.log("Item ID: " + ITEM_ID);
    response.json({error: false});

    const trans = await getTransactionsFor30Days(ACCESS_TOKEN);
    // tslint:disable-next-line:no-console
    console.dir(trans, {depth: null});
  });
});

app.listen(8080);
