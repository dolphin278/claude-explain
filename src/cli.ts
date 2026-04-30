#!/usr/bin/env node
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";

const key = process.env.ANTHROPIC_API_KEY;
if (!key) { console.error("ANTHROPIC_API_KEY not set"); process.exit(1); }

const [, , filePath, range] = process.argv;
if (!filePath) {
  console.error("Usage: claude-explain <file> [startLine-endLine]");
  process.exit(1);
}

let content = readFileSync(filePath, "utf8");
if (range) {
  const [start, end] = range.split("-").map(Number);
  content = content.split("\n").slice(start - 1, end).join("\n");
}

const client = new Anthropic({ apiKey: key });
const stream = client.messages.stream({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: `Explain what this code does in plain English. Be concise and specific.\n\n\`\`\`\n${content.slice(0, 8000)}\n\`\`\``
  }]
});

for await (const chunk of stream) {
  if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta")
    process.stdout.write(chunk.delta.text);
}
console.log();
