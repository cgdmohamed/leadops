"use client";

import { useEffect, useState, useCallback } from "react";
import { clientApi } from "@/lib/client-api";

export interface ApiRecord<T = Record<string, unknown>> {
  id: string;
  data: T;
  ownerId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface Page<T> {
  items: ApiRecord<T>[];
  limit: number;
  offset: number;
}

export function useRecords<T extends Record<string, unknown>>(kind: string) {
  const [items, setItems] = useState<ApiRecord<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const page = await clientApi<Page<T>>(`/api/records/${kind}?limit=100`);
      setItems(page.items);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    let cancelled = false;
    clientApi<Page<T>>(`/api/records/${kind}?limit=100`)
      .then((page) => { if (!cancelled) { setItems(page.items); setError(null); } })
      .catch((e) => { if (!cancelled) setError((e as Error).message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [kind]);

  const create = useCallback(async (data: Partial<T>, ownerId?: string | null) => {
    const record = await clientApi<ApiRecord<T>>(`/api/records/${kind}`, {
      method: "POST",
      body: JSON.stringify({ data, ownerId }),
    });
    setItems((prev) => [record, ...prev]);
    return record;
  }, [kind]);

  const update = useCallback(async (id: string, data: Partial<T>, ownerId?: string | null) => {
    const existing = items.find((i) => i.id === id);
    const record = await clientApi<ApiRecord<T>>(`/api/records/${kind}/${id}`, {
      method: "PUT",
      body: JSON.stringify({ data, ownerId, version: existing?.version ?? 1 }),
    });
    setItems((prev) => prev.map((i) => (i.id === id ? record : i)));
    return record;
  }, [items, kind]);

  const remove = useCallback(async (id: string) => {
    await clientApi(`/api/records/${kind}/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, [kind]);

  return { items, loading, error, load, create, update, remove };
}
