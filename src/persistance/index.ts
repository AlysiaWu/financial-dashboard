import { getClient } from "../lib/google-client";
import { clientFactory } from "../lib/google-sheet-api";
import { getBalanceStore, IBalance } from "./balance-store";
import { getLinkStore, ILink } from "./link-store";
import { IStore } from "./store";

const SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
];

export interface IPersistance {
    getBalanceStore: () => IStore<IBalance>;
    getLinkStore: () => IStore<ILink>;
}

export const getPersistance = async (): Promise<IPersistance> => {
    const sheet = await getSheet("Financial Dashboard");
    if (sheet) {
        return Object.freeze({
            getBalanceStore: getBalanceStore(sheet, "balances"),
            getLinkStore: getLinkStore(sheet, "links"),
        });
    } else {
        throw (new Error("Couldn't find sheet"));
    }
};

const getSheet = async (name: string) => {
    const oAuthClient = await getClient(SCOPES);
    const gClient = clientFactory(oAuthClient);
    const files = await gClient.getSheets(name);
    return files.length === 1 ? files[0] : undefined;
};
