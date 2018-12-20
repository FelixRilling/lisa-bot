import { InjectableType } from "chevronjs";
import { clingyLogby } from "cli-ngy";
import { Dingy, dingyLogby } from "di-ngy";
import { Message } from "discord.js";
import { isNil } from "lightdash";
import { Levels } from "logby";
import { COMMANDS } from "./commands";
import { createConfig } from "./config";
import { lisaChevron, LisaDiKeys } from "./di";
import { onConnect, onMessage } from "./lisaListeners";
import { lisaBotLogby } from "./logger";

const PRODUCTION_ENABLED = process.env.NODE_ENV === "production";
const DISCORD_TOKEN = PRODUCTION_ENABLED
    ? process.env.DISCORD_TOKEN
    : process.env.DISCORD_TOKEN_TEST;
const PREFIX = PRODUCTION_ENABLED ? "$" : "$$$";
const LOG_LEVEL = PRODUCTION_ENABLED ? Levels.INFO : Levels.TRACE;

if (isNil(DISCORD_TOKEN)) {
    throw new Error("No token set.");
}

dingyLogby.setLevel(LOG_LEVEL);
clingyLogby.setLevel(LOG_LEVEL);
lisaBotLogby.setLevel(LOG_LEVEL);
const logger = lisaBotLogby.getLogger("LisaBot");
logger.info(`Starting in ${process.env.NODE_ENV} mode.`);
logger.info(`Using prefix '${PREFIX}'.`);

const lisaBot = new Dingy(COMMANDS, createConfig(PREFIX));
lisaBot.client.on("message", onMessage);
lisaChevron.set(InjectableType.PLAIN, [], lisaBot.jsonStorage, LisaDiKeys.STORAGE);
lisaBot
    .connect(DISCORD_TOKEN)
    .then(() => {
        logger.info("LisaBot started successfully.");
        onConnect();
    })
    .catch(e => logger.error("An unexpected error occurred.", e));
