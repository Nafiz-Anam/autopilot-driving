import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AutoPilot Driving School",
    short_name: "AutoPilot",
    display: "browser",
    start_url: "/",
  };
}
