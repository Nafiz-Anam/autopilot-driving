"use client";

import { useState, useCallback } from "react";
import axios from "axios";
import type { InstructorPublic } from "@/types";

interface UseInstructorsOptions {
  postcode?: string;
  transmission?: string;
  female?: boolean;
}

interface UseInstructorsResult {
  instructors: InstructorPublic[];
  loading: boolean;
  error: string | null;
  search: (options: UseInstructorsOptions) => Promise<void>;
}

export function useInstructors(): UseInstructorsResult {
  const [instructors, setInstructors] = useState<InstructorPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (options: UseInstructorsOptions) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.postcode) params.set("postcode", options.postcode);
      if (options.transmission) params.set("transmission", options.transmission);
      if (options.female !== undefined) params.set("female", String(options.female));

      const { data } = await axios.get<{ success: boolean; data: InstructorPublic[]; error?: string }>(
        `/api/instructors?${params.toString()}`
      );

      if (data.success) {
        setInstructors(data.data);
      } else {
        setError(data.error ?? "Failed to load instructors");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error ?? "Failed to load instructors");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { instructors, loading, error, search };
}
