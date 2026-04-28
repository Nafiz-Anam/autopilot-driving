"use client";

import { useState, useCallback } from "react";
import axios from "axios";
import type { BookingPublic } from "@/types";

interface UseBookingsResult {
  bookings: BookingPublic[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBookings(): UseBookingsResult {
  const [bookings, setBookings] = useState<BookingPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.get<{
        success: boolean;
        data: BookingPublic[];
        error?: string;
      }>("/api/bookings");

      if (data.success) {
        setBookings(data.data);
      } else {
        setError(data.error ?? "Failed to load bookings");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError("Please log in to view your bookings");
        } else {
          setError(err.response?.data?.error ?? "Failed to load bookings");
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { bookings, loading, error, refetch };
}
