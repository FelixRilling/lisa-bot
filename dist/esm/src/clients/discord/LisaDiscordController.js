var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LisaDiscordController_1;
import { DefaultBootstrappings, Injectable } from "chevronjs";
import { throttleTime } from "rxjs/operators";
import { chevron } from "../../chevron";
import { LisaTextService } from "../../lisa/service/LisaTextService";
import { LisaStateController } from "../../lisa/LisaStateController";
import { rootLogger } from "../../logger";
import { LisaDiscordClient } from "./LisaDiscordClient";
const createPresence = (name) => ({
    game: {
        name
    }
});
let LisaDiscordController = LisaDiscordController_1 = class LisaDiscordController {
    constructor(lisaStateController, lisaDiscordClient, lisaTextService) {
        this.lisaStateController = lisaStateController;
        this.lisaDiscordClient = lisaDiscordClient;
        this.lisaTextService = lisaTextService;
    }
    bindEvents() {
        this.lisaDiscordClient.getCommandoClient().on("message", message => {
            if (!message.system && !message.author.bot) {
                this.onMessage();
            }
        });
        this.lisaStateController.stateChangeSubject
            .pipe(throttleTime(LisaDiscordController_1.PRESENCE_UPDATE_THROTTLE_TIMEOUT))
            .subscribe(() => this.onStateChange());
        this.onStateChange();
    }
    onMessage() {
        LisaDiscordController_1.logger.silly("A message was sent, increasing happiness.");
        this.lisaStateController.setHappiness(this.lisaStateController.getHappiness() +
            LisaDiscordController_1.MESSAGE_HAPPINESS_MODIFIER);
    }
    onStateChange() {
        const presence = createPresence(this.lisaTextService.determineStatusLabel(this.lisaStateController.getStateCopy()));
        this.lisaDiscordClient
            .getCommandoClient()
            .user.setPresence(presence)
            .then(() => LisaDiscordController_1.logger.debug("Updated presence."))
            .catch(e => LisaDiscordController_1.logger.error("Could not update presence.", e));
    }
};
LisaDiscordController.logger = rootLogger.child({
    service: LisaDiscordController_1
});
LisaDiscordController.PRESENCE_UPDATE_THROTTLE_TIMEOUT = 10000;
LisaDiscordController.MESSAGE_HAPPINESS_MODIFIER = 0.25;
LisaDiscordController = LisaDiscordController_1 = __decorate([
    Injectable(chevron, {
        bootstrapping: DefaultBootstrappings.CLASS,
        dependencies: [LisaStateController, LisaDiscordClient, LisaTextService]
    }),
    __metadata("design:paramtypes", [LisaStateController,
        LisaDiscordClient,
        LisaTextService])
], LisaDiscordController);
export { LisaDiscordController };
//# sourceMappingURL=LisaDiscordController.js.map