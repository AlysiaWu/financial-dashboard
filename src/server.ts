import bodyParser from "body-parser";
import express from "express";

import { config } from "./config";
import { getClient } from "./lib/plaid-client";

import { getPersistance } from "./persistance";

// tslint:disable:no-console

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
  publicKey: config.plaid.publicKey,
}));

app.post("/get_access_token", (request, response, next) => {
  PUBLIC_TOKEN = request.body.public_token;
  console.dir(request.body, {depth: null});
  console.log(`public_token: ${PUBLIC_TOKEN}`);
  const client = getClient();
  client.exchangePublicToken(PUBLIC_TOKEN, async (error, tokenResponse) => {
    if (error != null) {
      const msg = "Could not exchange public_token!";
      console.log(`${msg}\n${JSON.stringify(error)}`);
      return response.json({error: msg});
    }
    ACCESS_TOKEN = tokenResponse.access_token;
    ITEM_ID = tokenResponse.item_id;
    console.log("Access Token: " + ACCESS_TOKEN);
    console.log("Item ID: " + ITEM_ID);
    response.json({error: false});

    getPersistance().then((db) => {
      const store = db.getLinkStore();
      store.save({
        accessToken: tokenResponse.access_token,
        itemId: tokenResponse.item_id,
      });
    });
  });
});

app.listen(8080);
console.log("Server is listening on port 8080");
