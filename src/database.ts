import fs from "node:fs/promises";
import path from "node:path";
import { DatabaseState } from "./types";

const dataDir = path.resolve(process.cwd(), "data");
const dbPath = path.resolve(dataDir, "db.json");

const emptyState: DatabaseState = {
  users: [],
  products: [],
  commissionTables: [],
  contents: [],
};

export async function loadDb(): Promise<DatabaseState> {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    const content = await fs.readFile(dbPath, "utf8");
    return JSON.parse(content) as DatabaseState;
  } catch {
    await saveDb(emptyState);
    return emptyState;
  }
}

export async function saveDb(state: DatabaseState): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dbPath, JSON.stringify(state, null, 2), "utf8");
}
