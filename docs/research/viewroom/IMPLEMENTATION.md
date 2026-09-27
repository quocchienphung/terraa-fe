# Terra Viewroom — ghi chú triển khai

Ngày: 2026-09-27. Tài liệu này mô tả những gì **đã được xây và đã kiểm chứng thật**; mục nào chưa kiểm chứng được ghi rõ.

## 1. Kết quả

- Route mới `/viewroom` (Next.js App Router, prerender tĩnh). Mục **Newsroom** trong `MENU.secondary` được đổi thành **Viewroom → `/viewroom`**; mục Newsroom ở footer giữ nguyên.
- Một viewport duy nhất `TerraViewport`: một R3F `<Canvas>` → một `WebGLRenderer` / một scene / một camera cho cả mesh lẫn Gaussian Splatting.
- Mặc định mở Tokyo (FBX prototype) với đủ texture; có Orbit, Fly (desktop), Tour, Reset view, Fullscreen, Open model (file cục bộ), Info, Help.
- Nhánh Gaussian chạy thật qua `@sparkjsdev/spark` trong cùng scene, đã render PLY chuẩn 3DGS, PLY nén, SPZ và SOG thật.

### Quyết định framework

Người dùng mô tả React + TS + Vite là kiến trúc mong muốn, nhưng repo là **Next.js 16.3.5 / React 19.2.4** và yêu cầu giữ nguyên website được ưu tiên. Vì vậy route nằm trong Next hiện có; core viewer (`src/lib/viewroom/**` và `TerraViewport`) không dùng `next/*` hay API riêng của Next nên có thể host lại trong Vite. Phần phụ thuộc Next chỉ có ở `src/app/viewroom/page.tsx` và `ViewroomClient.tsx` (`next/dynamic`). Không tạo app Vite, không dùng iframe.

## 2. Phiên bản & dependencies

| Package | Version | Ghi chú |
| --- | --- | --- |
| next / react / react-dom | 16.3.5 / 19.2.4 | không đổi |
| three / @types/three | 0.186.1 / 0.186.x | không đổi, một bản duy nhất (`npm ls three`) |
| @react-three/fiber | 9.8.1 | đã có sẵn trong `package.json` của người dùng trước task; peer `react >=19 <19.4`, `three >=0.156` ✓ |
| @sparkjsdev/spark | 2.2.0 | đã có sẵn; là bản mới nhất trên npm tại thời điểm kiểm tra |

Task này **không thêm, không xoá, không nâng** dependency nào. Không dùng Drei (OrbitControls lấy từ `three/examples/jsm`), không dùng GSAP (tour nội suy bằng Catmull-Rom tự viết, có test).

## 3. Kiến trúc

```text
src/app/viewroom/page.tsx            Server Component: metadata, Header, heading, Footer
└─ ViewroomClient.tsx                "use client" + next/dynamic({ ssr:false }) → tách bundle
   └─ ViewroomShell.tsx              chọn model, Open model, kéo thả, Back to Tokyo, thu hồi blob URL
      └─ TerraViewport.tsx           API ổn định cho mọi route; HUD bằng DOM; fallback; fullscreen
         └─ <Canvas> (R3F)            1 renderer / 1 scene / 1 camera
            └─ ViewerScene.tsx        đèn (chỉ cho mesh), SparkProvider (chỉ khi có splat), debug probe
               ├─ AssetRenderer.tsx   load theo phiên, chặn kết quả cũ, wrapper transform, animation
               │   └─ lib/viewroom/adapters/index.ts  registry theo `kind` (import động)
               │       ├─ meshAdapter.ts   FBXLoader / GLTFLoader / OBJLoader + MTLLoader
               │       └─ splatAdapter.ts  Spark SplatMesh (+ kiểm tra header trước khi decode)
               ├─ SparkProvider.tsx   new SparkRenderer({ renderer: gl }) — gl của R3F, add vào scene
               └─ CameraController.tsx  chủ sở hữu camera duy nhất: explore | fly | cinematic
```

- **Tách trách nhiệm:** UI chỉ biết `TerraModelManifest` / `Terra3DAsset` (discriminated union trong `viewerTypes.ts`). Không component UI nào import loader.
- **Lazy:** trang chủ không tải Fiber/Spark/loader/Tokyo (đã đo, xem §7). Trên `/viewroom`, phiên Tokyo không tải thư viện Spark; chunk Spark chỉ tải khi mở asset Gaussian. Mỗi loader là `import()` riêng.
- **Một camera controller:** chuyển mode luôn bàn giao pose hiện tại (Fly→Orbit đặt target theo hướng nhìn, Tour→Orbit dùng target của tour), không snap. Tweens/tour dùng `dt` bị kẹp 0.1 s nên tab ẩn không làm camera nhảy.
- **Vòng đời:** mỗi lần đổi asset tạo `AbortController`; fetch bị huỷ thật, `LoadingManager.abort()` huỷ request phụ; nếu decode vẫn trả về sau khi bị thay thế thì handle bị dispose ngay. Handle được gỡ khỏi scene trước khi dispose. `disposeObject()` giải phóng geometry/material/mọi texture slot/skeleton và object có `dispose()` (SplatMesh), mỗi tài nguyên đúng một lần.
- **Tên theo prompt:** `TerraViewport`, `AssetRenderer`, `SparkProvider`, `CameraController`, `ViewerHud`, `ViewerLoading`, `ViewerFallback`, `viewerTypes`, `viewerManifest`, `assetResolver`, `detectFormat`, `disposeObject`. Mode camera trong code: `explore | fly | cinematic`; nhãn UI theo spec kỹ thuật: Orbit / Fly / Tour.

## 4. Tokyo FBX

Manifest: `TOKYO_PROTOTYPE` trong `src/lib/viewroom/viewerManifest.ts`, `origin: "prototype"`, không gắn `treeId`.

| Tham chiếu trong FBX | Xử lý | Kiểm chứng |
| --- | --- | --- |
| `Atlas.psd` | alias → `textures/Atlas.jpg` | render đúng UV (screenshot 01, 03) |
| `props_alpha.psd` (map) + `props_alpha.png` (alphaMap) | alias → `props_alpha.png` | xem dòng dưới |
| `Interiors.jpg` | giữ nguyên | cửa sổ hiện nội thất |
| `LM_Final.tga` | alias → `textures/LM_Final.jpg` (texture người dùng cung cấp ngày 2026-09-27, ảnh ô vuông đen mờ 512²) | bóng tiếp xúc dưới nón, rào, quầy (screenshot 03) |

- **Màu sai trước đây (xe điện đỏ, mèo cam, ống xanh đậm, props xám đục):** FBXLoader giữ màu Diffuse của FBX (`paintmat` đỏ `#dc1e1e`, `Plastic_Soft` cam, `metalmat` xanh, props xám 60%) và three **nhân** với texture. Theo ngữ nghĩa FBX, texture nối vào Diffuse **thay thế** màu. Adapter FBX nay đặt màu = trắng khi có `map` (tắt được bằng `mesh.textureReplacesColor: false`). Đối chiếu ảnh thumbnail Sketchfab: xe điện vàng-xanh lá, mèo trắng, tường be — khớp.
- `Object705` (material `Material #5516`, 1.527 tam giác) là **các mảng bóng tiếp xúc nằm sát mặt đất** (đã cô lập và tô đỏ để xác nhận: dưới nón, cột, chân tường, xe điện). `LM_Final` là texture bóng của nó. Manifest khai báo `materialOverrides: { "Material #5516": { role: "shadow-decal" } }` → vật liệu unlit, multiply blending, không ghi depth, polygon offset, không đổ/nhận bóng. Trước đó thiếu texture nên các mảng này hiện thành vệt xám.
- `props_alpha.png` là PNG RGBA. Three.js đọc `alphaMap` từ kênh **xanh lá**, nên khi `map` và `alphaMap` cùng một ảnh, adapter đổi sang alpha-test trên kênh alpha của `map` (ngưỡng 0.5 từ manifest), `transparent=false`. Cây/chậu cây cắt viền đúng (screenshot 03).
- Không xoay model: metadata +Y khớp với hiển thị. Bounds thế giới: min (-359.1, -272.6, -301.6), max (402.7, 222.8, 250.6).
- Home view được chọn sau khi quan sát (`defaultCamera`), auto-fit (khớp chính xác 8 góc hộp theo phối cảnh) là fallback. Trên canvas hẹp hơn tỉ lệ thiết kế 2.2 camera lùi theo đúng hướng preset.
- Tour 26 s, 5 keyframe: toàn cảnh góc trước → tầng phố (quầy, hòm thư, nón giao thông) → góc đối diện, đường ray → phía sau-trái trên cao → toàn cảnh sau-phải với đoàn tàu. Test tự động xác nhận camera không đi vào khối nhà dưới mái.
- Poster `public/viewroom/tokyo-poster.jpg` được chụp từ chính model trong viewer (home view), dùng cho trạng thái chưa bắt đầu / không có WebGL2 / lỗi.
- Animation nhúng (clip `Take 001`, 10.67 s) **tắt mặc định**, bật được trong Info.
- Nguồn/licence: cùng model với ["Little Tokyo" của SavageSeggwaye trên Sketchfab](https://sketchfab.com/3d-models/little-tokyo-327da9787a6940f69a40e040a71fa4c0), CC BY 4.0 (Sketchfab ghi 141.8k tam giác, khớp 141.803 của file). Mô tả Sketchfab cho biết ánh sáng được thêm trong editor của họ — không nằm trong FBX. Bản gốc của mô hình được biết đến là "Littlest Tokyo" (Glen Fox); UI ghi attribution theo trang Sketchfab.
- **Ánh sáng tự nhiên** (`DaylightRig.tsx`, chỉ cho mesh): hemisphere trời/đất (sky `#e3eeff`, ground `#b09c80`, 2.7), mặt trời ấm (`#fff1dc`, 4.2) từ trên cao phía trước-phải có **bóng mềm** (PCF, bán kính 3, map 2048 / 1024 trên mobile, frustum ôm bounding sphere), fill lạnh 1.1 phía đối diện, tone mapping Neutral cho mesh (splat vẫn NoToneMapping). Bóng được render **một lần** mỗi asset (scene tĩnh); bật animation thì cập nhật mỗi frame. Giá trị chọn bằng cách render các biến thể cạnh nhau so với ảnh Sketchfab.

## 5. Ma trận định dạng

| Định dạng | Implemented | Verified (fixture thật, trong trình duyệt) | Giới hạn đã biết |
| --- | --- | --- | --- |
| FBX | ✓ FBXLoader | Tokyo có texture; Tokyo không kèm texture → cảnh báo liệt kê đúng 5 file thiếu | FBX tham chiếu PSD/TGA cần alias trong manifest |
| GLB | ✓ GLTFLoader | three.js `Horse.glb` (984 tam giác) | Draco/KTX2/Meshopt **chưa cấu hình** → báo lỗi cụ thể |
| glTF + .bin + texture | ✓ | three.js `DamagedHelmet` (7 file), quad tự tạo; chọn thư mục cũng chạy | thiếu `.bin` → lỗi liệt kê tên file |
| OBJ (+MTL) | ✓ OBJLoader + MTLLoader | three.js `WaltHead` (+MTL), cube + MTL + PNG; OBJ không MTL → vật liệu trung tính + cảnh báo | |
| PLY 3DGS chuẩn | ✓ Spark | `guitar.point_cloud.ply` (90.854 Gaussians) | chỉ nhận PLY có schema Gaussian; PLY mesh / point cloud bị từ chối với thông báo riêng |
| PLY nén (SuperSplat) | ✓ Spark | `guitar.compressed.ply` | |
| SPZ (gzip, v2/v3) | ✓ Spark | `guitar.spz` (repo), `butterfly.spz` (asset chính thức của Spark, chỉ thử local) | **SPZ v4 (header `NGSP` thô) không đọc được bởi Spark 2.2** — tái hiện với `biker.spz` thật; viewer báo lỗi cụ thể |
| SOG (bundled .sog) | ✓ Spark (`PCSOGSZIP`) | `apartment.sog` (661.466 Gaussians, chỉ thử local) | SOG v2 có `shN` mà meta thiếu `count/bands` (vd. `skull.sog`) lỗi ngay trong Spark 2.2 (tái hiện ngoài code Terra). SOGS nhiều file (meta.json + webp rời) chưa hỗ trợ |
| .splat / .ksplat | ✓ Spark với `fileType` tường minh | **chưa kiểm chứng** — không có fixture | |
| glTF `KHR_gaussian_splatting` | từ chối có chủ đích | `biker.glb` thật → thông báo "đừng hiển thị như point cloud" | Spark 2.2 không đọc splat từ glTF |

Đã kiểm chứng thêm: bản PLY chuẩn do Terra giải nén khớp **hoàn toàn** với cách Spark tự giải mã file nén gốc (sai khác vị trí/scale/opacity/màu = 0, quaternion 2e-16 trên mẫu 60 splat).

### Fixture trong repo (`public/viewroom/fixtures/`, ~8.6 MB)

| File | Nguồn |
| --- | --- |
| `guitar.compressed.ply` | nguyên bản từ `playcanvas/engine` `examples/assets/splats/` (repo MIT; không có file licence riêng cho model) |
| `guitar.point_cloud.ply` | giải nén từ file trên sang schema chuẩn 3DGS (SH bậc 0) bằng script trong scratchpad; header ghi rõ nguồn |
| `guitar.spz` | mã hoá bằng `PackedSplats` + `writeSpz` của Spark 2.2 từ `guitar.compressed.ply` |

Các file chỉ dùng để thử (không commit): `Horse.glb`, `DamagedHelmet/*`, `WaltHead.*` (three.js, MIT), `biker.glb`/`biker.spz`/`skull.sog`/`apartment.sog` (PlayCanvas; apartment CC-BY-4.0 Stephane Agullo), `butterfly.spz` (sparkjs.dev). Chưa có asset 3DGS Tokyo; guitar là **fixture phát triển**, không phải cây Terra (manifest `origin: "dev-fixture"`, UI ghi rõ).

Hướng trục: capture của PlayCanvas lưu kiểu Y-down (COLMAP) nên manifest fixture có `transform.quaternion: [1,0,0,0]` (xoay 180° quanh X) — đã kiểm chứng guitar đứng thẳng. Viewer **không** tự xoay splat khác; file local mở không có transform.

## 6. Thêm asset sau khi train

1. Đặt file (tạm thời) dưới `public/models/<tree>/…` hoặc dùng URL có chữ ký ngắn hạn do API trả về.
2. Khai báo manifest — không sửa toolbar hay camera:

```ts
const tree034: TerraModelManifest = {
  modelId: "tree-034-snap-2026-10",
  label: "Tree #034",
  origin: "reconstruction",          // chỉ khi thật sự là bản dựng đã duyệt
  treeId: "034",
  kind: "gaussian-splat",
  format: "spz",                      // hoặc "ply" (point_cloud.ply), "sog"
  url: signedUrlFromApi,              // không lưu localStorage / log / analytics
  captureTime: "2026-10-02",
  reconstructedAt: "2026-10-03",
  approvedAt: "2026-10-04",
  transform: { quaternion: [1, 0, 0, 0] }, // nếu output COLMAP Y-down
  defaultCamera: { position: [2, 1.6, 3], target: [0, 1, 0] }, // tuỳ chọn
};

<TerraViewport asset={tree034} />
// hoặc dạng tối giản:
<TerraViewport asset={{ kind: "gaussian-splat", format: "ply", url: "/models/tree-034/point_cloud.ply" }} />
```

3. Kiểm nhanh không cần code: `/viewroom` → Open model → chọn `point_cloud.ply` / `.spz` / `.sog`.
4. Scan nội thất/cảnh lớn nên có `defaultCamera`; auto-fit đặt camera ngoài hộp bao (xem screenshot 10).
5. `gaussian.lod: true` bật LoD tree của Spark khi file lớn (chưa đo).

Muốn nhúng ở route khác (`/trees/[id]`, review, importer): import `TerraViewport` qua một client boundary `dynamic(..., { ssr:false })` giống `ViewroomClient`; `autoStart={false}` + `posterUrl` để hiện poster trước, 3D sau.

## 7. Kiểm chứng đã chạy

| Lệnh | Kết quả |
| --- | --- |
| `npm run lint` | sạch toàn repo |
| `npm run typecheck` | sạch |
| `npm test` | 75/75 pass (43 test Viewroom mới + 32 test có sẵn) |
| `npm run build` | pass; `/viewroom` prerender tĩnh |

Browser (Playwright-core điều khiển Chrome headless, GPU thật **AMD Radeon integrated qua ANGLE D3D11**; script nằm ngoài repo):

- Dev + production (`next start -p 3200`): Tokyo ready 1.2–1.6 s trên localhost, không throttle, không lỗi/404.
- Trang chủ production: không tải code Spark, Fiber, FBX/GLTF loader, không request asset Tokyo/fixture.
- Controls: 21/21 — orbit kéo/zoom, wheel không cuộn trang, reset về đúng home, Fly (W di chuyển, blur xoá phím, Escape nhả chuột rồi về Orbit, pointer lock được cấp), Tour (pause đứng yên, resume không nhảy, restart, exit, kéo chuột giành quyền), menu site mở thì phím không tác động camera, Escape đóng menu không đổi mode, Help/Info focus vào/ra đúng, fullscreen thật.
- Lỗi/khôi phục: mất context (WEBGL_lose_context) → thẻ "Graphics paused" → Restart viewer về Ready; tải thất bại → lỗi + Retry, không lộ URL; không có WebGL2 → fallback + poster, trang vẫn nguyên, không lỗi JS.
- Vòng đời: chọn liên tiếp 5 model không chờ → chỉ model cuối hiển thị, đúng 1 asset trong scene; 5 vòng Guitar↔Tokyo: geometries 55/55, textures 18/18, programs 7/7 (không tăng). Rời `/viewroom` gỡ viewer; quay lại tải lại bình thường.
- Responsive: 320×640, 390×844, 768×1024 (touch) và 1440×900 — không tràn ngang, nút ≥ 44 px, toolbar dưới chiếm 9–17% chiều cao viewer, Fly ẩn trên thiết bị cảm ứng, kéo một ngón xoay model mà không cuộn trang.
- Reduced motion: Reset tức thì; Tour cắt giữa các khung thay vì bay.
- Tần suất rAF đo được (headless, 1440×900, DPR 1.5): ~165/s khi đứng yên, khi orbit, và khi xem Guitar 90.854 Gaussians. Đây là số đo headless trên một máy, **không** phải số FPS trên thiết bị di động thật.

### Lỗi thật đã tìm thấy và sửa trong quá trình kiểm chứng

- `SparkRenderer.dispose()` không giải phóng geometry/material của chính nó → rò 1 geometry mỗi lần mở splat; nay dispose toàn bộ object.
- Thẻ lỗi phủ kín viewport chặn toolbar (không bấm được Open model / Back to Tokyo) → backdrop cho click xuyên qua.
- SPZ v4 bị từ chối sai lý do; glTF chứa Gaussian bị vẽ thành point cloud → cả hai nay có thông báo đúng.

## 8. Screenshot

`docs/design-references/viewroom/`: `01-desktop-tokyo-home`, `02-desktop-tokyo-info`, `03-desktop-tokyo-tour-street`, `04-desktop-open-model-menu`, `05-desktop-gaussian-ply-guitar`, `06-desktop-gaussian-spz-guitar`, `07-desktop-help`, `08-mobile-390-tokyo`, `09-tablet-768-tokyo`, `10-local-sog-apartment`, `11-error-not-gaussian-ply`, `12-fallback-no-webgl2`, `13-home-menu-viewroom-entry`. Chụp từ build production.

## 9. Giới hạn còn lại

- Chưa có asset 3DGS của Tokyo hay của cây Terra thật; mọi splat đã thử là fixture bên ngoài.
- Chưa đo FPS/bộ nhớ trên điện thoại/máy tính bảng thật; chưa thử file splat lớn (hàng triệu Gaussians) hay LoD của Spark.
- `.splat` / `.ksplat` chưa có fixture; SPZ v4 và một biến thể SOG (có `shN`) không đọc được với Spark 2.2.
- Draco/KTX2/Meshopt cho glTF chưa cấu hình.
- Chưa kiểm trên Safari/iOS (fullscreen fallback "expanded" được viết cho trường hợp thiếu Fullscreen API nhưng chưa thử trên thiết bị).
- Signed URL / phân quyền: viewer nhận URL bất kỳ và không lưu nó, nhưng luồng xin URL ngắn hạn từ API chưa tồn tại. Viewer không phải ranh giới bảo mật.
- Ánh sáng là rig ban ngày của viewer, không phải ánh sáng gốc trong scene Sketchfab (bản Sketchfab có đèn phát sáng kiểu đêm; ta không có dữ liệu đó). Mặt đường nhựa tối theo texture gốc.
- `next start` cảnh báo vì `next.config.ts` dùng `output: "standalone"` (có sẵn); production thật nên chạy `node .next/standalone/server.js` và copy `public`/`.next/static` như tài liệu Next.
