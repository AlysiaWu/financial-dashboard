import { getAllRows, saveRows, StoreFactory } from "./store";

export interface ILink {
    accessToken: string;
    institutionId?: string;
    itemId: string;
}

export const getLinkStore: StoreFactory<ILink> = (sheet, tabName) => () => Object.freeze({
    getAll: getAllRows(sheet, tabName, linkFactory),
    save: saveRows(sheet, tabName, encodeLink),
});

const linkFactory = (index: number, data: string[]): ILink => Object.freeze({
    accessToken: data[2],
    index,
    institutionId: data[0],
    itemId: data[1],
});

const encodeLink = (link: ILink) => [link.institutionId || "", link.itemId, link.accessToken];
