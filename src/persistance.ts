import { getClient } from "./lib/google-client";
import { clientFactory, ISheet } from "./lib/google-sheet-api";

const SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
];

export interface IPersistance {
    getLinkStore(): ITokenStore;
}

export interface ITokenStore {
    getAll(): Promise<IToken[]>;
}

export interface IToken {
    accessToken: string;
    institutionId: string;
    itemId: string;
    store(): Promise<boolean>;
}

export const getPersistance = async () => {
    const sheet = await getSheet("Financial Dashboard");
    if (sheet) {
        return persistanceFactory(sheet);
    } else {
        throw (new Error("Couldn't find sheet"));
    }
};

const persistanceFactory = (sheet: ISheet) => {
    return Object.freeze({
        getLinkStore: getLinkStore(sheet, "links"),
    }) as IPersistance;
};

const getSheet = async (name: string) => {
    const oAuthClient = await getClient(SCOPES);
    const gClient = clientFactory(oAuthClient);
    const files = await gClient.getSheets(name);
    return files.length === 1 ? files[0] : undefined;
};

const getLinkStore = (sheet: ISheet, tabName: string) => (): ITokenStore => {
    return Object.freeze({
        getAll: getAllLinks(sheet, tabName),
    });
};

const getAllLinks = (sheet: ISheet, tabName: string) => async () => {
    const rows = await sheet.getContent(`${tabName}!A2:C100`);
    return rows.map((_) => ({
        accessToken: _[2],
        institutionId: _[0],
        itemId: _[1],
    })) as IToken[];
};
