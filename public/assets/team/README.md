# Board portraits

Drop one image per officer here, named after their slug. The team page finds
them automatically: no code change, no manifest entry.

    marc.jpg      siya.jpg      mikey.jpg     abrar.jpg
    alan.jpg      kamal.jpg     mazza.jpg     madison.jpg
    james.jpg     luigi.jpg

- Any of .jpg, .jpeg, .png, .webp or .avif works.
- Square images look best; anything else is centre-cropped to a circle.
- 400x400 is plenty. Larger files just cost visitors bandwidth.
- Officers without a file keep their initials instead, so partial sets are fine.

In production the file list is read when the server boots, so restart the
server (or redeploy) after adding portraits.
