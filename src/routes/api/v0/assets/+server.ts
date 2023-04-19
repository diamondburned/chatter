import * as crypto from "crypto";
import * as api from "#/lib/api/index.js";
import * as db from "#/lib/db/index.js";
import detectContentType from "detect-content-type";
import { env } from "$env/dynamic/private";
import type * as sveltekit from "@sveltejs/kit";

// sizeLimit is the maximum size of an asset in bytes.
const sizeLimit =
  1024 * (env.UPLOAD_LIMIT_KB ? parseInt(env.UPLOAD_LIMIT_KB) : 1024);

export async function POST(ev: sveltekit.ServerLoadEvent): Promise<Response> {
  let session: db.prisma.Session;
  try {
    session = await db.authorize(ev.request);
  } catch (err) {
    return api.respondError(401, err);
  }

  try {
    const reader = await ev.request.body.pipeThrough(limitStream(sizeLimit));
    const data = Buffer.from(await new Response(reader).arrayBuffer());
    const type = detectContentType(data);
    const hash = doHash(data);

    await db.client.asset.upsert({
      select: null,
      where: {
        hash,
      },
      create: {
        data,
        hash,
        type,
      },
      // Assets are immutable, so we don't need to update anything.
      update: {},
    });

    return api.respond<api.UploadAssetResponse>({
      hash,
      type,
      size: data.byteLength,
    });
  } catch (err) {
    return api.respondError(400, err);
  }
}

function doHash(data: Buffer): string {
  // We incorporate sha256 as part of the API version.
  // If we ever need to change the hash function, we can do so by bumping the
  // API version.
  const hash = crypto.createHash("sha256");
  hash.update(data);
  return hash.digest("base64url");
}

// NodeJS sucks balls, and so does SvelteKit.
// Limit body size to a certain amount of bytes.
// See https://github.com/sveltejs/kit/issues/6542.
function limitStream(length: number) {
  let size = 0;
  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      size += chunk.byteLength;
      if (size > length) {
        controller.error(new Error(`body size limit exceeded ${length} bytes`));
        controller.terminate();
        return;
      }
      controller.enqueue(chunk);
    },
  });
}
