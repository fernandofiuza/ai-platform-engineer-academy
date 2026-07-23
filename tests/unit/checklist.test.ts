import { describe, expect, it } from "vitest";
import { checklistCompletion, emptyChecklist, QUALITY_CHECKLIST_ITEMS } from "@/modules/portfolio/checklist";

describe("portfolio quality checklist", () => {
  it("checklist vazio começa em 0%", () => {
    const { done, total, percent } = checklistCompletion(emptyChecklist());
    expect(done).toBe(0);
    expect(total).toBe(QUALITY_CHECKLIST_ITEMS.length);
    expect(percent).toBe(0);
  });

  it("marcar todos os itens chega a 100%", () => {
    const checklist = emptyChecklist();
    for (const item of QUALITY_CHECKLIST_ITEMS) {
      checklist[item.key] = true;
    }
    const { percent } = checklistCompletion(checklist);
    expect(percent).toBe(100);
  });

  it("calcula percentual parcial corretamente", () => {
    const checklist = emptyChecklist();
    checklist[QUALITY_CHECKLIST_ITEMS[0].key] = true;
    const { done, total } = checklistCompletion(checklist);
    expect(done).toBe(1);
    expect(total).toBe(QUALITY_CHECKLIST_ITEMS.length);
  });
});
