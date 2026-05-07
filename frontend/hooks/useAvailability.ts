"use client";

import { useState, useCallback } from "react";
import axios from "axios";
import type { AvailabilityDay } from "@/types";
import { backendApiUrl } from "@/lib/backend-api";

interface UseAvailabilityResult {
  availability: AvailabilityDay[];
  loading: boolean;
  error: string | null;
  fetch: (instructorId: string, startDate: string, endDate: string) => Promise<void>;
}

export function useAvailability(): UseAvailabilityResult {
  const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    async (instructorId: string, startDate: string, endDate: string) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ instructorId, startDate, endDate });
        const { data } = await axios.get<{
          success: boolean;
          data: AvailabilityDay[];
          error?: string;
        }>(backendApiUrl(`/bookings/availability?${params.toString()}`));

        if (data.success) {
          setAvailability(
            data.data.map((day) => ({
              date: day.date,
              slots: day.slots.map((s) =>
                typeof s === "string" ? { time: s, available: true } : s
              ),
            }))
          );
        } else {
          setError(data.error ?? "Failed to load availability");
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.error ?? "Failed to load availability");
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { availability, loading, error, fetch };
}
