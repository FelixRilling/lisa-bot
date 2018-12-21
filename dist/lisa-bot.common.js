'use strict';

var cliNgy = require('cli-ngy');
var diNgy = require('di-ngy');
var lightdash = require('lightdash');
var logby = require('logby');
var chevronjs = require('chevronjs');
var moment = require('moment');
var PromiseQueue = require('promise-queue');

const IMAGE_LINK = "http://static.tumblr.com/df323b732955715fe3fb5a506999afc7/" +
    "rflrqqy/H9Cnsyji6/tumblr_static_88pgfgk82y4ok80ckowwwwow4.jpg";
const aboutFn = (args, argsAll, msg, dingy) => {
    return {
        val: [
            "Hello!",
            "I am Lisa, an indoor plant, inspired by Lisa from 'Life is Strange'.",
            "<http://dontnodentertainment.wikia.com/wiki/Lisa_the_Plant>",
            dingy.config.strings.separator,
            "For more information, use `$help` or go to <https://github.com/FelixRilling/lisa-bot>.",
            "If you have questions or want to report a bug, message my creator: NobodyRocks#5051."
        ].join("\n"),
        files: [IMAGE_LINK]
    };
};
const about = {
    fn: aboutFn,
    args: [],
    alias: ["info"],
    data: {
        hidden: false,
        usableInDMs: true,
        powerRequired: 0,
        help: "Shows info about this bot."
    }
};

const inviteFn = () => [
    "I'm always happy to join new servers!",
    "If you want me to join your server, follow this link: ",
    "<https://discordapp.com/oauth2/authorize?&client_id=263671526279086092&scope=bot>"
].join("\n");
const invite = {
    fn: inviteFn,
    args: [],
    alias: ["join"],
    data: {
        hidden: false,
        usableInDMs: true,
        powerRequired: 0,
        help: "Add Lisa to your server."
    }
};

const lisaChevron = new chevronjs.Chevron();

const MIN_WATER = 0.1;
const MAX_WATER = 150;
const MIN_HAPPINESS = 0.1;
const MAX_HAPPINESS = 100;
const FACTOR = (MAX_WATER + MAX_HAPPINESS) / 2;
class LisaStatusService {
    modify(lisaData, username, modifierWater, modifierHappiness) {
        if (!lisaData.life.isAlive) {
            return lisaData;
        }
        const result = lightdash.objFromDeep(lisaData);
        result.status.water += modifierWater;
        if (result.status.water > MAX_WATER) {
            return this.kill(result, username, "drowning" /* DROWNING */);
        }
        if (result.status.water < MIN_WATER) {
            return this.kill(result, username, "dehydration" /* DEHYDRATION */);
        }
        result.status.happiness += modifierHappiness;
        if (result.status.happiness > MAX_HAPPINESS) {
            result.status.happiness = MAX_HAPPINESS;
        }
        if (result.status.happiness < MIN_HAPPINESS) {
            return this.kill(result, username, "loneliness" /* LONELINESS */);
        }
        this.updateHighScoreIfRequired(lisaData);
        return result;
    }
    getLifetime(lisaData) {
        if (!lisaData.life.isAlive) {
            return lisaData.life.death - lisaData.life.birth;
        }
        return Date.now() - lisaData.life.birth;
    }
    getTimeSinceDeath(lisaData) {
        return Date.now() - lisaData.life.death;
    }
    getHighScore(lisaData) {
        this.updateHighScoreIfRequired(lisaData);
        return lisaData.score.highScore;
    }
    getRelativeState(lisaData) {
        const relWater = lisaData.status.water / MAX_WATER;
        const relHappiness = lisaData.status.happiness / MAX_HAPPINESS;
        return relWater * relHappiness * FACTOR;
    }
    kill(lisaData, username, deathThrough) {
        lisaData.life.isAlive = false;
        lisaData.life.death = Date.now();
        lisaData.life.deathThrough = deathThrough;
        lisaData.life.killer = username;
        this.updateHighScoreIfRequired(lisaData);
        return lisaData;
    }
    updateHighScoreIfRequired(lisaData) {
        const score = this.getLifetime(lisaData);
        if (score > lisaData.score.highScore) {
            lisaData.score.highScore = score;
        }
    }
}
lisaChevron.set("factory" /* FACTORY */, [], LisaStatusService);

const DELIMITER = "\n";
const RELATIVE_STATE_GOOD = 90;
const RELATIVE_STATE_OK = 40;
class LisaStringifyService {
    constructor(lisaStatusService) {
        this.lisaStatusService = lisaStatusService;
    }
    stringifyStatus(lisaData) {
        const statusShort = `Lisa is ${this.stringifyStatusShort(lisaData)}`;
        const score = this.stringifyScore(lisaData);
        let text = [];
        if (!lisaData.life.isAlive) {
            const humanizedTimeSinceDeath = this.humanizeDuration(this.lisaStatusService.getTimeSinceDeath(lisaData));
            const humanizedLifetime = this.humanizeDuration(this.lisaStatusService.getLifetime(lisaData));
            text = [
                `Lisa died ${humanizedTimeSinceDeath} ago, and was alive for ${humanizedLifetime}.`,
                `She was killed by ${lisaData.life.killer} through ${lisaData.life.deathThrough}.`
            ];
        }
        else {
            const waterLevel = Math.floor(lisaData.status.water);
            const happinessLevel = Math.floor(lisaData.status.happiness);
            text = [`Water: ${waterLevel}% | Happiness: ${happinessLevel}%.`];
        }
        return [statusShort, ...text, score].join(DELIMITER);
    }
    stringifyStatusShort(lisaData) {
        if (!lisaData.life.isAlive) {
            return "is dead.";
        }
        const relativeState = this.lisaStatusService.getRelativeState(lisaData);
        if (relativeState > RELATIVE_STATE_GOOD) {
            return "doing great.";
        }
        if (relativeState > RELATIVE_STATE_OK) {
            return "doing fine.";
        }
        return "close to dying.";
    }
    stringifyScore(lisaData) {
        const humanizedCurrentScore = this.humanizeDuration(this.lisaStatusService.getLifetime(lisaData));
        const humanizedHighScore = this.humanizeDuration(this.lisaStatusService.getHighScore(lisaData));
        const currentScoreTense = lisaData.life.isAlive
            ? "Current lifetime"
            : "Lifetime";
        return `${currentScoreTense}: ${humanizedCurrentScore} | Best lifetime: ${humanizedHighScore}.`;
    }
    humanizeDuration(duration) {
        return moment.duration(duration).humanize();
    }
}
lisaChevron.set("factory" /* FACTORY */, [LisaStatusService], LisaStringifyService);

class LisaController {
    constructor(store, lisaStatusService, lisaStringifyService) {
        this.store = store;
        this.lisaStatusService = lisaStatusService;
        this.lisaStringifyService = lisaStringifyService;
        if (store.has(LisaController.STORE_KEY)) {
            this.lisaData = store.get(LisaController.STORE_KEY);
        }
        else {
            this.lisaData = LisaController.createNewLisa();
        }
    }
    static createNewLisa() {
        return {
            status: {
                water: 100,
                happiness: 100
            },
            life: {
                isAlive: true,
                killer: "Anonymous",
                deathThrough: "something unknown" /* UNKNOWN */,
                birth: Date.now(),
                death: 0
            },
            score: {
                highScore: 0
            }
        };
    }
    modify(username, modifierWater, modifierHappiness) {
        this.lisaData = this.lisaStatusService.modify(this.lisaData, username, modifierWater, modifierHappiness);
        this.store.set(LisaController.STORE_KEY, this.lisaData);
    }
    stringifyStatus() {
        return this.lisaStringifyService.stringifyStatus(this.lisaData);
    }
    stringifyStatusShort() {
        return this.lisaStringifyService.stringifyStatusShort(this.lisaData);
    }
    isAlive() {
        return this.lisaData.life.isAlive;
    }
    reset() {
        this.lisaData = LisaController.createNewLisa();
    }
}
LisaController.STORE_KEY = "lisa";
lisaChevron.set("factory" /* FACTORY */, ["_LISA_STORAGE" /* STORAGE */, LisaStatusService, LisaStringifyService], LisaController);

const statusFn = () => {
    const lisaController = lisaChevron.get(LisaController);
    return lisaController.stringifyStatus();
};
const status = {
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

const waterFn = (args, argsAll, msg) => {
    const lisaController = lisaChevron.get(LisaController);
    lisaController.modify(msg.author.username, 25, 0);
    return "Watering...";
};
const water = {
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

/**
 * Logby instance used by Di-ngy.
 */
const lisaBotLogby = new logby.Logby();

const eachOption = (options, letters, fn) => {
    let i = 0;
    while (i < options.length && i < letters.length) {
        fn(options[i], letters[i], i);
        i++;
    }
};

const MAX_QUEUE_SIZE = 20;
const logger = lisaBotLogby.getLogger("addReactions");
const addReactions = (options, icons, msgSent) => {
    const queue = new PromiseQueue(1, MAX_QUEUE_SIZE);
    eachOption(options, icons, (option, icon) => {
        queue
            .add(() => msgSent.react(icon[1]))
            .catch(e => logger.error("Could not react to message.", e));
    });
};

const UNICODE_POS_A = 0x1f1e6;
const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
const createLetterEmoji = (letter) => {
    const index = LETTERS.indexOf(letter.toLowerCase());
    if (index === -1) {
        throw new Error("Letter is not in range.");
    }
    return String.fromCodePoint(UNICODE_POS_A + index);
};

const YES_OR_NO_ICONS = [
    ["Y", createLetterEmoji("Y")],
    ["N", createLetterEmoji("N")]
];
const yesOrNoFn = (args, argsAll, msg, dingy) => {
    return {
        val: [
            `${args.get("question")}`,
            dingy.config.strings.separator,
            "Y/N?"
        ].join("\n"),
        code: "yaml",
        onSend: msgSent => {
            if (!Array.isArray(msgSent)) {
                addReactions(new Array(2), YES_OR_NO_ICONS, msgSent);
            }
        }
    };
};
const yesOrNo = {
    fn: yesOrNoFn,
    args: [
        {
            name: "question",
            required: true
        }
    ],
    alias: ["y/n"],
    data: {
        hidden: false,
        usableInDMs: true,
        powerRequired: 0,
        help: 'Creates a poll with "yes" and "no" as answers.'
    }
};

const ALPHABET_ICONS = [
    ["A", createLetterEmoji("A")],
    ["B", createLetterEmoji("B")],
    ["C", createLetterEmoji("C")],
    ["D", createLetterEmoji("D")],
    ["E", createLetterEmoji("E")],
    ["F", createLetterEmoji("F")],
    ["G", createLetterEmoji("G")],
    ["H", createLetterEmoji("H")],
    ["I", createLetterEmoji("I")],
    ["J", createLetterEmoji("J")],
    ["K", createLetterEmoji("K")],
    ["L", createLetterEmoji("L")],
    ["M", createLetterEmoji("M")],
    ["N", createLetterEmoji("N")],
    ["O", createLetterEmoji("O")],
    ["P", createLetterEmoji("P")],
    ["Q", createLetterEmoji("Q")],
    ["R", createLetterEmoji("R")],
    ["S", createLetterEmoji("S")],
    ["T", createLetterEmoji("T")]
];
const pollFn = (args, argsAll, msg, dingy) => {
    const options = argsAll.slice(1);
    const result = [`${args.get("question")}`, dingy.config.strings.separator];
    eachOption(options, ALPHABET_ICONS, (option, icon) => {
        result.push(`${icon[0]}: ${option}`);
    });
    return {
        val: result.join("\n"),
        code: "yaml",
        onSend: msgSent => {
            if (!Array.isArray(msgSent)) {
                addReactions(options, ALPHABET_ICONS, msgSent);
            }
        }
    };
};
const poll = {
    fn: pollFn,
    args: [
        {
            name: "question",
            required: true
        },
        {
            name: "option1",
            required: true
        },
        {
            name: "option2",
            required: true
        }
    ],
    alias: ["vote", "v"],
    data: {
        hidden: false,
        usableInDMs: true,
        powerRequired: 0,
        help: "Creates a poll to vote on."
    },
    sub: {
        yesOrNo
    }
};

const COMMANDS = {
    /*
     * Core
     */
    about,
    invite,
    /*
     * Lisa
     */
    status,
    water,
    /*
     * Poll
     */
    poll
};

const ADMIN_ID = "128985967875850240";
const ADMIN_ROLE = {
    check: (msg) => msg.author.id === ADMIN_ID,
    power: 999
};
const createConfig = (prefix) => {
    return {
        prefix,
        roles: [diNgy.DEFAULT_ROLE, ADMIN_ROLE],
        answerToMissingCommand: false,
        answerToMissingArgs: true,
        answerToMissingPerms: true
    };
};

const TICK_INTERVAL = 5000;
const logger$1 = lisaBotLogby.getLogger("LisaListeners");
const initTickInterval = () => {
    const lisaController = lisaChevron.get(LisaController);
    setInterval(() => {
        lisaController.modify("Time", -1, -1);
    }, TICK_INTERVAL);
};
const increaseHappiness = () => {
    const lisaController = lisaChevron.get(LisaController);
    lisaController.modify("Activity", 0, 0.1);
};
const onConnect = () => {
    logger$1.trace("Running onConnect.");
    initTickInterval();
};
const onMessage = () => {
    logger$1.trace("Running onMessage.");
    increaseHappiness();
};

const PRODUCTION_ENABLED = process.env.NODE_ENV === "production";
const DISCORD_TOKEN = PRODUCTION_ENABLED
    ? process.env.DISCORD_TOKEN
    : process.env.DISCORD_TOKEN_TEST;
const PREFIX = PRODUCTION_ENABLED ? "$" : "$$$";
const LOG_LEVEL = PRODUCTION_ENABLED ? logby.Levels.INFO : logby.Levels.TRACE;
if (lightdash.isNil(DISCORD_TOKEN)) {
    throw new Error("No token set.");
}
diNgy.dingyLogby.setLevel(LOG_LEVEL);
cliNgy.clingyLogby.setLevel(LOG_LEVEL);
lisaBotLogby.setLevel(LOG_LEVEL);
const logger$2 = lisaBotLogby.getLogger("LisaBot");
logger$2.info(`Starting in ${process.env.NODE_ENV} mode.`);
logger$2.info(`Using prefix '${PREFIX}'.`);
const lisaBot = new diNgy.Dingy(COMMANDS, createConfig(PREFIX));
lisaBot.client.on("message", onMessage);
lisaChevron.set("plain" /* PLAIN */, [], lisaBot.jsonStorage, "_LISA_STORAGE" /* STORAGE */);
lisaBot
    .connect(DISCORD_TOKEN)
    .then(() => {
    logger$2.info("LisaBot started successfully.");
    onConnect();
})
    .catch(e => logger$2.error("An unexpected error occurred.", e));
