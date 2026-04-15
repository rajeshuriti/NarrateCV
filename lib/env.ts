const PLACEHOLDER_VALUES: Record<string, string[]> = {
  OPENROUTER_API_KEY: ['sk-or-v1-...'],
  HUGGINGFACE_API_KEY: ['hf_...'],
  GROQ_API_KEY: ['gsk_...'],
  ANTHROPIC_API_KEY: ['sk-ant-...'],
  OPENAI_API_KEY: ['sk-...'],
  ELEVENLABS_API_KEY: ['...'],
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
  const value = normalizeEnvValue(process.env[name]);
  if (!value) return undefined;

  const placeholders = PLACEHOLDER_VALUES[name] ?? [];
  if (placeholders.includes(value)) return undefined;

  return value;
}

export function hasEnv(name: string): boolean {
  return Boolean(getEnv(name));
}
