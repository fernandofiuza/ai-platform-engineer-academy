-- AddUniqueConstraint: natural keys for idempotent import/seed upserts
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_weekId_category_label_key" UNIQUE ("weekId", "category", "label");

ALTER TABLE "lessons" ADD CONSTRAINT "lessons_weekId_order_key" UNIQUE ("weekId", "order");
