// Interface desacoplada para integração futura com a API do GitHub (Etapa 13 do prompt
// original). Nenhuma implementação real chama a API do GitHub ainda — o cadastro do
// repositório no MVP é manual (campo de texto). Ver docs/DECISIONS.md.
export interface GitHubProvider {
  getRepository(repoUrl: string): Promise<{
    name: string;
    description: string | null;
    hasReadme: boolean;
    hasLicense: boolean;
    hasCiWorkflow: boolean;
    openIssues: number;
    latestReleaseTag: string | null;
  }>;
}

export class UnconfiguredGitHubProvider implements GitHubProvider {
  async getRepository(): Promise<never> {
    throw new Error(
      "Integração com a API do GitHub ainda não está configurada. Cadastre os dados manualmente."
    );
  }
}
