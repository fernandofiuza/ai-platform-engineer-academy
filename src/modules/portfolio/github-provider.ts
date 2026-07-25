import { logger } from "@/lib/logger";

// Integração real com a API REST pública do GitHub (Etapa 13 do prompt original, retomada). Só
// repositórios públicos são suportados — sem OAuth por usuário, é uma leitura pública dos dados
// do repositório informado manualmente pelo aluno.
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

/** Extrai `{owner, repo}` de uma URL do GitHub (`https://github.com/owner/repo`, com ou sem
 * `.git`/barra final/sub-caminho) — retorna `null` se a URL não for do GitHub. */
export function parseGitHubRepoUrl(repoUrl: string): { owner: string; repo: string } | null {
  try {
    const url = new URL(repoUrl);
    if (!/(^|\.)github\.com$/.test(url.hostname)) return null;
    const [owner, repo] = url.pathname.replace(/^\/+/, "").split("/");
    if (!owner || !repo) return null;
    return { owner, repo: repo.replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

const GITHUB_API = "https://api.github.com";

function authHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** `true`/`false` conforme o status HTTP (200 = existe, 404 = não existe); qualquer outro status
 * é tratado como "não foi possível confirmar" (`false`), sem derrubar a sincronização inteira por
 * causa de 1 sinal que falhou — o checklist continua editável manualmente de qualquer forma. */
async function pathExists(owner: string, repo: string, path: string): Promise<boolean> {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/${path}`, {
    headers: authHeaders(),
  });
  return response.ok;
}

export class RestGitHubProvider implements GitHubProvider {
  async getRepository(repoUrl: string) {
    const parsed = parseGitHubRepoUrl(repoUrl);
    if (!parsed) {
      throw new Error("URL não é um repositório do GitHub (esperado https://github.com/dono/repo).");
    }
    const { owner, repo } = parsed;

    const repoResponse = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
      headers: authHeaders(),
    });
    if (repoResponse.status === 404) {
      throw new Error("Repositório não encontrado no GitHub (verifique se é público e a URL está correta).");
    }
    if (!repoResponse.ok) {
      logger.error("github provider request failed", { status: repoResponse.status, owner, repo });
      throw new Error(`Falha ao consultar o GitHub (status ${repoResponse.status}).`);
    }
    const repoData = await repoResponse.json();

    const [hasReadme, hasCiWorkflow, releaseResponse] = await Promise.all([
      pathExists(owner, repo, "readme"),
      pathExists(owner, repo, "contents/.github/workflows"),
      fetch(`${GITHUB_API}/repos/${owner}/${repo}/releases/latest`, { headers: authHeaders() }),
    ]);

    const latestReleaseTag = releaseResponse.ok ? (await releaseResponse.json())?.tag_name ?? null : null;

    return {
      name: repoData.name as string,
      description: (repoData.description as string | null) ?? null,
      hasReadme,
      hasLicense: Boolean(repoData.license),
      hasCiWorkflow,
      openIssues: (repoData.open_issues_count as number | undefined) ?? 0,
      latestReleaseTag,
    };
  }
}

let cachedProvider: GitHubProvider | null = null;

export function getGitHubProvider(): GitHubProvider {
  if (!cachedProvider) cachedProvider = new RestGitHubProvider();
  return cachedProvider;
}
