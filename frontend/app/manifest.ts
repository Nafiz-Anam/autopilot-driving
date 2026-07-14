import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Autopilot Driving School",
    short_name: "Autopilot",
    display: "browser",
    start_url: "/",
  };
}
