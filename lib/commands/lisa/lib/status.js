"use strict";

const score = require("./score");
const stringify = require("./stringify");
//const calc = require("./calc");

const _default = function () {
    return {
        water: 100,
        happiness: 100,
        isAlive: true,
        killer: null,
        deathBy: "something",
        birth: Date.now(),
        death: 0
    };
};

const get = function (app) {
    const lisa = app.dataPersisted.lisa;
    const statusCurrent = lisa.getKey("status") || _default();

    return statusCurrent;
};

const set = function (app, statusCurrent) {
    const lisa = app.dataPersisted.lisa;

    updateExternal(app, statusCurrent);

    lisa.setKey("status", statusCurrent);
    lisa.save(true);
};

const updateExternal = function (app, statusCurrent) {
    const statusCurrentText = stringify.floof(statusCurrent);
    /*const statusCurrentNumber = calc.statusToNumber(statusCurrent);
    let clientStatus;

    if (statusCurrentNumber > 75) {
        clientStatus = "online";
    } else if (statusCurrentNumber > 50) {
        clientStatus = "idle";
    } else if (statusCurrentNumber > 25) {
        clientStatus = "dnd";
    } else {
        clientStatus = "invisible";
    }

    app.bot.user.setStatus(clientStatus);*/
    app.bot.user.setGame(statusCurrentText);
};

const modify = function (app, statusCurrent, modifier, user) {
    let statusNew = statusCurrent;
    let deathBy = null;

    if (statusNew.isAlive) {
        if (modifier.water) {
            statusNew.water += modifier.water;

            if (statusNew.water > 150) {
                statusNew.happiness = 150;
                deathBy = "drowning";
            } else if (statusNew.water <= 0) {
                statusNew.happiness = 0;
                deathBy = "dehydration";
            }
        }

        if (modifier.happiness) {
            statusNew.happiness += modifier.happiness;

            if (statusNew.happiness <= 0) {
                statusNew.happiness = 0;
                deathBy = "loneliness";
            } else if (statusNew.happiness > 100) {
                statusNew.happiness = 100;
            }
        }

        if (deathBy !== null) {
            statusNew = kill(app, statusNew, deathBy, user);
        }

        set(app, statusNew);
    }

    return statusNew;
};

const kill = function (app, statusCurrent, deathBy, killer) {
    const scoreCurrent = score.get(app);
    const statusNew = Object.assign({}, statusCurrent);
    let scoreNew;

    statusNew.death = Date.now();
    statusNew.isAlive = false;
    statusNew.deathBy = deathBy;
    statusNew.killer = killer;

    scoreNew = statusNew.death - statusNew.birth;

    if (scoreNew > scoreCurrent.highscore) {
        scoreCurrent.highscore = scoreNew;
        score.set(app, scoreCurrent);
    }

    return statusNew;
};

module.exports = {
    _default,
    get,
    set,
    updateExternal,
    modify,
    kill
};
