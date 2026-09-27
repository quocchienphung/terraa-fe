# Master prompt kỹ thuật — Terra Viewroom / Universal 3D Viewer

> Dùng tài liệu này làm specification triển khai. Đọc cùng `VIEWROOM-ASSET-AUDIT.md`. Prompt điều phối Claude nằm ở `VIEWROOM-CLAUDE-MASTER-PROMPT.md`.

## 1. Vai trò và kết quả cần đạt

Bạn là senior frontend/graphics engineer, chịu trách nhiệm triển khai một trang **Viewroom** tại `/viewroom` trong repository hiện tại. Trang cần có chất lượng production về giao diện, lifecycle, loading/error states và khả năng vận hành; phải xem được model Tokyo thật, không chỉ trình bày một mockup.

Sản phẩm là một không gian xem 3D thống nhất: mesh hiện tại và Gaussian Splatting sau huấn luyện dùng chung viewport, camera, toolbar, thông tin model và tương tác. Model Tokyo mặc định là FBX. Gaussian PLY/SPZ phải có đường chạy thật ngay trong implementation, dù asset 3DGS Tokyo chưa có.

Triển khai đủ registry/loader cho:

| Nhánh | Format | Backend |
| --- | --- | --- |
| Gaussian Splatting | `.ply`, `.splat`, `.ksplat`, `.spz`, `.sog` | `@sparkjsdev/spark` |
| Mesh | `.fbx` | Three.js FBXLoader |
| Mesh | `.glb`, `.gltf` | Three.js GLTFLoader |
| Mesh | `.obj`, kèm `.mtl` và texture nếu có | Three.js OBJLoader + MTLLoader |

Không dựng viewer riêng cho từng format. Không dùng iframe embed từ dịch vụ 3D ngoài. Không đổi FBX thành các điểm rồi gọi đó là Gaussian Splatting. Không dùng Three.js PLYLoader để giả lập render 3DGS. Không cam kết rằng mọi biến thể file mang cùng extension đều được hỗ trợ.

## 2. Ràng buộc bất biến

1. Giữ nguyên homepage và layout hiện có, kể cả các thay đổi người dùng chưa commit.
2. Chỉ thay entry Newsroom trong `MENU.secondary` thành `{ label: "Viewroom", href: "/viewroom" }`. Giữ thứ tự và animation menu. Không sửa News section, footer Newsroom, các route/link news khác.
3. Không chỉnh `src/app/page.tsx`, root `layout.tsx`, `globals.css`, Hero, globe, footer hoặc shared animation/scroll engine để phục vụ viewer.
4. Reuse Header hiện có bằng import ở route mới. CSS mới phải scope trong Viewroom, ưu tiên Tailwind utilities và tokens sẵn có; CSS module chỉ khi cần. Không thêm global selector `canvas`, `button`, `body` làm ảnh hưởng toàn site.
5. Chỉ thêm dependencies cần thiết và cập nhật lockfile tương ứng. Không nâng/hạ Three.js toàn repo hoặc React/Next để né compatibility. Kiểm tra peer ranges, typecheck và runtime trước; nếu thật sự không có bộ compatible, báo mâu thuẫn bằng chứng cụ thể thay vì âm thầm phá globe.
6. Không rename/ghi đè model Tokyo gốc. Không chỉnh `node_modules`. Không tạo backend upload, auth, database, training pipeline hoặc deploy nếu chưa được yêu cầu.
7. TypeScript strict, không `any`, không `@ts-ignore` để che lỗi integration, named exports; default export chỉ tại convention Next yêu cầu. Hai space, mobile-first, icon theo Lucide/hệ thống đang có.
8. Chỉ diễn đạt trạng thái đã kiểm chứng. Không fake progress, FPS, số splat, screenshot, kết quả test hoặc asset được train.

### Next.js hiện tại và mong muốn Vite

Ý định kiến trúc: **React + TypeScript + React Three Fiber + Three.js + Spark**, viewer core có thể chạy trong host Vite. Nhưng repo này là **Next.js 16 App Router**, và giữ nguyên website là ràng buộc cao hơn việc thay bundler.

Vì vậy triển khai `/viewroom` trong Next hiện tại. `TerraViewport` và các adapter không phụ thuộc `next/navigation`, `next/image`, server-only API hoặc biến môi trường riêng của Next. Next-specific code chỉ ở route/shell. Không scaffold Vite ở root, không chạy hai app production, không thêm iframe. Chỉ tạo host Vite riêng khi người dùng yêu cầu rõ một deliverable độc lập; lúc đó reuse cùng viewer core, không nhân đôi implementation.

## 3. Đọc repo trước khi viết code

Đọc AGENTS.md, git status/diff baseline, package/lockfile, tài liệu Next cục bộ về Client Components/lazy loading, các file UI liệt kê trong audit. Đọc API từ phiên bản Spark/Fiber sẽ cài, không chép tutorial khác version. Chạy `npm ls three react react-dom` và kiểm tra peer dependencies để tránh hai bản Three hoặc React.

Lập bảng nhỏ: host/runtime version, file integration được sửa, asset có thật, texture thiếu, format có fixture, giới hạn đã biết. Tiếp tục thực hiện các phần không bị chặn; không dừng ở việc đưa kế hoạch.

Nếu ZIP xuất hiện sau này, kiểm tra danh sách entry trước; không chạy script trong archive, không extract đè repo hoặc cho path traversal thoát thư mục. Hiện tại dùng asset trong public theo audit, không giả vờ đã giải nén ZIP.

## 4. Thiết kế trải nghiệm theo homepage

**Phong cách:** editorial, rõ ràng, ít chrome, ưu tiên không gian nhìn model; nền trắng/ink, chữ Geist, mono cho metadata, brand green dùng tiết chế. Không biến trang thành dashboard SaaS có sidebar lớn, hàng chục card, neon, gradient tùy tiện hoặc logo mới.

### Bố cục mặc định

- Header hiện có ở trên; chừa 72px mobile / 86px desktop để không chồng toolbar. Dùng `data-nav-theme="dark"` nếu vùng dưới header là ink. Giữ z-index viewer thấp hơn menu 50 và header 60.
- Khối heading gọn trong gutter hiện có: eyebrow `VIEWROOM`, h1 `Explore in 3D.`, mô tả một câu ngắn. Không làm hero marketing chiếm hết màn hình trước khi thấy model.
- Một viewport rộng, height ổn định khi loading, chiếm phần lớn vùng nhìn đầu tiên. Dùng `svh`/`dvh` và min-height hợp lý thay vì hardcode full-screen trên mọi màn hình. Ở desktop model là trọng tâm ngay lần nhìn đầu.
- Overlay trái trên: `Tokyo`, nhãn `3D model`, trạng thái loading/ready. Thông số kỹ thuật chi tiết đặt trong panel Info.
- Toolbar dưới: `Orbit`, `Fly`, `Tour`, `Reset view`, `Fullscreen`; nhóm phụ `Open model`, `Info`, `Help`. Nút có accessible name, tooltip khi hover/focus và active state rõ; không dùng icon mơ hồ đơn độc.
- Info panel nhỏ, collapsible, không phủ model quá nhiều; hiển thị loại asset, format, kích thước nếu biết, attribution nếu có. Không đưa API/framework/đường dẫn máy tác giả vào UI khách hàng.
- Mobile: toolbar gọn và wrap hợp lý, các mục phụ vào popover/sheet; touch target tối thiểu 44px. Không cần hiển thị Fly nếu thiết bị không có keyboard/pointer phù hợp; giải thích ngắn trong Help. Orbit và Tour vẫn dùng được bằng touch.
- Footer có thể reuse nguyên component nếu cần dưới nội dung; không sửa nội dung/style footer. Không bắt buộc footer chiếm chỗ trong chế độ xem immersive.

### Ngôn ngữ và motion

UI English thống nhất homepage. Báo cáo triển khai bằng tiếng Việt. Giữ typographic scale gần hệ thống hiện có; page title có thể 48–72px desktop / 32–40px mobile để dành chỗ viewer. Dùng `font-sans`, `font-mono`, `bg-ink`, `bg-panel`, `text-muted-*`, `bg-brand`, các easing hiện có.

Model đứng yên và dễ điều khiển khi mở. Tour chỉ chạy khi người dùng bấm. `prefers-reduced-motion` tắt intro bay camera/auto-rotation; camera fit chuyển tức thời hoặc rất ngắn. Trạng thái reduced motion không được làm canvas trống.

## 5. Kiến trúc một viewport

```text
Next route /viewroom (server shell, page metadata)
  ViewroomClient (client-only dynamic boundary)
    ViewroomShell (HTML controls / panels / loading / errors)
      TerraViewport (React core)
        R3F Canvas → one Three WebGLRenderer / one scene / one active camera
          CameraRig + camera mode controller
          AssetRenderer → adapter registry
            MeshAdapter → FBXLoader / GLTFLoader / OBJLoader (+ MTLLoader)
            SplatAdapter → SparkRenderer integration + SplatMesh
```

R3F sở hữu canvas, renderer và render loop. Spark dùng **renderer do R3F cung cấp**, không gọi `new WebGLRenderer()`, không append canvas riêng, không thêm `requestAnimationFrame`/`setAnimationLoop` cạnh tranh. Mount renderer integration và splat object theo API version đã kiểm chứng. Shader/decode work phải nằm sau client boundary.

Route `page.tsx` có thể giữ Server Component để xuất metadata. Tạo một Client Component dùng dynamic import `ssr: false` cho viewport; không đặt option đó trực tiếp trong Server Component. Chỉ mount `window`, `document`, WebGL, loader side effects sau client boundary. Không đưa Spark vào shared navigation hoặc root layout. Homepage vốn có Three cho globe; yêu cầu là homepage **không tải thêm** Spark/Fiber/Tokyo chỉ vì thêm Viewroom.

### Cấu trúc đề xuất, điều chỉnh vừa đủ

```text
src/app/viewroom/page.tsx
src/components/viewroom/ViewroomClient.tsx
src/components/viewroom/ViewroomShell.tsx
src/components/viewroom/TerraViewport.tsx
src/components/viewroom/AssetRenderer.tsx
src/components/viewroom/controls/CameraRig.tsx
src/components/viewroom/controls/OrbitController.tsx
src/components/viewroom/controls/FlyController.tsx
src/components/viewroom/controls/CinematicController.tsx
src/components/viewroom/ui/ViewerToolbar.tsx
src/components/viewroom/ui/ViewerStatus.tsx
src/components/viewroom/ui/ViewerInfo.tsx
src/lib/viewroom/types.ts
src/lib/viewroom/assets.ts
src/lib/viewroom/format-registry.ts
src/lib/viewroom/resolve-resources.ts
src/lib/viewroom/camera-math.ts
src/lib/viewroom/adapters/mesh-adapter.ts
src/lib/viewroom/adapters/splat-adapter.ts
tests/viewroom-*.test.ts
docs/research/viewroom/IMPLEMENTATION.md
docs/design-references/viewroom/
```

Không tạo mọi file nếu chỉ là wrapper rỗng; giữ ranh giới trách nhiệm và dependency direction. UI không import trực tiếp từng loader để tự quyết định format.

### Contract dữ liệu

Dùng discriminated unions để phân biệt mesh/splat, format và URL/local source. Asset descriptor phải chứa `id`, `label`, `kind`, `format`, source, resource base/map, optional transform (position/quaternion/**uniform scale**), optional initial view/tour, optional attribution/bounds. Local source giữ filename gốc ngay cả khi tạo blob URL.

Adapter contract nội bộ phải có: load bất đồng bộ; progress theo phase; asset handle có root `Object3D`, world bounds hợp lệ, metadata có nguồn, capability flags, `dispose()` idempotent. Nếu SDK không abort decode được, contract có cancellation token/generation guard để loại kết quả cũ và dispose handle đến muộn. Đừng khai báo AbortSignal rồi bỏ qua.

Phân biệt ownership: R3F sở hữu renderer/canvas; adapter sở hữu geometry/material/texture/splat resources của lần load; cache nếu có phải có reference counting/eviction. Tránh vừa để R3F tự dispose vừa dispose thủ công tài nguyên dùng chung.

State UI: `idle → loading → ready | error`, phase tải như `fetching / decoding / preparing`; camera mode `orbit | fly | cinematic`; quality `auto | low | high` chỉ nếu thực sự thay đổi cấu hình. State React cho UI, refs/Three objects cho cập nhật per-frame.

## 6. Tokyo FBX: bắt buộc giải quyết asset thật

Default descriptor trỏ `/3d%20tokyo/source/Export.fbx`; texture base `/3d%20tokyo/textures/`. Không dùng `public/` trong URL trình duyệt, không đưa Windows path vào fetch, không encode cả URL bằng `encodeURIComponent`.

1. FBXLoader chỉ load khi active asset là FBX; dùng LoadingManager riêng cho mỗi asset session.
2. Thiết lập resource path và URL resolver chính xác. Alias `Atlas.psd → Atlas.jpg`, `props_alpha.psd → props_alpha.png`; normalize slash/case phục vụ lookup, giữ đúng case đường dẫn cuối để chạy trên Linux hosting.
3. Có thể một URL đã được prefix/path-normalize trước khi manager thấy nó. Kiểm chứng trên Network tab rằng resolver xử lý đúng reference thực tế. Không rewrite các URL không thuộc alias của Tokyo.
4. `LM_Final.tga` không tồn tại. Xác định slot qua FBX connection/material; bỏ optional map hoặc dùng fallback trung tính đúng slot theo bằng chứng, ghi degradation trong Info/implementation note. Không map lightmap thiếu sang Atlas, không để request 404 lặp, không ghi file giả tên `.tga`. Không claim khôi phục chính xác lighting gốc.
5. Giữ UV và material assignment; kiểm chứng atlas, interiors, alpha cutouts. Không thay mọi material bằng cùng màu, không bật `DoubleSide`/transparent toàn model. Nếu dùng alpha test, chọn threshold bằng kiểm chứng hình ảnh; chú ý `alphaMap` và alpha của color texture không đồng nghĩa.
6. Base color/emissive textures có color space phù hợp; data maps không bị gán sRGB tùy tiện. Chỉ bổ sung light rig tối thiểu cho mesh cần ánh sáng; splat không bị ép phụ thuộc mesh lighting.
7. Load xong cập nhật world matrices, tính bounds và fit camera có padding. Không hardcode camera theo một ảnh tưởng tượng, không suy ra model dựng đứng chỉ từ tên Tokyo. FBX có metadata +Y; không tự xoay -90° nếu chưa thấy cần.
8. Group transform ngoài asset để center/normalize nếu cần; không bake phá geometry gốc. Near/far, orbit distances, fly speed dựa bounds. Lưu Tokyo framing đẹp đã quan sát trong descriptor sau khi có fallback auto-fit an toàn.
9. Readiness phải đợi texture thiết yếu và scene sẵn sàng; download FBX xong chưa đồng nghĩa ready. Texture thiếu đã biết là warning có xử lý, geometry load fail là error có Retry.

Không tự chuyển sang GLB để bỏ qua việc FBXLoader phải chạy được. Nếu profiling chứng minh cần bản optimized để deploy, giữ FBX prototype và bản gốc, ghi rõ pipeline tạo asset derivative và đo before/after.

## 7. Format routing và Gaussian Splatting

Registry dispatch theo format/kind đã validate, tách query/hash khỏi URL, extension case-insensitive. Với blob URL, dùng filename/format được lưu. Không coi MIME là bằng chứng duy nhất. Reject file rỗng, format không hỗ trợ và dữ liệu hỏng bằng lỗi có thể hiểu.

### PLY không đồng nghĩa 3DGS

PLY có thể là mesh, point cloud, hoặc Gaussian data. Với PLY 3DGS thông thường kiểm tra schema/decoder cho position, opacity, scale, rotation và color/SH data; compressed PLY có schema khác, không reject chỉ vì thiếu tên field của bản uncompressed. Dùng decoder Spark và kết quả validation tương ứng version. Plain XYZ/RGB phải được phân loại rõ; nếu không triển khai chế độ point cloud riêng, thông báo đây không phải PLY 3DGS được hỗ trợ. Không gắn nhãn Gaussian cho bất kỳ file `.ply` nào.

### SparkAdapter

- Dùng package `@sparkjsdev/spark` và API thực trong typings/source của version được chọn. Tài liệu Spark hiện mô tả các format mục tiêu; giữ ma trận `implemented / verified with fixture / limitation` riêng. Nguồn: [Spark loading](https://sparkjs.dev/docs/loading-splats/).
- `.splat` / `.ksplat` có thể cần `fileType` tường minh nếu nguồn là bytes/blob/URL không extension. Dùng enum/API của package thật, không chế string constant.
- `.sog` phải được xử lý theo biến thể container được package hỗ trợ; phân biệt single bundled file với bộ metadata và sidecar. File ZIP bất kỳ không mặc nhiên là SOG. Mục tiêu tối thiểu là bundled `.sog`; ghi rõ nếu multi-file SOGS chưa hỗ trợ.
- Bounds splat lấy sau decode bằng API của Spark rồi chuyển world space theo transform; không trông chờ `Box3.setFromObject` đọc được Gaussian data như BufferGeometry.
- Orientation/scale theo asset metadata; không xoay mọi splat 180° chỉ vì example làm thế. Dùng uniform scale. Kiểm tra một fixture thật để thấy đúng trục, frame và alpha.
- Tích hợp lifecycle Spark với R3F sao cho sorting/upload hoàn thành và scene cập nhật khi camera chuyển động. `frameloop="demand"` chỉ dùng sau khi có invalidate bridge đã kiểm chứng; ưu tiên correctness, có thể render liên tục khi viewer visible rồi tối ưu bằng profiling.
- Dùng `useFrame` hoặc hook tích hợp thích hợp; không mỗi frame `setState`, tạo Vector3/Quaternion mới liên tục, hoặc dựng lại SplatMesh khi toolbar đổi trạng thái.
- Không biến adapter thành stub chờ ngày có Tokyo PLY. Có đường mở file local và smoke test splat thật. Nếu thiếu fixture, lấy mẫu nhỏ từ nguồn chính thức có thể sử dụng, ghi nguồn; procedural Gaussian fixture chỉ bổ sung test, không chứng minh decode file PLY/SPZ.

### Mesh formats còn lại

GLTFLoader hỗ trợ GLB và GLTF kèm buffers/textures. Draco/KTX2/Meshopt chỉ quảng cáo khi decoder tương ứng được cấu hình và kiểm chứng; unsupported compression phải có lỗi cụ thể. OBJ dùng MTLLoader khi có MTL, giữ đường dẫn texture tương đối. OBJ không có material được phép dùng neutral material có ghi nhận; không coi đó là hỏng file.

## 8. Open model và local resources

Có nút `Open model` và drag/drop trong vùng viewer, xử lý hoàn toàn phía trình duyệt; không upload dữ liệu người dùng ra server. Default Tokyo vẫn luôn có hành động `Back to Tokyo` khi đang mở model khác.

- Hỗ trợ file đơn tự chứa: FBX có tài nguyên nhúng phù hợp, GLB, các splat file bundled.
- Hỗ trợ chọn/drop nhiều file cho GLTF + BIN + texture, OBJ + MTL + texture, FBX + texture. Resolve bằng resource map theo relative path; directory selection là progressive enhancement nếu browser hỗ trợ. Khi chỉ có basename và bị trùng, báo ambiguity thay vì lấy file đầu tiên.
- Thiếu sidecar thì liệt kê tên resource cần bổ sung; geometry có thể xem được ở degraded state nếu phù hợp. Không hứa mọi FBX standalone đều textured.
- Không tự động fetch đường dẫn máy tác giả hoặc URL ngoài từ bundle local. Resource resolver local giới hạn ở bộ file người dùng chọn; remote asset descriptor được tin cậy có resource policy riêng.
- Giới hạn file/memory hợp lý được định nghĩa rõ và giải thích bằng UI; compressed file nhỏ không đảm bảo decode nhẹ. Kiểm tra counts/metadata khi decoder cho phép, tránh allocation vô hạn và có error/retry.
- Đổi asset nhanh: asset A load muộn không được ghi đè B. Cleanup tất cả object URL khi thực sự không còn loader dùng; không revoke trước decode. Giải phóng GPU sau nhiều lần đổi asset/unmount.

## 9. Camera: cùng UX, một chủ sở hữu

Chỉ một controller được ghi camera ở một thời điểm. Mode switch tắt controller trước, đồng bộ camera pose/target, bật controller sau; tránh OrbitControls snap về target cũ.

### Orbit, mặc định

Drag rotate, wheel/pinch zoom, pan bằng mapping quen thuộc. Damping vừa phải, khoảng cách min/max theo scene, initial fit dùng cả vertical/horizontal FOV và aspect. Reset khôi phục asset home view và quay về Orbit. Đổi size canvas không auto-fit mỗi frame hoặc giật camera sau khi người dùng đã navigate.

### Fly

Desktop: WASD, Q/E hoặc phím rõ ràng cho lên/xuống, Shift tăng tốc, mouse look. Pointer lock chỉ từ gesture chủ động, xử lý bị browser từ chối, Escape thoát về trạng thái rõ ràng. Delta-time movement, clamp delta sau tab hidden, tốc độ theo bounds. Không di chuyển khi focus input, menu, dialog hoặc khi viewer không active. Xóa key-state khi blur, hidden, pointer unlock; không kẹt phím. Không cam kết collision/walk-on-ground nếu chưa xây physics.

### Cinematic tour

Tokyo có tour ngắn khoảng 20–30 giây với 3–5 keyframe được chọn sau khi nhìn model: establishing view, oblique street/detail, overview. Keyframe lưu position + target/look direction, duration, easing; nội suy vị trí mượt và quaternion/target ổn định, tránh roll/flip. Kiểm tra đường bay không xuyên model hoặc kết thúc trong hư không.

Play/Pause/Restart/Exit có tác dụng thật. Pause không nhảy camera, Resume tiếp tục timeline; hidden tab pause hoặc freeze thời gian để tránh nhảy cóc. Người dùng tương tác thủ công thì dừng tour có chủ đích và chuyển quyền camera sạch. Asset khác không dùng mù quáng keyframe Tokyo: tour vòng ngoài theo bounds an toàn hoặc disable Tour kèm lý do khi chưa đủ bounds.

## 10. Loading, lỗi và vòng đời production

- Loading panel có text theo phase; chỉ hiển thị phần trăm khi biết total đáng tin. Trường hợp total không biết dùng indeterminate. Screen reader thông báo chuyển phase, không spam mỗi frame.
- Suspense fallback khác ErrorBoundary: loader lỗi, init shader lỗi, no WebGL2 và context lost đều phải có UI, không để màn hình đen im lặng.
- Không hỗ trợ GPU/WebGL2: thông báo rõ, cho quay về trang chủ/mở Help; dùng poster Tokyo thật nếu đã tạo từ model, không dùng hình nơi khác để giả screenshot.
- Context lost: ngừng controller, hiển thị Recover/Retry và tái khởi tạo có kiểm soát; không lặp retry vô hạn. UI HTML vẫn hoạt động.
- Cleanup Strict Mode mount/unmount/remount; dispose geometry, material, texture, Spark resource theo ownership; remove event listener, observer, key state, pointer lock, object URL, timeout, subscription. Không forceContextLoss trên renderer R3F vẫn sở hữu và đang dùng.
- Menu mở/panel modal: viewer input phải nhường quyền. Không sửa Header API chỉ để truyền state; có thể đọc trạng thái DOM công khai `aria-expanded`/`data-open` qua bridge scoped hoặc cơ chế focus/inert phù hợp, có cleanup. Test menu Escape không đồng thời kích hoạt camera action.
- Lenis: đặt `data-lenis-prevent` ở vùng tương tác và chỉ chặn wheel/touch cần thiết trong viewport. Wheel ở nội dung ngoài vẫn cuộn trang. Không tắt smooth scroll toàn site vô điều kiện; nếu dùng pause/resume helper thì balance theo lifecycle và menu.
- Fullscreen API cần gesture và bắt promise rejection. Nghe `fullscreenchange`, resize canvas, giữ overlay trong fullscreen container. Trình duyệt không hỗ trợ: cung cấp expand trong trang hoặc disable có lý do; không hiển thị trạng thái fullscreen giả.
- Accessibility: focus visible cho controls mới, tab order rõ, Escape đóng panel, focus restore, aria label/pressed, Help có keyboard/touch instructions. Canvas có mô tả văn bản, không khóa cả trang bằng keyboard trap.

## 11. Performance và release readiness

Lazy load viewer/loader theo route và asset; không preload Tokyo ở homepage. DPR cap khởi điểm mobile khoảng 1–1.5, desktop tối đa 2 rồi đo trên thiết bị thực. ResizeObserver/R3F resize đúng container, không đo `window.innerWidth` như viewport độc lập.

Không bật shadows, bloom, SSAO hoặc postprocessing nặng mặc định. Material/light phù hợp với FBX; Spark có budget/LOD chỉ cấu hình nếu version hỗ trợ và đã đo. Không bật antialias/LOD knobs tưởng tượng. Giảm hoạt động khi tab hidden, giữ camera và playback nhất quán.

Mục tiêu tương tác: khoảng 60 FPS desktop và ít nhất 30 FPS trên thiết bị mobile kiểm tra, nhưng **không tuyên bố đạt nếu chưa đo**. Ghi máy/browser, DPR, asset, thời gian load và frame time bằng công cụ thật. FPS thấp có quality fallback đo được; không chỉ giảm một label trong UI. Static FBX lớn vẫn cần decode main-thread profiling; đưa worker chỉ khi loader/pipeline hỗ trợ đúng.

Kiểm tra production build và chạy production server, tải trực tiếp `/viewroom`, reload, đi từ homepage và quay lại. Kiểm tra workers/WASM/decoder/static assets có URL đúng sau build. Không cần nới CSP/hosting config nếu không có lỗi chứng minh; không tự deploy.

## 12. Kiểm chứng và điều kiện nghiệm thu

Chạy `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` một lượt phù hợp. Nếu baseline có lỗi sẵn, ghi rõ bằng chứng, không sửa vùng ngoài scope. Thêm test có giá trị cho pure logic, dùng test runner Node đang có; không scaffold test framework mới chỉ cho các hàm đơn giản.

Test tự động trọng tâm: texture aliases/path normalization, phân loại format/URL có query/case/blob metadata, missing sidecar/ambiguous path, camera fit với aspect hẹp/rộng và degenerate bounds, dispose/stale-load guard khi khả thi. Test schema PLY theo các fixture thật, không chỉ assert extension.

| Nghiệm thu browser | Kết quả bắt buộc |
| --- | --- |
| Homepage/menu | Entry Viewroom vào đúng route; Hero, globe, News, footer, layout không đổi ngoài entry được phép |
| Tokyo default | Geometry thật, atlas/interiors/alpha nhìn đúng, framing đẹp; thiếu lightmap được xử lý và báo trung thực |
| Orbit/Reset | Chuột/touch đúng, Reset phục hồi pose, không clip hoặc biến mất |
| Fly | Có gesture, không kẹt phím/focus; Escape và blur xử lý đúng |
| Tour | Play/Pause/Restart/Exit thực, không xuyên scene tại keyframe đã chọn |
| Gaussian | Load và render ít nhất một PLY 3DGS thật và một SPZ thật; cùng toolbar/camera |
| Other formats | Có code path thật cho SPLAT/KSPLAT/SOG/GLB/GLTF/OBJ; mỗi format ghi fixture đã thử hoặc chưa kiểm chứng |
| Local import | File đơn, bundle có sidecar, file hỏng, thiếu resource, switch nhanh đều có trạng thái đúng |
| Responsive | 390×844, 768×1024, 1440×900; không tràn ngang, panel/nút không che mất phần lớn model |
| Accessibility | Keyboard, focus, reduced motion, menu overlay, fullscreen và Help có thể sử dụng |
| Failure/recovery | No WebGL2, failed fetch, invalid file, context loss có phản hồi và retry phù hợp |
| Lifecycle | Rời/vào route và đổi model ít nhất 5 lần không tăng listener/context/tài nguyên liên tục |
| Production | Build pass; route trực tiếp và static/decoder assets hoạt động trên production server |

Chụp screenshot viewer desktop/mobile, Tokyo có texture, panel trạng thái và một splat thật; lưu trong `docs/design-references/viewroom/`. Screenshot giúp kiểm tra giao diện, không thay thế test tương tác hay GPU profiling.

Nếu thiếu fixture/thiết bị/browser tools, tiếp tục phần làm được và ghi rõ hạng mục chưa xác minh; không đánh dấu full format support hoặc production verified khi ma trận còn thiếu bằng chứng. Đặc biệt không gọi Gaussian branch hoàn tất chỉ vì TypeScript compile.

## 13. Bàn giao

Trong `docs/research/viewroom/IMPLEMENTATION.md`, ghi kiến trúc thực tế, version đã chọn, asset manifest, texture remapping/degradation, cách thêm PLY/SPZ sau training, danh sách format đã test, lệnh/check results, số đo có môi trường, screenshot paths và giới hạn.

Cách thêm asset tương lai phải đơn giản: đặt file static phù hợp hoặc chọn file local, thêm descriptor với kind/format/resource policy/transform và optional camera preset; **không viết lại toolbar hoặc camera**. Hướng dẫn định dạng optimized chỉ là tùy chọn, không bắt người dùng train/convert để xem được Tokyo FBX hiện tại.

Trước kết thúc, xem diff để đảm bảo source ngoài phạm vi không bị sửa. Báo cáo ngắn bằng tiếng Việt: route và hành vi đã làm, các file chính, tests thực sự chạy, format đã xác minh, thiếu sót thực. Không kết luận “production-ready” từ ảnh screenshot hoặc build pass đơn lẻ.
