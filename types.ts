export class CommandPayloadDTO {
    command: string = "";
    respondWithData: boolean = false;
  
    constructor(input: CommandPayloadDTOInput) {
      this.command = input.command;
      this.respondWithData = input.respondWithData;
    }
  }

  interface CommandPayloadDTOInput {
    command: string;
    respondWithData: boolean;
  }