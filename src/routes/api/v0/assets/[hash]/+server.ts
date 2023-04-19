import * as mime from "mime-types";
import * as api from "#/lib/api/index.js";
import * as db from "#/lib/db/index.js";
import type * as sveltekit from "@sveltejs/kit";

// viewableTypes define types that we can allow Content-Disposition: inline for.
// This means the browser will try to render the asset in the browser.
// This is a security risk for certain types, so we only allow a few.
const viewableTypes = new Set(["image", "video", "audio"]);

export async function GET(ev: sveltekit.ServerLoadEvent): Promise<Response> {
  const url = new URL(ev.request.url);

  try {
    const hash = ev.params.hash;

    const asset = await db.client.asset.findUnique({
      select: {
        data: true,
        type: true,
      },
      where: {
        hash,
      },
    });
    if (!asset) {
      return api.respondError(404, new Error("asset not found"));
    }

    const ext = mime.extension(asset.type);
    // Make sure to trim the bits after the colon in our hash, since that's an
    // illegal character on Windows.
    const name = ext ? `${hash}.${ext}` : hash;
    const disposition = viewableTypes.has(asset.type.split("/")[0])
      ? "inline"
      : "attachment";

    return new Response(asset.data, {
      headers: {
        "Content-Type": asset.type,
        "Content-Length": asset.data.byteLength.toString(),
        "Content-Disposition": `${disposition}; filename="${name}"`,
      },
    });
  } catch (err) {
    return api.respondError(400, err);
  }
}
