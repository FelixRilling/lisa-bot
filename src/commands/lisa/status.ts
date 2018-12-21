import { commandFn } from "di-ngy/types/command/commandFn";
import { IDingyCommand } from "di-ngy/types/command/IDingyCommand";
import { Message } from "discord.js";
import { LisaController } from "./lib/LisaController";
import { lisaChevron } from "../../di";

const statusFn: commandFn = () => {
    const lisaController: LisaController = lisaChevron.get(LisaController);

    return lisaController.stringifyStatus();
};

const status: IDingyCommand = {
    fn: statusFn,
    args: [],
    alias: [],
    data: {
        hidden: false,
        usableInDMs: true,
        powerRequired: 0,
        help: "Shows lisa's status."
    }
};

export { status };
