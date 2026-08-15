import { createTtsPostHandler } from "./handler.js";
import { synthesizeKinyarwanda } from "./provider.js";

export const POST = createTtsPostHandler({
  synthesize: synthesizeKinyarwanda,
});
