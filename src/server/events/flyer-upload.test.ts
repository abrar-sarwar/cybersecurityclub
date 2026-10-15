import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { discardFlyer, FLYER_LIMITS, FlyerError, flyerPathname, isBlobUrl, prepareFlyer, storeFlyer } from "./flyer-upload";

const image = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: "#123456" } });

test("a large PNG is resized to 1600 px and re-encoded as WebP without metadata", async () => {
  const png = await image(2400, 1800).png().toBuffer();
  const out = await prepareFlyer(png);
  assert.equal(out.width, 1600);
  assert.equal(out.height, 1200);
  const meta = await sharp(out.webp).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.exif, undefined);
  assert.equal(meta.orientation, undefined);
});

test("a JPEG with an EXIF orientation is rotated upright and the tag stripped", async () => {
  const jpeg = await image(300, 200).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const out = await prepareFlyer(jpeg);
  assert.equal(out.width, 200);
  assert.equal(out.height, 300);
  assert.equal((await sharp(out.webp).metadata()).orientation, undefined);
});

test("a small WebP passes through re-encoded without enlargement", async () => {
  const webp = await image(400, 500).webp().toBuffer();
  const out = await prepareFlyer(webp);
  assert.equal(out.width, 400);
  assert.equal(out.height, 500);
});

test("images that are too small or files that are too large are rejected", async () => {
  await assert.rejects(prepareFlyer(await image(100, 100).png().toBuffer()), FlyerError);
  await assert.rejects(prepareFlyer(Buffer.alloc(FLYER_LIMITS.maxBytes + 1)), FlyerError);
});

test("non-images are rejected whatever their name", async () => {
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300"/></svg>');
  const html = Buffer.from("<html><body><script>alert(1)</script></body></html>");
  const noise = Buffer.from(Array.from({ length: 5000 }, (_, i) => (i * 7919) % 256));
  for (const bad of [svg, html, noise]) await assert.rejects(prepareFlyer(bad), FlyerError);
});

test("flyer pathnames are per event and content hashed; Blob URLs are recognised", async () => {
  const webp = (await prepareFlyer(await image(300, 300).png().toBuffer())).webp;
  assert.match(flyerPathname("gbm-2026", webp), /^flyers\/gbm-2026-[0-9a-f]{8}\.webp$/);
  assert.equal(isBlobUrl("https://abc123.public.blob.vercel-storage.com/flyers/x.webp"), true);
  assert.equal(isBlobUrl("https://example.com/x.webp"), false);
  assert.equal(isBlobUrl("/assets/events/x.webp"), false);
});

test("storeFlyer uploads publicly as WebP and discardFlyer deletes only Blob URLs", async () => {
  const webp = (await prepareFlyer(await image(300, 300).png().toBuffer())).webp;
  const puts: { pathname: string; options: Record<string, unknown> }[] = [];
  const put = (async (pathname: string, _body: unknown, options: Record<string, unknown>) => {
    puts.push({ pathname, options });
    return { url: `https://abc123.public.blob.vercel-storage.com/${pathname}` };
  }) as unknown as typeof import("@vercel/blob").put;
  const url = await storeFlyer("gbm-2026", webp, { put });
  assert.match(url, /^https:\/\/abc123\.public\.blob\.vercel-storage\.com\/flyers\/gbm-2026-[0-9a-f]{8}\.webp$/);
  assert.equal(puts[0].options.access, "public");
  assert.equal(puts[0].options.contentType, "image/webp");
  assert.equal(puts[0].options.addRandomSuffix, false);

  const deleted: string[] = [];
  const del = (async (target: string) => {
    deleted.push(target);
    throw new Error("network down");
  }) as unknown as typeof import("@vercel/blob").del;
  await discardFlyer(url, { del });
  await discardFlyer("https://example.com/x.webp", { del });
  await discardFlyer(null, { del });
  assert.deepEqual(deleted, [url]);
});
