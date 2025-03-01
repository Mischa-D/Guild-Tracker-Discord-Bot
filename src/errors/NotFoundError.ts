import { CustomError } from "./CustomError.js";

export class NotFoundError extends CustomError {}

export class GuildNotFoundError extends NotFoundError {
  constructor() {
    super("Could not find entry for guild")
  }
}

export class MemberNotFoundError extends NotFoundError {
  constructor() {
    super("Could not find entry for member")
  }
}