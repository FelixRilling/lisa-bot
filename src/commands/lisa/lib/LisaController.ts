import { InjectableType } from "chevronjs";
import { Storage } from "di-ngy/dist/esm/src/storage/Storage";
import { randItem } from "lightdash";
import { lisaChevron, LisaDiKeys } from "../../../di";
import { lisaLogby } from "../../../logger";
import { Death } from "./Death";
import { ILisaData } from "./ILisaData";
import { LisaStatusService } from "./LisaStatusService";
import { LisaStringifyService } from "./LisaStringifyService";

class LisaController {
    private static readonly STORE_KEY = "lisa";
    private static readonly logger = lisaLogby.getLogger(LisaController);

    private readonly store: Storage<any>;
    private readonly lisaStatusService: LisaStatusService;
    private readonly lisaStringifyService: LisaStringifyService;
    private lisaData: ILisaData;

    constructor(
        store: Storage<any>,
        lisaStatusService: LisaStatusService,
        lisaStringifyService: LisaStringifyService
    ) {
        this.store = store;
        this.lisaStatusService = lisaStatusService;
        this.lisaStringifyService = lisaStringifyService;

        if (store.has(LisaController.STORE_KEY)) {
            LisaController.logger.info("Loading Lisa data from store.");
            this.lisaData = store.get(LisaController.STORE_KEY);
        } else {
            LisaController.logger.info("Creating new Lisa data.");
            this.lisaData = this.lisaStatusService.createNewLisa();
            this.save();
        }
    }

    public performAction(
        username: string,
        modifierWater: number,
        modifierHappiness: number,
        textSuccess: string[],
        textAlreadyDead: string[]
    ): string {
        if (!this.lisaData.life.isAlive) {
            return randItem(textAlreadyDead);
        }

        this.modify(username, modifierWater, modifierHappiness);

        return [randItem(textSuccess), this.stringifyStatus()].join("\n");
    }

    public performKill(
        username: string,
        deathThrough: Death,
        textSuccess: string[],
        textAlreadyDead: string[]
    ) {
        if (!this.lisaData.life.isAlive) {
            return randItem(textAlreadyDead);
        }

        this.lisaData = this.lisaStatusService.kill(
            this.lisaData,
            username,
            deathThrough
        );
        this.save();

        return [randItem(textSuccess), this.stringifyStatus()].join("\n");
    }

    public modify(
        username: string,
        modifierWater: number,
        modifierHappiness: number
    ): void {
        this.lisaData = this.lisaStatusService.modify(
            this.lisaData,
            username,
            modifierWater,
            modifierHappiness
        );
        this.save();
    }

    public stringifyStatus(): string {
        return this.lisaStringifyService.stringifyStatus(this.lisaData);
    }

    public stringifyStatusShort(): string {
        return this.lisaStringifyService.stringifyStatusShort(this.lisaData);
    }

    public isAlive(): boolean {
        return this.lisaData.life.isAlive;
    }

    public createNewLisa(): void {
        LisaController.logger.debug("Creating new Lisa.");
        this.lisaData = this.lisaStatusService.createNewLisa(this.lisaData);
        this.save();
    }

    private save() {
        this.store.set(LisaController.STORE_KEY, this.lisaData);
    }
}

lisaChevron.set(
    InjectableType.FACTORY,
    [LisaDiKeys.STORAGE, LisaStatusService, LisaStringifyService],
    LisaController
);

export { LisaController };