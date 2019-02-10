interface IConfig {
    plaid: {
        clientId: string
        publicKey: string
        secret: string
        env: string,
    };
}

// tslint:disable:no-var-requires
export const config: IConfig = Object.assign(
    require("../config/default"),
    process.env.NODE_ENV === "development" ? require("../config/development") :
    process.env.NODE_ENV === "production" ? require("../config/production") :
    require("../config/sandbox"),
);
