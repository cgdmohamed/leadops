export async function clientApi<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  const text = await response.text();
  const result = text ? safeJson(text) : {};
  if (!response.ok) throw new Error(result.error ?? `Request failed with status ${response.status}`);
  return result as T;
}

function safeJson(text: string): { error?: string } {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
