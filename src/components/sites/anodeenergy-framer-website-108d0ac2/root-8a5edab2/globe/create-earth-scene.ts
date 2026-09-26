import {
  AdditiveBlending,
  BackSide,
  Color,
  Group,
  LinearMipmapLinearFilter,
  Mesh,
  NoColorSpace,
  NoToneMapping,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from "three";
import { CAMERA_FOV_DEG, EARTH_TEXTURES, LOOK, QUALITY, SUN_DIRECTION, type QualityTier } from "./earth-config";

/*
 * Scene graph (each transform has one owner):
 *   framing  – position/rotation.x from fitFraming(), scale from scroll entry
 *     orient – quaternion: auto-spin, tilt and focus tweens (animation loop)
 *       earth, clouds (clouds.rotation.y: independent drift), atmosphere
 * The sun direction is a world-space uniform, so lighting never rotates with the texture.
 */

const EARTH_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vEastW;
varying vec3 vPosW;
void main() {
  vUv = uv;
  vec3 east = cross(vec3(0.0, 1.0, 0.0), normal);
  east = length(east) > 1e-4 ? normalize(east) : vec3(1.0, 0.0, 0.0);
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vEastW = normalize(mat3(modelMatrix) * east);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPosW = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const EARTH_FRAGMENT = /* glsl */ `
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D normalMap;
uniform sampler2D masks;
uniform vec3 sunDir;
uniform vec3 atmoColor;
uniform float saturation;
uniform float sunIntensity;
uniform float ambient;
uniform float exposure;
uniform float normalScale;
uniform float specular;
uniform float nightIntensity;
uniform float haze;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vEastW;
varying vec3 vPosW;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 T = normalize(vEastW - N * dot(vEastW, N));
  vec3 B = cross(N, T);
  vec3 tn = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
  tn.xy *= normalScale;
  vec3 Np = normalize(T * tn.x + B * tn.y + N * tn.z);

  vec3 L = normalize(sunDir);
  vec3 V = normalize(cameraPosition - vPosW);
  float nlGeo = dot(N, L);
  // Day/night mask from the geometric normal so relief never lights the night side.
  float daylight = smoothstep(-0.12, 0.16, nlGeo);

  vec3 albedo = texture2D(dayMap, vUv).rgb;
  float lum = dot(albedo, vec3(0.2126, 0.7152, 0.0722));
  albedo = mix(vec3(lum), albedo, saturation);
  vec4 m = texture2D(masks, vUv);

  vec3 color = albedo * (max(dot(Np, L), 0.0) * sunIntensity * daylight + ambient);

  vec3 H = normalize(L + V);
  color += vec3(1.0, 0.96, 0.9) * pow(max(dot(N, H), 0.0), 220.0) * specular * m.g * daylight;

  // City lights only where it is night, dimmed under thick cloud.
  color += texture2D(nightMap, vUv).rgb * nightIntensity * (1.0 - daylight) * (1.0 - 0.7 * m.r);

  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.5);
  color += atmoColor * fresnel * haze * smoothstep(-0.25, 0.6, nlGeo);

  gl_FragColor = vec4(color * exposure, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const SHELL_VERTEX = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vUv = uv;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPosW = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const CLOUD_FRAGMENT = /* glsl */ `
uniform sampler2D masks;
uniform vec3 sunDir;
uniform float opacity;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  float density = smoothstep(0.1, 0.95, texture2D(masks, vUv).r);
  float nl = dot(normalize(vNormalW), normalize(sunDir));
  float lit = smoothstep(-0.12, 0.4, nl);
  vec3 color = vec3(0.92, 0.94, 0.96) * (0.015 + 0.85 * lit);
  float alpha = density * opacity * (0.35 + 0.65 * smoothstep(-0.25, 0.15, nl));
  gl_FragColor = vec4(color, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const RIM_FRAGMENT = /* glsl */ `
uniform vec3 sunDir;
uniform vec3 atmoColor;
uniform float strength;
uniform float maxDepth;
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vPosW);
  // Back faces of the shell: 0 at its outer silhouette, maxDepth where it meets the planet limb.
  float depth = clamp(-dot(N, V) / maxDepth, 0.0, 1.0);
  float glow = pow(depth, 1.6) * strength;
  float lit = smoothstep(-0.3, 0.45, dot(N, normalize(sunDir)));
  gl_FragColor = vec4(atmoColor * glow * lit, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export interface EarthScene {
  renderer: WebGLRenderer;
  camera: PerspectiveCamera;
  scene: Scene;
  framing: Group;
  orient: Group;
  earth: Mesh;
  clouds: Mesh;
  /** Resolves once every texture is uploaded and shaders are compiled. */
  ready: Promise<void>;
  setSize(width: number, height: number): void;
  render(): void;
  dispose(): void;
}

export function createEarthScene(canvas: HTMLCanvasElement, tier: QualityTier, background: string): EarthScene {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  renderer.setClearColor(new Color(background), 1);
  const quality = QUALITY[tier];

  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMERA_FOV_DEG, 1, 0.1, 200);
  const framing = new Group();
  const orient = new Group();
  framing.add(orient);
  scene.add(framing);

  const sunDir = new Vector3(...SUN_DIRECTION).normalize();
  const atmoColor = new Vector3(...LOOK.atmosphereColor);
  const placeholder = new Texture();

  const earthGeometry = new SphereGeometry(1, quality.widthSegments, quality.heightSegments);
  const earthMaterial = new ShaderMaterial({
    vertexShader: EARTH_VERTEX,
    fragmentShader: EARTH_FRAGMENT,
    uniforms: {
      dayMap: { value: placeholder },
      nightMap: { value: placeholder },
      normalMap: { value: placeholder },
      masks: { value: placeholder },
      sunDir: { value: sunDir },
      atmoColor: { value: atmoColor },
      saturation: { value: LOOK.saturation },
      sunIntensity: { value: LOOK.sunIntensity },
      ambient: { value: LOOK.ambient },
      exposure: { value: LOOK.exposure },
      normalScale: { value: LOOK.normalScale },
      specular: { value: LOOK.specular },
      nightIntensity: { value: LOOK.nightIntensity },
      haze: { value: LOOK.hazeStrength },
    },
  });
  const earth = new Mesh(earthGeometry, earthMaterial);
  orient.add(earth);

  const cloudGeometry = new SphereGeometry(LOOK.cloudRadius, quality.widthSegments, quality.heightSegments);
  const cloudMaterial = new ShaderMaterial({
    vertexShader: SHELL_VERTEX,
    fragmentShader: CLOUD_FRAGMENT,
    transparent: true,
    depthWrite: false,
    uniforms: { masks: { value: placeholder }, sunDir: { value: sunDir }, opacity: { value: LOOK.cloudOpacity } },
  });
  const clouds = new Mesh(cloudGeometry, cloudMaterial);
  orient.add(clouds);

  const rimGeometry = new SphereGeometry(LOOK.rimScale, quality.widthSegments, quality.heightSegments);
  const rimMaterial = new ShaderMaterial({
    vertexShader: SHELL_VERTEX,
    fragmentShader: RIM_FRAGMENT,
    side: BackSide,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    uniforms: {
      sunDir: { value: sunDir },
      atmoColor: { value: atmoColor },
      strength: { value: LOOK.rimStrength },
      maxDepth: { value: Math.sqrt(1 - 1 / (LOOK.rimScale * LOOK.rimScale)) },
    },
  });
  orient.add(new Mesh(rimGeometry, rimMaterial));

  let disposed = false;
  const textures: Texture[] = [];
  const loader = new TextureLoader();
  const urls = EARTH_TEXTURES[tier];
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const load = async (url: string, color: boolean) => {
    const t = await loader.loadAsync(url);
    if (disposed) {
      t.dispose();
      throw new Error("disposed");
    }
    t.colorSpace = color ? SRGBColorSpace : NoColorSpace;
    t.anisotropy = maxAniso;
    t.minFilter = LinearMipmapLinearFilter;
    textures.push(t);
    return t;
  };

  const ready = Promise.all([load(urls.day, true), load(urls.night, true), load(urls.normal, false), load(urls.masks, false)]).then(
    async ([day, night, normal, masks]) => {
      earthMaterial.uniforms.dayMap.value = day;
      earthMaterial.uniforms.nightMap.value = night;
      earthMaterial.uniforms.normalMap.value = normal;
      earthMaterial.uniforms.masks.value = masks;
      cloudMaterial.uniforms.masks.value = masks;
      await renderer.compileAsync(scene, camera);
      if (disposed) throw new Error("disposed");
      // Upload every texture now so the first visible frame does not hitch.
      for (const t of textures) renderer.initTexture(t);
    },
  );

  return {
    renderer,
    camera,
    scene,
    framing,
    orient,
    earth,
    clouds,
    ready,
    setSize(width, height) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.maxDpr));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    render() {
      renderer.render(scene, camera);
    },
    dispose() {
      disposed = true;
      textures.forEach((t) => t.dispose());
      placeholder.dispose();
      [earthGeometry, cloudGeometry, rimGeometry].forEach((g) => g.dispose());
      [earthMaterial, cloudMaterial, rimMaterial].forEach((m) => m.dispose());
      renderer.dispose();
    },
  };
}
