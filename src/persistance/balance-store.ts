import { getAllRows, saveRows, StoreFactory } from "./store";

export interface IBalance {
    date: string;
    institutionId: string;
    id: string;
    name: string;
    type: string;
    balance: number;
}

export const getBalanceStore: StoreFactory<IBalance> = (sheet, tabName) => () => Object.freeze({
    getAll: getAllRows(sheet, tabName, balanceFactory),
    save: saveRows(sheet, tabName, encodeBalance),
});

const balanceFactory = (index: number, data: string[]): IBalance => Object.freeze({
    balance: Number.parseFloat(data[5]),
    date: data[0],
    id: data[2],
    index,
    institutionId: data[1],
    name: data[3],
    type: data[4],
});

const encodeBalance = (_: IBalance) => [_.date, _.institutionId, _.id, _.name, _.type, _.balance.toString(10)];
