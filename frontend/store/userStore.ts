"use client";

import { create } from "zustand";
import type { Role } from "@/types";

interface UserStore {
  postcode: string;
  preferredTransmission: "manual" | "automatic" | null;
  setPostcode: (postcode: string) => void;
  setPreferredTransmission: (t: "manual" | "automatic") => void;
}

export const useUserStore = create<UserStore>((set) => ({
  postcode: "",
  preferredTransmission: null,
  setPostcode: (postcode) => set({ postcode }),
  setPreferredTransmission: (preferredTransmission) =>
    set({ preferredTransmission }),
}));
