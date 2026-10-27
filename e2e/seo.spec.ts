import { expect, test } from "@playwright/test";

const AI_FETCHER =
  "Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)";

test("home HTML carries its title, canonical and linked JSON-LD graph in the head", async ({
  request,
}) => {
  const response = await request.get("/", {
    headers: { "User-Agent": AI_FETCHER },
  });
  const html = await response.text();
  const head = html.slice(0, html.indexOf("</head>"));

  expect(head).toContain(
    "<title>Peploe&#x27;s | A Dublin Restaurant on St Stephen&#x27;s Green</title>",
  );
  expect(head).toContain('rel="canonical"');
  expect(head).toContain('<meta property="og:image:width" content="1452"/>');
  expect(head).toContain('<meta property="og:image:height" content="1407"/>');
  const script = /<script type="application\/ld\+json">(.*?)<\/script>/su.exec(
    head,
  );
  const graph = JSON.parse(script?.[1] ?? "{}") as {
    "@graph": {
      "@id": string;
      "@type": string;
      publisher?: { "@id": string };
    }[];
  };
  const [organization, website] = graph["@graph"];
  expect(organization["@type"]).toBe("Organization");
  expect(website["@type"]).toBe("WebSite");
  expect(website.publisher?.["@id"]).toBe(organization["@id"]);
});

test("metadata of a CMS-driven page reaches AI fetchers in the head", async ({
  request,
}) => {
  const response = await request.get("/menus/lunch", {
    headers: { "User-Agent": AI_FETCHER },
  });
  const html = await response.text();
  const head = html.slice(0, html.indexOf("</head>"));

  expect(head).toContain("<title>");
  expect(head).toContain('rel="canonical"');
});

test("the live build is indexable", async ({ request }) => {
  const response = await request.get("/");

  expect(response.headers()["x-robots-tag"]).toBeUndefined();
  expect(await response.text()).toContain('content="index, follow"');
});
