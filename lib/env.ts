const PLACEHOLDER_VALUES: Record<string, string[]> = {
  OPENROUTER_API_KEY: ['sk-or-v1-...'],
  GEMINI_API_KEY: ['AIza...'],
  HUGGINGFACE_API_KEY: ['hf_...'],
  GROQ_API_KEY: ['gsk_...'],
  ANTHROPIC_API_KEY: ['sk-ant-...'],
  OPENAI_API_KEY: ['sk-...'],
  ELEVENLABS_API_KEY: ['...'],
};

const ENV_ALIASES: Record<string, string[]> = {
  GEMINI_API_KEY: ['GOOGLE_API_KEY'],
  HUGGINGFACE_API_KEY: ['HF_TOKEN'],
};

function normalizeEnvValue(value: string | undefined): string | undefined {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed;

  return unquoted || undefined;
}

export function getEnv(name: string): string | undefined {
  const names = [name, ...(ENV_ALIASES[name] ?? [])];

  for (const candidateName of names) {
    const value = normalizeEnvValue(process.env[candidateName]);
    if (!value) continue;

    const placeholders = PLACEHOLDER_VALUES[candidateName] ?? PLACEHOLDER_VALUES[name] ?? [];
    if (placeholders.includes(value)) continue;

    return value;
  }

  return undefined;
}

export function hasEnv(name: string): boolean {
  return Boolean(getEnv(name));
}
