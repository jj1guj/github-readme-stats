import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import statsHandler from "../api/index.js";
import pinHandler from "../api/pin.js";
import topLangsHandler from "../api/top-langs.js";
import wakatimeHandler from "../api/wakatime.js";
import gistHandler from "../api/gist.js";

const ENDPOINT_HANDLERS = {
  stats: statsHandler,
  pin: pinHandler,
  "top-langs": topLangsHandler,
  wakatime: wakatimeHandler,
  gist: gistHandler,
};

class MockResponse {
  constructor() {
    this.headers = {};
    this.body = "";
  }

  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value;
  }

  send(payload) {
    this.body =
      typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
    return payload;
  }
}

const loadConfig = async (configPath) => {
  const raw = await fs.readFile(configPath, "utf8");
  return JSON.parse(raw);
};

const runCardHandler = async (handler, query) => {
  const req = { query };
  const res = new MockResponse();

  await handler(req, res);

  if (!res.body) {
    throw new Error("Handler returned an empty response body");
  }

  return {
    body: res.body,
    contentType: res.headers["content-type"] || "text/plain",
  };
};

const validateCardConfig = (card) => {
  if (!card.output || typeof card.output !== "string") {
    throw new Error("Each card must include a string 'output' field");
  }

  if (!card.endpoint || !ENDPOINT_HANDLERS[card.endpoint]) {
    const supported = Object.keys(ENDPOINT_HANDLERS).join(", ");
    throw new Error(
      `Unknown endpoint '${card.endpoint}'. Supported: ${supported}`,
    );
  }

  if (!card.query || typeof card.query !== "object") {
    throw new Error("Each card must include a 'query' object");
  }
};

const main = async () => {
  const configArg = process.argv[2] || "static-cards.config.json";
  const configPath = path.resolve(process.cwd(), configArg);
  const config = await loadConfig(configPath);

  if (!Array.isArray(config.cards) || config.cards.length === 0) {
    throw new Error("Config must contain a non-empty 'cards' array");
  }

  const outputDir = path.resolve(
    process.cwd(),
    config.outputDir || "public/cards",
  );

  await fs.mkdir(outputDir, { recursive: true });

  for (const card of config.cards) {
    validateCardConfig(card);

    const handler = ENDPOINT_HANDLERS[card.endpoint];
    const { body, contentType } = await runCardHandler(handler, card.query);

    const outputPath = path.resolve(outputDir, card.output);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, body, "utf8");

    console.log(`Generated ${outputPath} (${contentType})`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
