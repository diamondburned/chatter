import * as netlify from "@netlify/functions";
import * as db from "#/lib/db/index.js";

const handle: netlify.Handler = async (event, context) => {
  await db.cleanupAssets();
  return { statusCode: 200 };
};

// run our asset garbage collector every midnight
export const handler = netlify.schedule("@daily", handle);
