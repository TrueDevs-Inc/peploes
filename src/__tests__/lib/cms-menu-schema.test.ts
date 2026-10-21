import { describe, expect, it } from "vitest";
import { cmsMenuSchema } from "@/lib/cms-menu-schema";

describe("specialist menu content", () => {
  it("keeps wine prices, vintage and unavailable status independent", () => {
    const result = cmsMenuSchema.parse({
      _type: "wineMenu",
      slug: "wine",
      title: "Wine",
      seoDescription: "Our wine",
      indexLabel: "Browse",
      sections: [
        {
          _key: "white",
          heading: "White",
          columns: [
            {
              _key: "left",
              categories: [
                {
                  _key: "france",
                  heading: "France",
                  showVintage: true,
                  showGlass: true,
                  wines: [
                    {
                      _key: "wine",
                      name: "Sancerre",
                      vintage: "2024",
                      glass: 0,
                      bottle: 52.5,
                      available: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(result._type).toBe("wineMenu");
    if (result._type !== "wineMenu") return;
    expect(result.sections[0].columns[0].categories[0].wines[0]).toMatchObject({
      vintage: "2024",
      glass: 0,
      bottle: 52.5,
      available: false,
    });
  });
});
