import { randItem } from "lightdash";
import { lisaChevron } from "../../di";
import { LisaController } from "./lib/LisaController";
const replantFn = () => {
    const lisaController = lisaChevron.get(LisaController);
    const wasAlive = lisaController.isAlive();
    lisaController.createNewLisa();
    return randItem(wasAlive
        ? [
            "_Is being ripped out and thrown away while still alive, watching you plant the next Lisa._"
        ]
        : [
            "_Plants new Lisa on top of the remnants of her ancestors._",
            "_Plants the next generation of Lisa._"
        ]);
};
const replant = {
    fn: replantFn,
    args: [],
    alias: ["reset", "plant"],
    data: {
        hidden: false,
        usableInDMs: false,
        powerRequired: 0,
        help: "Replant Lisa."
    }
};
export { replant };
//# sourceMappingURL=replant.js.map