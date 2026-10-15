import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { discardFlyer, FLYER_LIMITS, FlyerError, flyerPathname, prepareFlyer, storeFlyer } from "./flyer-upload";

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

test("flyer pathnames are per event and content hashed", async () => {
  const webp = (await prepareFlyer(await image(300, 300).png().toBuffer())).webp;
  assert.match(flyerPathname("gbm-2026", webp), /^gbm-2026-[0-9a-f]{8}\.webp$/);
});

test("storeFlyer uploads as WebP and returns the public URL; discardFlyer deletes only this store's URLs", async () => {
  const webp = (await prepareFlyer(await image(300, 300).png().toBuffer())).webp;
  const uploads: { path: string; contentType: string }[] = [];
  const deleted: string[] = [];
  const store = {
    uploadFlyer: async (path: string, _bytes: Buffer, contentType: string) => {
      uploads.push({ path, contentType });
    },
    publicFlyerUrl: (path: string) => `https://abc.supabase.co/storage/v1/object/public/flyers/${path}`,
    flyerPathFromUrl: (url: string) => (url.startsWith("https://abc.supabase.co/storage/v1/object/public/flyers/") ? url.slice("https://abc.supabase.co/storage/v1/object/public/flyers/".length) : null),
    deleteFlyer: async (path: string) => {
      deleted.push(path);
      throw new Error("network down");
    },
  };
  const url = await storeFlyer("gbm-2026", webp, store);
  assert.match(url, /^https:\/\/abc\.supabase\.co\/storage\/v1\/object\/public\/flyers\/gbm-2026-[0-9a-f]{8}\.webp$/);
  assert.equal(uploads[0].contentType, "image/webp");
  assert.match(uploads[0].path, /^gbm-2026-[0-9a-f]{8}\.webp$/);
  await discardFlyer(url, store);
  await discardFlyer("https://example.com/x.webp", store);
  await discardFlyer("/assets/events/x.webp", store);
  await discardFlyer(null, store);
  assert.deepEqual(deleted, [uploads[0].path]);
});
