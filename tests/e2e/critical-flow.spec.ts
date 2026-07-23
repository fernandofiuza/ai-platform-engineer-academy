import { expect, test } from "@playwright/test";

// Fluxo crítico exigido pela Etapa 29 do prompt original:
// Login -> Dashboard -> Abrir aula -> Registrar estudo -> Concluir aula -> Ver progresso atualizado
//
// Registra uma conta nova a cada execução (em vez de reutilizar a conta de demonstração) para
// que o teste seja repetível e não dependa de estado deixado por execuções anteriores.
test("fluxo crítico: registro/login, aula, sessão de estudo, conclusão e progresso", async ({ page }) => {
  const email = `e2e-${Date.now()}@apea.dev`;

  // Registro (equivale a login: o registro autentica automaticamente)
  await page.goto("/register");
  await page.getByLabel("Nome completo").fill("Estudante E2E");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("Teste@1234");
  await page.getByLabel("Confirmar senha").fill("Teste@1234");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL("**/dashboard");

  // Dashboard mostra progresso inicial (0% ou aulas concluídas = 0)
  await expect(page.getByText(/Aulas concluídas/)).toBeVisible();
  await expect(page.locator("body")).toContainText("0 de");

  // Abrir aula
  await page.goto("/learn");
  await page.getByText("Bem-vindo à AI Platform Engineer Academy").click();
  await page.waitForURL("**/learn/**");
  await expect(page.getByRole("heading", { name: "Bem-vindo à AI Platform Engineer Academy" })).toBeVisible();

  // Registrar estudo (sessão de estudo persistente)
  await page.goto("/sessions");
  await page.getByRole("button", { name: /Iniciar sessão/ }).click();
  await expect(page.getByRole("button", { name: /Pausar/ })).toBeVisible();
  await page.getByRole("button", { name: /Finalizar/ }).click();
  await page.getByRole("button", { name: /Salvar e finalizar/ }).click();
  await expect(page.getByText(/min/).first()).toBeVisible();

  // Concluir aula
  await page.goto("/learn/");
  await page.getByText("Bem-vindo à AI Platform Engineer Academy").click();
  await page.waitForURL("**/learn/**");
  await page.locator("textarea#whatLearned").fill("Testei o fluxo crítico end-to-end.");
  await page.getByRole("button", { name: /Concluir aula/ }).click();
  await expect(page.getByText("concluída").first()).toBeVisible();

  // Ver progresso atualizado no dashboard
  await page.goto("/dashboard");
  await expect(page.getByText(/Aulas concluídas/)).toBeVisible();
  await expect(page.locator("body")).toContainText("1 de");
});
