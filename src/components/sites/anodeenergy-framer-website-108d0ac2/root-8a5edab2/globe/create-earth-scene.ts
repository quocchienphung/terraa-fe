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
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { cloudUvOffset } from "./rotation-input";
import { CAMERA_FOV_DEG, EARTH_TEXTURES, LOOK, QUALITY, SUN_DIRECTION, type QualityTier } from "./earth-config";

/*
 * Scene graph (each transform has one owner):
 *   framing  – position/rotation.x from fitFraming(), scale from scroll entry
 *     orient – quaternion: surface yaw, tilt and focus tweens (animation loop)
 *       earth, atmosphere rim
 *       clouds – rotation.y = cloud drift relative to the surface (weather clock)
 * The sun direction is a world-space uniform, so lighting never rotates with the texture.
 *
 * Everything below is a real-time approximation: a textured sphere with height-derived normals,
 * a transparent cloud shell with density-based opacity, a UV-offset cloud shadow and a rim glow.
 * No volumetric clouds, no atmospheric scattering model.
 */

// Shared by the surface and the cloud shell: world normal, a world-space east vector that follows
// the globe's own axis (object-space +Y), and world position.
const SURFACE_VERTEX = /* glsl */ `
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

// Density → opacity for the cloud map, shared so the shell, the night-light attenuation and the
// shadow all use one definition of "how much cloud is here".
const CLOUD_DENSITY = /* glsl */ `
uniform float cloudLow;
uniform float cloudHigh;
uniform float cloudDepth;
float cloudDensity(float c) {
  return clamp((c - cloudLow) / (cloudHigh - cloudLow), 0.0, 1.0);
}
float cloudCover(float c) {
  return 1.0 - exp(-cloudDepth * cloudDensity(c));
}
`;

const EARTH_FRAGMENT = /* glsl */ `
#define PI 3.14159265359
uniform sampler2D albedoMap;
uniform sampler2D nightMap;
uniform sampler2D reliefMap;
uniform sampler2D cloudMap;
uniform vec2 reliefTexel;
uniform float reliefExaggeration;
uniform vec3 sunDir;
uniform vec3 atmoColor;
uniform float saturation;
uniform float sunIntensity;
uniform float ambient;
uniform float exposure;
uniform float nightIntensity;
uniform float haze;
uniform float waterSpecular;
uniform float waterShininess;
uniform float cloudOffset;
uniform float cloudShellHeight;
uniform float cloudShadow;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vEastW;
varying vec3 vPosW;
${CLOUD_DENSITY}

void main() {
  vec3 N = normalize(vNormalW);
  vec3 T = normalize(vEastW - N * dot(vEastW, N)); // east
  vec3 B = cross(N, T);                              // north
  float cosLat = max(sin(vUv.y * PI), 0.02);

  // Relief from elevation (metres), sampled one real texel apart for this tier.
  vec4 relief = texture2D(reliefMap, vUv);
  float water = relief.g;
  float hE = texture2D(reliefMap, vUv + vec2(reliefTexel.x, 0.0)).r;
  float hW = texture2D(reliefMap, vUv - vec2(reliefTexel.x, 0.0)).r;
  float hN = texture2D(reliefMap, vUv + vec2(0.0, reliefTexel.y)).r;
  float hS = texture2D(reliefMap, vUv - vec2(0.0, reliefTexel.y)).r;
  const float METRES_PER_UNIT = 6400.0;
  const float EARTH_RADIUS_M = 6371000.0;
  vec2 run = vec2(2.0 * reliefTexel.x * 2.0 * PI * cosLat, 2.0 * reliefTexel.y * PI) * EARTH_RADIUS_M;
  vec2 slope = vec2(hE - hW, hN - hS) * METRES_PER_UNIT / run;
  // No relief on water, fade out towards the poles where the grid degenerates.
  slope *= reliefExaggeration * (1.0 - water) * smoothstep(0.05, 0.3, cosLat);
  vec3 Np = normalize(N - T * slope.x - B * slope.y);

  vec3 L = normalize(sunDir);
  vec3 V = normalize(cameraPosition - vPosW);
  float nlGeo = dot(N, L);
  // Terminator from the geometric normal: relief never lights the night side.
  float daylight = smoothstep(-0.12, 0.16, nlGeo);

  // Clouds over this point live in the drifting shell: look them up with its offset.
  vec2 cloudUv = vec2(vUv.x - cloudOffset, vUv.y);
  float cover = cloudCover(texture2D(cloudMap, cloudUv).r);
  // Shadow: the cloud that shades this point sits towards the sun, displaced by
  // shellHeight · tan(zenith) along the ground (clamped near the terminator).
  vec2 sunGround = vec2(dot(L, T), dot(L, B));
  vec2 reach = sunGround / max(nlGeo, 0.2) * cloudShellHeight;
  vec2 shadowUv = cloudUv + vec2(reach.x / (2.0 * PI * cosLat), reach.y / PI);
  float shade = cloudShadow * cloudCover(texture2D(cloudMap, shadowUv).r) * daylight;

  vec3 albedo = texture2D(albedoMap, vUv).rgb;
  float lum = dot(albedo, vec3(0.2126, 0.7152, 0.0722));
  albedo = mix(vec3(lum), albedo, saturation);

  vec3 color = albedo * (max(dot(Np, L), 0.0) * sunIntensity * daylight * (1.0 - shade) + ambient);

  // Water: normalised Blinn-Phong lobe with Schlick Fresnel, masked to water, hidden under cloud.
  vec3 H = normalize(L + V);
  float nh = max(dot(N, H), 0.0);
  float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(H, V), 0.0), 5.0);
  float lobe = pow(nh, waterShininess) * (waterShininess + 8.0) / (8.0 * PI);
  color += vec3(1.0, 0.97, 0.92) * lobe * fresnel * waterSpecular * water * max(nlGeo, 0.0) * (1.0 - cover) * (1.0 - shade);

  // City lights only at night, dimmed by the clouds actually above them.
  color += texture2D(nightMap, vUv).rgb * nightIntensity * (1.0 - daylight) * (1.0 - 0.85 * cover);

  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.5);
  color += atmoColor * rim * haze * smoothstep(-0.25, 0.6, nlGeo);

  gl_FragColor = vec4(color * exposure, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const CLOUD_FRAGMENT = /* glsl */ `
#define PI 3.14159265359
uniform sampler2D cloudMap;
uniform vec2 cloudTexel;
uniform vec3 sunDir;
uniform float opacity;
uniform float selfShadow;
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vEastW;
varying vec3 vPosW;
${CLOUD_DENSITY}

void main() {
  vec3 N = normalize(vNormalW);
  vec3 T = normalize(vEastW - N * dot(vEastW, N));
  vec3 B = cross(N, T);
  vec3 L = normalize(sunDir);
  vec3 V = normalize(cameraPosition - vPosW);
  float c = texture2D(cloudMap, vUv).r;
  float density = cloudDensity(c);

  // Longer path through the layer at grazing angles (clamped), faded right at the limb so the
  // edge never turns into a thick white ring.
  float mu = max(dot(N, V), 0.0);
  float depth = cloudDepth * density / max(mu, 0.35);
  float alpha = (1.0 - exp(-depth)) * opacity * smoothstep(0.0, 0.18, mu);

  // Soft self-shading: texels with thicker cloud towards the sun sit in its shade.
  float cosLat = max(sin(vUv.y * PI), 0.05);
  vec2 sunGround = vec2(dot(L, T), dot(L, B));
  vec2 toSun = normalize(sunGround + 1e-5) * 3.0 * cloudTexel / vec2(cosLat, 1.0);
  float occlusion = clamp((cloudDensity(texture2D(cloudMap, vUv + toSun).r) - density) * 1.5, 0.0, 1.0);

  float nl = dot(N, L);
  float lit = smoothstep(-0.12, 0.35, nl);
  vec3 color = vec3(0.93, 0.95, 0.97) * (0.015 + 0.8 * lit * (1.0 - selfShadow * occlusion));
  // Night side: clouds stay dark and less opaque (they still hide some city light).
  alpha *= 0.4 + 0.6 * smoothstep(-0.25, 0.15, nl);
  gl_FragColor = vec4(color, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const RIM_VERTEX = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vPosW;
void main() {
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPosW = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
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
  /** Cloud shell yaw relative to the surface; also shifts the surface's coverage/shadow lookup. */
  setCloudYaw(yaw: number): void;
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
  const densityUniforms = () => ({
    cloudLow: { value: LOOK.cloudDensityLow },
    cloudHigh: { value: LOOK.cloudDensityHigh },
    cloudDepth: { value: LOOK.cloudOpticalDepth },
  });

  const earthGeometry = new SphereGeometry(1, quality.widthSegments, quality.heightSegments);
  const earthMaterial = new ShaderMaterial({
    vertexShader: SURFACE_VERTEX,
    fragmentShader: EARTH_FRAGMENT,
    uniforms: {
      albedoMap: { value: placeholder },
      nightMap: { value: placeholder },
      reliefMap: { value: placeholder },
      cloudMap: { value: placeholder },
      reliefTexel: { value: new Vector2(1 / 4096, 1 / 2048) },
      reliefExaggeration: { value: LOOK.reliefExaggeration },
      sunDir: { value: sunDir },
      atmoColor: { value: atmoColor },
      saturation: { value: LOOK.saturation },
      sunIntensity: { value: LOOK.sunIntensity },
      ambient: { value: LOOK.ambient },
      exposure: { value: LOOK.exposure },
      nightIntensity: { value: LOOK.nightIntensity },
      haze: { value: LOOK.hazeStrength },
      waterSpecular: { value: LOOK.waterSpecular },
      waterShininess: { value: LOOK.waterShininess },
      cloudOffset: { value: 0 },
      cloudShellHeight: { value: LOOK.cloudRadius - 1 },
      cloudShadow: { value: LOOK.cloudShadow },
      ...densityUniforms(),
    },
  });
  const earth = new Mesh(earthGeometry, earthMaterial);
  orient.add(earth);

  const cloudGeometry = new SphereGeometry(LOOK.cloudRadius, quality.widthSegments, quality.heightSegments);
  const cloudMaterial = new ShaderMaterial({
    vertexShader: SURFACE_VERTEX,
    fragmentShader: CLOUD_FRAGMENT,
    transparent: true,
    depthWrite: false,
    uniforms: {
      cloudMap: { value: placeholder },
      cloudTexel: { value: new Vector2(1 / 4096, 1 / 2048) },
      sunDir: { value: sunDir },
      opacity: { value: LOOK.cloudOpacity },
      selfShadow: { value: LOOK.cloudSelfShadow },
      ...densityUniforms(),
    },
  });
  const clouds = new Mesh(cloudGeometry, cloudMaterial);
  orient.add(clouds);

  const rimGeometry = new SphereGeometry(LOOK.rimScale, quality.widthSegments, quality.heightSegments);
  const rimMaterial = new ShaderMaterial({
    vertexShader: RIM_VERTEX,
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
    // Colour maps are sRGB; relief/clouds are data and must not be gamma-decoded.
    t.colorSpace = color ? SRGBColorSpace : NoColorSpace;
    t.anisotropy = maxAniso;
    t.minFilter = LinearMipmapLinearFilter;
    // Longitude wraps; cloud lookups are offset by the drift and must wrap across ±180°.
    t.wrapS = RepeatWrapping;
    textures.push(t);
    return t;
  };

  const texelOf = (t: Texture) => {
    const img = t.image as { width: number; height: number };
    return new Vector2(1 / img.width, 1 / img.height);
  };

  const ready = Promise.all([load(urls.albedo, true), load(urls.night, true), load(urls.relief, false), load(urls.clouds, false)]).then(
    async ([albedo, night, relief, cloudTex]) => {
      earthMaterial.uniforms.albedoMap.value = albedo;
      earthMaterial.uniforms.nightMap.value = night;
      earthMaterial.uniforms.reliefMap.value = relief;
      earthMaterial.uniforms.cloudMap.value = cloudTex;
      earthMaterial.uniforms.reliefTexel.value = texelOf(relief);
      cloudMaterial.uniforms.cloudMap.value = cloudTex;
      cloudMaterial.uniforms.cloudTexel.value = texelOf(cloudTex);
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
    setCloudYaw(yaw) {
      clouds.rotation.y = yaw;
      earthMaterial.uniforms.cloudOffset.value = cloudUvOffset(yaw);
    },
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
