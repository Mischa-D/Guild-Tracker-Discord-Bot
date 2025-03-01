# Discord Bot Template (Discord.js)

## Setup

- create a Discord Bot on the [Discord Developer Portal](https://discord.com/developers/applications)
- add a .env file under `src` with the following contents:
  ```
  TOKEN=the Token of your new bot
  CLIENT_ID=Application ID of your bot
  ```
- make sure you have `npm` installed
- run
  ```
  npm install
  npm run register
  ```

## Start

The bot can be started by running `npm start`. It will then serve requests from any Discord server it was added to, until stopped.

## How to add commands

Any file under [./src/commands](./src/commands/) is interpreted as a command file. It will need to have a default export implementing the [ICommand](./src/types/ICommand.ts) interface. There is an example command, but there is much more you can do.

If you have more complicated commands that might error, you can `throw` a [CustomError](./src/errors/CustomError.ts), which will forward its error message to the user. Error messages of regular errors will be replaced by a generic error.

You should also adapt the [createEmbedTemplate](./src/utils/embedutils.ts) utility function to your needs.
