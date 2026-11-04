import { expect, test } from "./menu-test";

for (const surface of [
  { name: "homepage", path: "/", selector: "#groups-occasions ul" },
  {
    name: "seasonal related cards",
    path: "/seasonal/rugby-at-peploes",
    selector: "#event-related-items",
  },
]) {
  for (const density of [1.25, 1.5]) {
    test.describe(`occasion dividers at ${density * 100}% pixel density`, () => {
      test.use({ deviceScaleFactor: density, reducedMotion: "reduce" });

      for (const width of [1280, 1440, 1920]) {
        test(`${surface.name}: all three dividers have identical painted weight at ${width}px`, async ({
          page,
        }) => {
          await page.setViewportSize({ width, height: 900 });
          await page.addInitScript(() => {
            localStorage.setItem("peploes:newsletter:dismissed", "true");
          });
          await page.goto(surface.path);
          await page.evaluate(() => document.fonts.ready);
          const list = page.locator(surface.selector);
          const cards = list.getByRole("listitem");
          await expect(cards).toHaveCount(3);
          await list.scrollIntoViewIfNeeded();
          const positions = await cards.evaluateAll((elements) =>
            elements.map((element) => ({
              x: element.getBoundingClientRect().x,
              y: element.getBoundingClientRect().y,
              right: element.getBoundingClientRect().right,
            })),
          );
          if (surface.path === "/") {
            const right = await list.evaluate(
              (element) => element.getBoundingClientRect().right,
            );
            expect(positions[2].right).toBeCloseTo(right, 1);
          }
          const screenshot = await page.screenshot();
          const paintedDividers = await page.evaluate(
            async ({ png, positions }) => {
              const image = new Image();
              image.src = `data:image/png;base64,${png}`;
              await image.decode();
              const canvas = document.createElement("canvas");
              canvas.width = image.naturalWidth;
              canvas.height = image.naturalHeight;
              const context = canvas.getContext("2d");
              if (!context)
                throw new Error("Screenshot decoding is unavailable");
              context.drawImage(image, 0, 0);
              return positions.map((position) => {
                const start = Math.floor(position.x * devicePixelRatio) - 2;
                const row = Math.round((position.y + 12) * devicePixelRatio);
                const pixels = context.getImageData(start, row, 7, 1).data;
                const painted = [];
                for (let offset = 0; offset < pixels.length; offset += 4) {
                  const color = [...pixels.slice(offset, offset + 3)];
                  if (color.join(",") !== "250,247,241") painted.push(color);
                }
                return painted;
              });
            },
            { png: screenshot.toString("base64"), positions },
          );
          expect(paintedDividers).toHaveLength(3);
          expect(paintedDividers[0]).toHaveLength(2);
          expect(paintedDividers[1]).toEqual(paintedDividers[0]);
          expect(paintedDividers[2]).toEqual(paintedDividers[0]);
        });
      }
    });
  }
}
