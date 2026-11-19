"use client";

import * as React from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import {
  useShadcnTheme,
  type ThemeMode,
} from "@/components/ui/vortex-utils/use-shadcn-theme";

export type EnvironmentPreset = "studio" | "city" | "dawn" | "night";

type LightRig = {
  ambient: { color: string; intensity: number };
  key: { color: string; intensity: number; position: [number, number, number] };
  fill: { color: string; intensity: number; position: [number, number, number] };
  rim: { color: string; intensity: number; position: [number, number, number] };
};

/**
 * Offline lighting rigs. These avoid an HDRI download so the scene has no
 * external assets.
 */
const RIGS: Record<EnvironmentPreset, LightRig> = {
  studio: {
    ambient: { color: "#ffffff", intensity: 0.6 },
    key: { color: "#ffffff", intensity: 2.2, position: [5, 6, 5] },
    fill: { color: "#dfe3ff", intensity: 0.8, position: [-6, 2, 4] },
    rim: { color: "#ffffff", intensity: 1.4, position: [0, 4, -6] },
  },
  city: {
    ambient: { color: "#c7d2fe", intensity: 0.7 },
    key: { color: "#e0e7ff", intensity: 1.8, position: [4, 7, 4] },
    fill: { color: "#a5b4fc", intensity: 0.9, position: [-5, 1, 5] },
    rim: { color: "#818cf8", intensity: 1.2, position: [-2, 3, -6] },
  },
  dawn: {
    ambient: { color: "#fde2c8", intensity: 0.5 },
    key: { color: "#ffb27a", intensity: 2.0, position: [6, 4, 4] },
    fill: { color: "#9fb4ff", intensity: 0.7, position: [-5, 2, 4] },
    rim: { color: "#ffd9a8", intensity: 1.0, position: [0, 5, -5] },
  },
  night: {
    ambient: { color: "#1e1b4b", intensity: 0.4 },
    key: { color: "#a78bfa", intensity: 1.6, position: [4, 5, 4] },
    fill: { color: "#4338ca", intensity: 0.6, position: [-5, 1, 4] },
    rim: { color: "#7c3aed", intensity: 1.6, position: [-2, 3, -6] },
  },
};

function joinClasses(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Drag-to-orbit without @react-three/drei, matching the 21st.dev Vortex demo:
 * rotate only, no pan or zoom, with damping.
 */
function sphericalFrom(position: [number, number, number]) {
  return new THREE.Spherical().setFromVector3(
    new THREE.Vector3(position[0], position[1], position[2]),
  );
}

function DragOrbit({
  enabled,
  cameraPosition,
}: {
  enabled: boolean;
  cameraPosition: [number, number, number];
}) {
  const { camera, gl } = useThree();
  const start = React.useMemo(
    () => sphericalFrom(cameraPosition),
    [cameraPosition[0], cameraPosition[1], cameraPosition[2]],
  );
  const spherical = React.useRef(start.clone());
  const target = React.useRef(start.clone());
  const dragging = React.useRef(false);
  const last = React.useRef({ x: 0, y: 0 });

  React.useLayoutEffect(() => {
    spherical.current.copy(start);
    target.current.copy(start);
    camera.position.setFromSpherical(start);
    camera.lookAt(0, 0, 0);
  }, [camera, start]);

  React.useEffect(() => {
    if (!enabled) return;
    const el = gl.domElement;
    el.style.touchAction = "none";
    el.style.cursor = "grab";

    const onDown = (event: PointerEvent) => {
      dragging.current = true;
      last.current = { x: event.clientX, y: event.clientY };
      el.style.cursor = "grabbing";
      el.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging.current) return;
      const dx = event.clientX - last.current.x;
      const dy = event.clientY - last.current.y;
      last.current = { x: event.clientX, y: event.clientY };
      target.current.theta -= dx * 0.005;
      target.current.phi = THREE.MathUtils.clamp(
        target.current.phi + dy * 0.005,
        0.35,
        Math.PI - 0.35,
      );
    };
    const onUp = (event: PointerEvent) => {
      dragging.current = false;
      el.style.cursor = "grab";
      if (el.hasPointerCapture(event.pointerId)) {
        el.releasePointerCapture(event.pointerId);
      }
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [enabled, gl]);

  useFrame((_, delta) => {
    if (!enabled) return;
    const damp = 1 - Math.exp(-12 * Math.min(delta, 0.05));
    spherical.current.theta += (target.current.theta - spherical.current.theta) * damp;
    spherical.current.phi += (target.current.phi - spherical.current.phi) * damp;
    camera.position.setFromSpherical(spherical.current);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function Rig({
  preset,
  fog,
  theme,
}: {
  preset: EnvironmentPreset;
  fog: boolean;
  theme: ThemeMode;
}) {
  const { bgColor } = useShadcnTheme(theme);
  const rig = RIGS[preset];

  return (
    <>
      {fog ? <fog attach="fog" args={[bgColor, 8, 24]} /> : null}
      <ambientLight color={rig.ambient.color} intensity={rig.ambient.intensity} />
      <directionalLight
        color={rig.key.color}
        intensity={rig.key.intensity}
        position={rig.key.position}
      />
      <directionalLight
        color={rig.fill.color}
        intensity={rig.fill.intensity}
        position={rig.fill.position}
      />
      <pointLight
        color={rig.rim.color}
        intensity={rig.rim.intensity * 12}
        position={rig.rim.position}
        distance={30}
      />
    </>
  );
}

/**
 * Track whether an element is near the viewport. WebGL contexts are scarce,
 * so a scene holds one only while it is on screen.
 */
function useInView(ref: React.RefObject<HTMLElement | null>, rootMargin: string): boolean {
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return inView;
}

export type SceneContainerProps = {
  className?: string;
  theme?: ThemeMode;
  environment?: EnvironmentPreset;
  fog?: boolean;
  /** Camera position, defaults to a gentle 3/4 view. */
  camera?: [number, number, number];
  /** Vertical field of view. */
  fov?: number;
  children?: React.ReactNode;
  /** Rendered as an HTML overlay above the canvas (not inside the 3D scene). */
  overlay?: React.ReactNode;
  /**
   * Reserved for drag-to-orbit. This build keeps the camera fixed so a scene
   * used as a page background does not capture pointer events.
   */
  orbit?: boolean;
  /**
   * Mount the WebGL canvas only while it is near the viewport.
   * Set false for a scene that must always render, such as a hero background.
   */
  lazy?: boolean;
};

/**
 * Themed canvas wrapper. The canvas is transparent so the CSS background shows
 * through. Lighting is an offline rig with no HDRI download.
 */
export function SceneContainer({
  className,
  theme = "auto",
  environment = "studio",
  fog = false,
  camera = [0, 0, 6],
  fov = 45,
  children,
  overlay,
  orbit = true,
  lazy = true,
}: SceneContainerProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, "300px");
  const active = lazy ? inView : true;

  return (
    <div ref={wrapRef} className={joinClasses("relative h-full w-full", className)}>
      {active ? (
        <Canvas
          className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
          dpr={[1, 1.5]}
          frameloop="always"
          gl={{
            antialias: true,
            alpha: true,
            premultipliedAlpha: false,
            powerPreference: "high-performance",
          }}
          camera={{ position: camera, fov, near: 0.1, far: 100 }}
        >
          <DragOrbit enabled={orbit} cameraPosition={camera} />
          <Rig preset={environment} fog={fog} theme={theme} />
          <React.Suspense fallback={null}>{children}</React.Suspense>
        </Canvas>
      ) : null}
      {overlay ? <div className="pointer-events-none absolute inset-0">{overlay}</div> : null}
    </div>
  );
}
