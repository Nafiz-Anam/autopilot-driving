"use client";

import dynamic from "next/dynamic";

const DrivingSceneCanvas = dynamic(
  () =>
    import("./DrivingSceneCanvas").then((m) => m.DrivingSceneCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full h-full"
        style={{ background: "#080810" }}
      />
    ),
  }
);

export function DrivingScene() {
  return <DrivingSceneCanvas />;
}
