// @ts-nocheck
// The bot's entry to the database (DAL / adapters).
//
// The connection itself lives in ../../../_shared/database.ts, because the
// admin functions (clients, messages) use the same one; that file stays the only
// place in the app that connects. Bot code imports the database from here, so
// all of the bot's data access stays inside the DAL layer.
export { getDatabase } from "../../../_shared/database.ts";
