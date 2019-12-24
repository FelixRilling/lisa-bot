var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { DefaultBootstrappings, Injectable } from "chevronjs";
import { chevron } from "../../chevron";
import { LisaStatusService } from "./LisaStatusService";
const RELATIVE_STATE_GOOD = 90;
const RELATIVE_STATE_OK = 40;
let LisaTextService = class LisaTextService {
    constructor(lisaStatusService) {
        this.lisaStatusService = lisaStatusService;
    }
    determineStatusLabel(state) {
        if (!this.lisaStatusService.isAlive(state)) {
            return "is dead.";
        }
        const relativeState = this.lisaStatusService.getRelativeIndex(state);
        if (relativeState > RELATIVE_STATE_GOOD) {
            return "doing great.";
        }
        if (relativeState > RELATIVE_STATE_OK) {
            return "doing fine.";
        }
        return "close to dying.";
    }
};
LisaTextService = __decorate([
    Injectable(chevron, {
        bootstrapping: DefaultBootstrappings.CLASS,
        dependencies: [LisaStatusService]
    }),
    __metadata("design:paramtypes", [LisaStatusService])
], LisaTextService);
export { LisaTextService };
//# sourceMappingURL=LisaTextService.js.map