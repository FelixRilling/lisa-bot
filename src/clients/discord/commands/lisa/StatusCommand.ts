import { Message } from "discord.js";
import { Command, CommandMessage, CommandoClient } from "discord.js-commando";
import { chevron } from "../../../../chevron";
import { LisaStateController } from "../../../../lisa/LisaStateController";
import { LisaTextService } from "../../../../lisa/service/LisaTextService";

class StatusCommand extends Command {
    private readonly lisaStateController: LisaStateController;
    private readonly lisaTextService: LisaTextService;

    constructor(client: CommandoClient) {
        super(client, {
            name: "status",
            aliases: [],
            group: "lisa",
            memberName: "status",
            description: "Shows the status of Lisa."
        });
        this.lisaStateController = chevron.getInjectableInstance(
            LisaStateController
        );
        this.lisaTextService = chevron.getInjectableInstance(LisaTextService);
    }

    run(message: CommandMessage): Promise<Message | Message[]> {
        return message.say(
            this.lisaTextService.createStatusText(
                this.lisaStateController.getStateCopy()
            )
        );
    }
}

export { StatusCommand };