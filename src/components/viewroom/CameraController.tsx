"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { Euler, PerspectiveCamera, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { homeView, type FitResult } from "@/lib/viewroom/cameraFit";
import { orbitTourForBounds, sampleTour, tourDuration } from "@/lib/viewroom/tour";
import type { Bounds, CameraMode, CameraPreset, TourKeyframe, Vec3 } from "@/lib/viewroom/viewerTypes";
import type { TourState, ViewerCommands } from "./viewerCommands";

interface CameraControllerProps {
  /** World-space bounds of the active asset; a new object means a new asset. */
  bounds: Bounds | null;
  preset?: CameraPreset;
  tour?: TourKeyframe[];
  reducedMotion: boolean;
  /** Site menu or another modal owns input: controllers stop listening. */
  inputBlocked: boolean;
  flyAvailable: boolean;
  commandsRef: RefObject<ViewerCommands | null>;
  onModeChange: (mode: CameraMode) => void;
  onTourState: (state: TourState) => void;
  onFlyLook: (locked: boolean) => void;
}

const FLY_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"]);
const LOOK_SPEED = 0.0022;
const MAX_PITCH = (89 * Math.PI) / 180;
const TWEEN_SECONDS = 0.9;
const TOUR_LEAD_IN = 2.5;

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * The only writer of the camera. Exactly one of Orbit / Fly / Cinematic (or a short reset tween)
 * drives it at a time; switching hands over the current pose so nothing snaps.
 */
export function CameraController({
  bounds,
  preset,
  tour,
  reducedMotion,
  inputBlocked,
  flyAvailable,
  commandsRef,
  onModeChange,
  onTourState,
  onFlyLook,
}: CameraControllerProps) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);

  const controls = useMemo(() => new OrbitControls(camera, gl.domElement), [camera, gl]);
  const mode = useRef<CameraMode>("explore");
  const home = useRef<FitResult | null>(null);
  const target = useRef(new Vector3());
  const tween = useRef<{ fromP: Vector3; fromT: Vector3; toP: Vector3; toT: Vector3; t: number } | null>(null);
  const fly = useRef({ keys: new Set<string>(), yaw: 0, pitch: 0, dragging: false, distance: 1 });
  const cine = useRef<{ frames: TourKeyframe[]; time: number; playing: boolean; lastReport: number }>({
    frames: [],
    time: 0,
    playing: false,
    lastReport: 0,
  });
  const props = useRef({ reducedMotion, inputBlocked, flyAvailable, onModeChange, onTourState, onFlyLook, preset, tour });
  const aspect = useRef(1);

  const tourFrames = useMemo<TourKeyframe[] | null>(() => {
    if (!bounds) return null;
    if (tour && tour.length > 1) return tour;
    return orbitTourForBounds(bounds, camera.fov, 16 / 9);
  }, [bounds, tour, camera.fov]);
  const tourFramesRef = useRef(tourFrames);

  // ---- helpers shared by every mode ------------------------------------------------------
  const reportTour = (force = false) => {
    const c = cine.current;
    const now = performance.now();
    if (!force && now - c.lastReport < 100) return;
    c.lastReport = now;
    const total = tourDuration(c.frames);
    props.current.onTourState({
      available: !!tourFramesRef.current,
      playing: c.playing,
      progress: total > 0 ? Math.min(c.time / total, 1) : 0,
      ended: total > 0 && c.time >= total,
    });
  };

  const forward = (out: Vector3) => camera.getWorldDirection(out);

  const applyClip = (fit: FitResult) => {
    camera.near = fit.near;
    camera.far = fit.far;
    camera.updateProjectionMatrix();
    controls.minDistance = fit.minDistance;
    controls.maxDistance = fit.maxDistance;
  };

  const leaveMode = (next: CameraMode) => {
    const prev = mode.current;
    if (prev === next) return;
    if (prev === "fly") {
      if (document.pointerLockElement === gl.domElement) document.exitPointerLock();
      fly.current.keys.clear();
      fly.current.dragging = false;
      props.current.onFlyLook(false);
      target.current.copy(camera.position).addScaledVector(forward(new Vector3()), fly.current.distance);
    }
    if (prev === "cinematic") {
      cine.current.playing = false;
      reportTour(true);
    }
  };

  const enterExplore = () => {
    controls.target.copy(target.current);
    controls.update();
  };

  const setMode = (next: CameraMode) => {
    if (next === "fly" && !props.current.flyAvailable) return;
    if (next === mode.current) return;
    tween.current = null;
    leaveMode(next);
    mode.current = next;
    if (next === "explore") enterExplore();
    if (next === "fly") {
      const e = new Euler().setFromQuaternion(camera.quaternion, "YXZ");
      fly.current.yaw = e.y;
      fly.current.pitch = e.x;
      const r = home.current?.radius ?? 1;
      fly.current.distance = Math.min(Math.max(camera.position.distanceTo(controls.target), r * 0.1), r * 3);
    }
    controls.enabled = next === "explore" && !props.current.inputBlocked;
    props.current.onModeChange(next);
  };

  const startTour = (fromStart: boolean) => {
    const frames = tourFramesRef.current;
    if (!frames) return;
    const c = cine.current;
    if (fromStart || mode.current !== "cinematic" || c.frames.length === 0) {
      // Lead in from wherever the camera is so entering the tour never teleports.
      const lead: TourKeyframe = {
        position: camera.position.toArray() as Vec3,
        target: (mode.current === "explore" ? controls.target : target.current).toArray() as Vec3,
        duration: 0,
      };
      // Lead-in time scales with how far the camera is from the first keyframe.
      const gap = camera.position.distanceTo(new Vector3(...frames[0].position)) / (home.current?.radius ?? 1);
      const leadSeconds = props.current.reducedMotion ? 0.001 : Math.min(TOUR_LEAD_IN, Math.max(0.4, gap * 1.5));
      const first = { ...frames[0], duration: leadSeconds };
      c.frames = [lead, first, ...frames.slice(1)];
      c.time = 0;
    }
    setMode("cinematic");
    c.playing = true;
    reportTour(true);
  };

  const resetView = () => {
    const b = bounds;
    if (!b) return;
    const fit = homeView(b, camera.fov, aspect.current, props.current.preset);
    home.current = fit;
    applyClip(fit);
    const wasExplore = mode.current === "explore";
    if (!wasExplore) {
      leaveMode("explore");
      mode.current = "explore";
      props.current.onModeChange("explore");
    }
    const fromT = (wasExplore ? controls.target : target.current).clone();
    const toP = new Vector3(...fit.position);
    const toT = new Vector3(...fit.target);
    if (props.current.reducedMotion) {
      camera.position.copy(toP);
      target.current.copy(toT);
      enterExplore();
      return;
    }
    controls.enabled = false;
    tween.current = { fromP: camera.position.clone(), fromT, toP, toT, t: 0 };
  };

  useLayoutEffect(() => {
    props.current = { reducedMotion, inputBlocked, flyAvailable, onModeChange, onTourState, onFlyLook, preset, tour };
    aspect.current = size.width / Math.max(size.height, 1);
    tourFramesRef.current = tourFrames;
    commandsRef.current = {
      getPose: () => ({
        mode: mode.current,
        position: camera.position.toArray() as Vec3,
        target: (mode.current === "explore" ? controls.target : mode.current === "fly" ? camera.position.clone().addScaledVector(forward(new Vector3()), fly.current.distance) : target.current).toArray() as Vec3,
      }),
      setPose: (position, lookAt) => {
        setMode("explore");
        tween.current = null;
        camera.position.set(...position);
        target.current.set(...lookAt);
        enterExplore();
      },
      setMode: (m) => (m === "cinematic" ? startTour(false) : setMode(m)),
      resetView,
      tourPlay: () => startTour(false),
      tourPause: () => {
        cine.current.playing = false;
        reportTour(true);
      },
      tourRestart: () => startTour(true),
      tourExit: () => setMode("explore"),
    };
  });

  // ---- new asset: fit instantly, back to Orbit ---------------------------------------------
  useEffect(() => {
    if (!bounds) return;
    const fit = homeView(bounds, camera.fov, aspect.current, props.current.preset);
    home.current = fit;
    applyClip(fit);
    leaveMode("explore");
    mode.current = "explore";
    tween.current = null;
    cine.current = { frames: [], time: 0, playing: false, lastReport: 0 };
    camera.position.set(...fit.position);
    target.current.set(...fit.target);
    enterExplore();
    controls.enabled = !props.current.inputBlocked;
    props.current.onModeChange("explore");
    reportTour(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refit only when the asset (bounds) changes
  }, [bounds]);

  // ---- orbit controls lifecycle ------------------------------------------------------------
  useEffect(() => {
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true;
    controls.zoomToCursor = false;
    return () => controls.dispose();
  }, [controls]);

  useEffect(() => {
    controls.enabled = mode.current === "explore" && !inputBlocked && !tween.current;
    if (inputBlocked) {
      fly.current.keys.clear();
      if (document.pointerLockElement === gl.domElement) document.exitPointerLock();
      if (cine.current.playing) {
        cine.current.playing = false;
        reportTour(true);
      }
    }
  }, [inputBlocked, controls, gl]);

  // ---- DOM input for fly + tour interruption -----------------------------------------------
  useEffect(() => {
    const el = gl.domElement;
    const f = fly.current;

    const onPointerDown = (e: PointerEvent) => {
      if (props.current.inputBlocked) return;
      if (mode.current === "cinematic") {
        // Manual input takes the camera back from the tour, cleanly, at the current pose.
        setMode("explore");
        return;
      }
      if (mode.current !== "fly" || e.button !== 0) return;
      const fallbackToDrag = () => {
        f.dragging = true;
        el.setPointerCapture(e.pointerId);
      };
      if (e.pointerType === "mouse" && typeof el.requestPointerLock === "function") {
        try {
          const req = el.requestPointerLock() as unknown as Promise<void> | undefined;
          if (req && typeof req.catch === "function") req.catch(fallbackToDrag);
        } catch {
          fallbackToDrag();
        }
      } else {
        fallbackToDrag();
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (mode.current !== "fly") return;
      const locked = document.pointerLockElement === el;
      if (!locked && !f.dragging) return;
      f.yaw -= e.movementX * LOOK_SPEED;
      f.pitch = Math.min(MAX_PITCH, Math.max(-MAX_PITCH, f.pitch - e.movementY * LOOK_SPEED));
    };
    const onPointerUp = (e: PointerEvent) => {
      if (f.dragging) {
        f.dragging = false;
        if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      }
    };
    const onWheel = () => {
      if (mode.current === "cinematic" && !props.current.inputBlocked) setMode("explore");
    };
    const onLockChange = () => {
      const locked = document.pointerLockElement === el;
      if (!locked) f.keys.clear();
      props.current.onFlyLook(locked);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (mode.current !== "fly" || props.current.inputBlocked || isEditable(e.target)) return;
      if (e.code === "Escape") {
        // First Escape releases the mouse (browsers usually do this themselves); a second leaves Fly.
        if (document.pointerLockElement === el) document.exitPointerLock();
        else setMode("explore");
        return;
      }
      if (!FLY_KEYS.has(e.code) || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      f.keys.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => f.keys.delete(e.code);
    const clearKeys = () => f.keys.clear();
    const onVisibility = () => {
      if (document.hidden) clearKeys();
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: true });
    document.addEventListener("pointerlockchange", onLockChange);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearKeys);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("wheel", onWheel);
      document.removeEventListener("pointerlockchange", onLockChange);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearKeys);
      document.removeEventListener("visibilitychange", onVisibility);
      if (document.pointerLockElement === el) document.exitPointerLock();
      f.keys.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers read live state from refs
  }, [gl]);

  // ---- per-frame: exactly one writer ---------------------------------------------------------
  const tmpF = useMemo(() => new Vector3(), []);
  const tmpR = useMemo(() => new Vector3(), []);
  const tmpT = useMemo(() => new Vector3(), []);
  const euler = useMemo(() => new Euler(0, 0, 0, "YXZ"), []);
  const UP = useMemo(() => new Vector3(0, 1, 0), []);

  useFrame((_, rawDt) => {
    // Clamp so a hidden tab or a long GC pause never makes the camera jump.
    const dt = Math.min(rawDt, 0.1);

    if (tween.current) {
      const tw = tween.current;
      tw.t = Math.min(1, tw.t + dt / TWEEN_SECONDS);
      const k = ease(tw.t);
      camera.position.lerpVectors(tw.fromP, tw.toP, k);
      tmpT.lerpVectors(tw.fromT, tw.toT, k);
      camera.lookAt(tmpT);
      if (tw.t >= 1) {
        tween.current = null;
        target.current.copy(tw.toT);
        enterExplore();
        controls.enabled = mode.current === "explore" && !props.current.inputBlocked;
      }
      return;
    }

    if (mode.current === "explore") {
      controls.update(dt);
      return;
    }

    if (mode.current === "fly") {
      const f = fly.current;
      euler.set(f.pitch, f.yaw, 0, "YXZ");
      camera.quaternion.setFromEuler(euler);
      if (f.keys.size === 0) return;
      const speed = (home.current?.radius ?? 1) * 0.35 * (f.keys.has("ShiftLeft") || f.keys.has("ShiftRight") ? 3 : 1);
      camera.getWorldDirection(tmpF);
      tmpR.crossVectors(tmpF, UP).normalize();
      const k = speed * dt;
      if (f.keys.has("KeyW") || f.keys.has("ArrowUp")) camera.position.addScaledVector(tmpF, k);
      if (f.keys.has("KeyS") || f.keys.has("ArrowDown")) camera.position.addScaledVector(tmpF, -k);
      if (f.keys.has("KeyD") || f.keys.has("ArrowRight")) camera.position.addScaledVector(tmpR, k);
      if (f.keys.has("KeyA") || f.keys.has("ArrowLeft")) camera.position.addScaledVector(tmpR, -k);
      if (f.keys.has("KeyE")) camera.position.addScaledVector(UP, k);
      if (f.keys.has("KeyQ")) camera.position.addScaledVector(UP, -k);
      return;
    }

    // cinematic
    const c = cine.current;
    if (!c.playing || c.frames.length < 2) return;
    c.time += dt;
    const total = tourDuration(c.frames);
    let sampleTime = c.time;
    if (props.current.reducedMotion) {
      // Reduced motion: cut between framed views and hold, instead of flying.
      let acc = 0;
      sampleTime = 0;
      for (let i = 1; i < c.frames.length; i++) {
        acc += c.frames[i].duration;
        if (c.time >= acc - c.frames[i].duration) sampleTime = acc;
      }
      sampleTime = Math.min(sampleTime, total);
    }
    const pose = sampleTour(c.frames, sampleTime);
    camera.position.set(...pose.position);
    target.current.set(...pose.target);
    camera.lookAt(target.current);
    if (c.time >= total) {
      c.time = total;
      c.playing = false;
      reportTour(true);
    } else {
      reportTour();
    }
  });

  return null;
}
