import { resolvedArgumentMap } from "cli-ngy/types/argument/resolvedArgumentMap";
import { commandFn } from "di-ngy/types/command/commandFn";
import { IDingyCommand } from "di-ngy/types/command/IDingyCommand";
import { Message } from "discord.js";
import { lisaChevron } from "../../di";
import { LisaController } from "./lib/LisaController";
import { toFullName } from "di-ngy/src/util/toFullName";

const waterFn: commandFn = (
    args: resolvedArgumentMap,
    argsAll: string[],
    msg: Message
) => {
    const lisaController: LisaController = lisaChevron.get(LisaController);

    return lisaController.performAction(
        toFullName(msg.author),
        25,
        0,
        [
            "_Is being watered_",
            "_Water splashes._",
            "_Watering noises._",
            "You hear lisa sucking up the water."
        ],
        ["It's too late to water poor Lisa..."]
    );
};

const water: IDingyCommand = {
    fn: waterFn,
    args: [],
    alias: [],
    data: {
        hidden: false,
        usableInDMs: false,
        powerRequired: 0,
        help: "Waters lisa."
    }
};

export { water };
