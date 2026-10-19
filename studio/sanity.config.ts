import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { dataset, projectId } from "./project";
import { schemaTypes } from "./schemaTypes";

export default defineConfig({
  name: "default",
  title: "Peploes",
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            S.listItem()
              .title("What’s On")
              .child(
                S.list()
                  .title("What’s On")
                  .items([
                    S.documentTypeListItem("seasonalEntry"),
                    S.listItem()
                      .title("Page settings")
                      .child(
                        S.document()
                          .schemaType("whatsOnPage")
                          .documentId("whats-on-page"),
                      ),
                  ]),
              ),
            S.listItem()
              .id("menus")
              .title("Menus")
              .child(
                S.list()
                  .title("Menus")
                  .items([
                    S.documentTypeListItem("restaurantMenu").title(
                      "Food menus",
                    ),
                    S.documentTypeListItem("wineMenu"),
                    S.documentTypeListItem("drinksMenu"),
                    S.documentTypeListItem("setMenuCollection"),
                  ]),
              ),
            S.listItem()
              .title("Shared menu settings")
              .child(
                S.document().schemaType("menusPage").documentId("menus-page"),
              ),
          ]),
    }),
    visionTool({ defaultApiVersion: "2026-10-06" }),
  ],
  schema: { types: schemaTypes },
  document: {
    newDocumentOptions: (options) =>
      options.filter(
        (option) => !["menusPage", "whatsOnPage"].includes(option.templateId),
      ),
    actions: (actions, context) =>
      ["menusPage", "whatsOnPage"].includes(context.schemaType)
        ? actions.filter(
            (action) =>
              action.action !== "duplicate" && action.action !== "delete",
          )
        : actions,
  },
});
