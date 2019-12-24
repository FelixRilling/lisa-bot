import { DefaultBootstrappings, Injectable } from "chevronjs";
import { cloneDeep } from "lodash";
import { Subject } from "rxjs";
import { chevron } from "../chevron";
import { rootLogger } from "../logger";
import {
    HAPPINESS_INITIAL,
    HAPPINESS_MAX,
    HAPPINESS_MIN,
    LisaDeathCause,
    LisaState,
    USER_SYSTEM,
    WATER_INITIAL,
    WATER_MAX,
    WATER_MIN
} from "./LisaState";
import { LisaStatusService } from "./service/LisaStatusService";

const createNewLisaState = (
    createdByUser: string,
    highScore = 0
): LisaState => {
    return {
        highScore,
        status: {
            water: WATER_INITIAL,
            happiness: HAPPINESS_INITIAL
        },
        life: {
            time: new Date(),
            byUser: createdByUser
        },
        death: {
            time: null,
            byUser: null,
            cause: null
        }
    };
};

@Injectable(chevron, {
    bootstrapping: DefaultBootstrappings.CLASS,
    dependencies: [LisaStatusService]
})
class LisaStateController {
    private static readonly logger = rootLogger.child({
        target: LisaStateController
    });

    public readonly stateChangeSubject: Subject<void>;
    private state: LisaState;

    constructor(private readonly lisaStatusService: LisaStatusService) {
        this.state = createNewLisaState(USER_SYSTEM);
        this.stateChangeSubject = new Subject<void>();
    }

    /**
     * Gets a copy of the state to process e.g. when creating text for the current status.
     *
     * @return copy of the current state.
     */
    public getStateCopy(): LisaState {
        return cloneDeep(this.state);
    }

    /**
     * Only used for loading od persisted data, do not use for regular state changes.
     *
     * @param state State to load.
     */
    public load(state: LisaState): void {
        this.state = state;
        this.stateChanged(USER_SYSTEM);
    }

    public replantLisa(byUser: string = USER_SYSTEM): void {
        LisaStateController.logger.debug(`'${byUser}' replanted lisa.`);

        this.state = createNewLisaState(byUser, this.state.highScore);
        this.stateChanged(byUser);
    }

    public killLisa(cause: LisaDeathCause, byUser: string = USER_SYSTEM): void {
        LisaStateController.logger.debug(
            `'${byUser}' killed lisa by ${cause}.`
        );

        this.state.death = { time: new Date(), byUser, cause };
        this.stateChanged(byUser);
    }

    public setWater(water: number, byUser: string = USER_SYSTEM): void {
        LisaStateController.logger.debug(
            `'${byUser}' set water from ${this.state.status.water} to ${water}.`
        );

        this.state.status.water = water;
        this.stateChanged(byUser);
    }

    public setHappiness(happiness: number, byUser: string = USER_SYSTEM): void {
        LisaStateController.logger.debug(
            `'${byUser}' set happiness from ${this.state.status.happiness} to ${happiness}.`
        );

        this.state.status.happiness = happiness;
        this.stateChanged(byUser);
    }

    private stateChanged(byUser: string): void {
        LisaStateController.logger.silly("Lisa state changed.");
        if (this.lisaStatusService.isAlive(this.getStateCopy())) {
            // Check stats if alive
            this.checkStats(byUser);
            // Check again to see if Lisa was killed through the update.
            if (!this.lisaStatusService.isAlive(this.getStateCopy())) {
                this.updateHighScoreIfRequired();
            }
        }

        this.stateChangeSubject.next();
    }

    private checkStats(byUser: string): void {
        if (this.state.status.water > WATER_MAX) {
            LisaStateController.logger.debug(
                `Water level ${this.state.status.water} is above limit of ${WATER_MAX} -> ${LisaDeathCause.DROWNING}.`
            );

            this.killLisa(LisaDeathCause.DROWNING, byUser);
        } else if (this.state.status.water < WATER_MIN) {
            LisaStateController.logger.debug(
                `Water level ${this.state.status.water} is below limit of ${WATER_MIN} -> ${LisaDeathCause.DEHYDRATION}.`
            );

            this.killLisa(LisaDeathCause.DEHYDRATION, byUser);
        }

        if (this.state.status.happiness > HAPPINESS_MAX) {
            LisaStateController.logger.debug(
                `Happiness level ${this.state.status.happiness} is above limit of ${HAPPINESS_MAX} -> reducing to limit.`
            );

            this.state.status.happiness = HAPPINESS_MAX;
        } else if (this.state.status.happiness < HAPPINESS_MIN) {
            LisaStateController.logger.debug(
                `Happiness level ${this.state.status.happiness} is below limit of ${HAPPINESS_MIN} -> ${LisaDeathCause.SADNESS}.`
            );

            this.killLisa(LisaDeathCause.SADNESS, byUser);
        }
    }

    private updateHighScoreIfRequired(): void {
        const lifetime = this.lisaStatusService.getLifetime(
            this.getStateCopy()
        );
        if (lifetime > this.state.highScore) {
            LisaStateController.logger.debug(
                `Increasing high score from ${this.state.highScore} to ${lifetime}.`
            );
            this.state.highScore = lifetime;
        }
    }
}

export { LisaStateController };
