import debug from "debug";
import { ISheet } from "../lib/google-sheet-api";

const logger = debug("store");

export interface IStore<T> {
    getAll: () => Promise<T[]>;
    save: (obj: T | T[]) => Promise<boolean | boolean[]>;
}

export type RowEncoder<T> = (_: T) => string[];
export type RowDecoder<T> = (idx: number, _: string[]) => T;
export type StoreFactory<T> = (sheet: ISheet, tabName: string) => () => IStore<T>;

export const getAllRows = <T>(sheet: ISheet, tabName: string, decoder: RowDecoder<T>) => async () => {
    const rows = await sheet.getContent(`${tabName}!A2:F100`);
    return rows.map((_, idx) => decoder(idx, _));
};

export const saveRows = <T>(sheet: ISheet, tabName: string, encoder: RowEncoder<T>) => (obj: T | T[]) => {
    const write = (_: string[][]) => sheet.writeContent(`${tabName}!A1:A1`, _);

    if (Array.isArray(obj)) {
        logger.log("got balance array");
        return write(obj.map(encoder));
    } else {
        logger.log("didn't get balance array");
        return write([encoder(obj)]);
    }
};
