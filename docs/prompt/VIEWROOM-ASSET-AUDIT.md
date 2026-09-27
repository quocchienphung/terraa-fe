# Viewroom — repository và Tokyo asset audit

Ngày kiểm tra: 2026-09-27. Đây là bằng chứng đầu vào cho hai master prompt cùng thư mục; không phải báo cáo đã triển khai viewer.

## 1. Những gì thực sự có trong workspace

Không tìm thấy file `.zip` trong workspace khi tìm cả hidden files, bỏ qua `.git`, `node_modules`, `.next`. Không có ZIP đính kèm khả dụng trong phiên này. Đã kiểm tra trực tiếp thư mục `public/3d tokyo`; không khẳng định đây là toàn bộ nội dung ZIP người dùng nhắc đến.

| File | Dung lượng byte | URL trình duyệt |
| --- | ---: | --- |
| `public/3d tokyo/source/Export.fbx` | 16,398,432 | `/3d%20tokyo/source/Export.fbx` |
| `public/3d tokyo/textures/Atlas.jpg` | 3,447,896 | `/3d%20tokyo/textures/Atlas.jpg` |
| `public/3d tokyo/textures/Interiors.jpg` | 83,387 | `/3d%20tokyo/textures/Interiors.jpg` |
| `public/3d tokyo/textures/props_alpha.png` | 721,072 | `/3d%20tokyo/textures/props_alpha.png` |

Không tìm thấy model `.ply`, `.spz`, `.splat`, `.ksplat`, `.sog`, `.glb`, `.gltf`, `.obj` trong kết quả rà soát asset ban đầu. Chưa có bằng chứng về tác giả/license của Tokyo trong thư mục này; không tự gán attribution hoặc tuyên bố quyền phân phối.

## 2. Kết quả đọc cấu trúc binary FBX

Đã đọc node/property của file bằng Node.js, bỏ qua payload geometry nén khi lấy metadata. Chưa render model trong trình duyệt và chưa đánh giá bằng mắt chất lượng vật liệu/góc máy.

| Thuộc tính | Kết quả |
| --- | --- |
| Header | Kaydara FBX Binary |
| FBX version | 7200 |
| Creator | FBX SDK/FBX Plugins version 2014.0.1 |
| CreationTime trong file | 2018-05-30 22:32:33:047 |
| Geometry nodes | 54 |
| Model nodes | 86 |
| Material nodes | 15 |
| Texture nodes / Video nodes | 14 / 14 |
| Tổng vertex positions khai báo | 99,337 |
| Tổng PolygonVertexIndex entries | 422,953 |
| UpAxis / UpAxisSign | 1 / 1, tức +Y trong metadata |
| FrontAxis / FrontAxisSign | 2 / 1 |
| UnitScaleFactor / OriginalUnitScaleFactor | 0.1 / 0.1 |

Các số trên là cấu trúc file, **không phải** draw calls, GPU vertices hoặc triangle count sau khi Three.js triangulate. Không suy ra kích thước thực tế chỉ từ UnitScaleFactor; kiểm tra transform và world bounds sau load.

### Vấn đề texture cần xử lý có chủ đích

File còn chứa đường dẫn Windows tuyệt đối trên máy tác giả. Các relative reference duy nhất tới ảnh gồm:

| Reference trong FBX | File hiện có | Hướng xử lý |
| --- | --- | --- |
| `..\Atlas.psd` | `textures/Atlas.jpg` | Alias có khả năng tương ứng; kiểm chứng UV và hình ảnh |
| `..\props\props_alpha.psd` | `textures/props_alpha.png` | Alias có khả năng tương ứng; kiểm chứng kênh alpha |
| `..\props\props_alpha.png` hoặc `props_alpha.png` | `textures/props_alpha.png` | Resolve về đúng public URL |
| `Interiors.jpg` | `textures/Interiors.jpg` | Resolve về đúng public URL |
| `LM_Final.tga` | Không có | Kiểm tra connection/material slot; không giả vờ đã có lightmap |

Không tìm thấy `Content` chứa ảnh nhúng trong các Video nodes đã đọc. Vì vậy không dựa vào embedded texture để bù file thiếu.

Đã xem `node_modules/three/examples/jsm/loaders/FBXLoader.js`: bản cài hiện tại chọn loader qua extension, rồi tải filename bằng texture loader; `LoadingManager` và resource path là điểm tích hợp cần kiểm tra. Không sửa loader trong `node_modules`. Không chỉ gọi `setResourcePath()` rồi cho rằng reference `.psd` tự đổi thành `.jpg`.

Ưu tiên một resolver riêng cho Tokyo: chuẩn hóa slash/basename, ánh xạ chính xác các tên biết trước, giữ nguyên URL `blob:`/`data:`, không áp dụng fallback Atlas cho mọi texture bị thiếu. Với `LM_Final.tga`, truy connection tới material slot trước khi chọn bỏ map không thiết yếu hoặc cấp texture trung tính theo slot. Báo rõ sai khác; model phải vẫn xem được. Đừng thêm TGALoader chỉ để tải một file không tồn tại.

## 3. Hiện trạng framework và phạm vi integration

`package.json` đang dùng:

- Next.js **16.3.5**, App Router; React / React DOM **19.2.4**.
- Three.js `^0.186.1`, `@types/three` `^0.186.0`.
- TypeScript strict, Tailwind v4, Lucide, Lenis.
- Chưa khai báo `@react-three/fiber`, `@react-three/drei`, `@sparkjsdev/spark` hoặc Vite trong dependencies.
- Scripts có `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `check`.

Vì yêu cầu ưu tiên không đụng layout và các phần khác, integration mặc định của prompt là Next.js hiện hữu + viewer core React/TypeScript có thể tái sử dụng trong Vite. **Đây là quyết định phạm vi, không phải khẳng định repo đang chạy Vite.** Một host Vite riêng chỉ nên là công việc bổ sung được yêu cầu rõ sau này.

### Các file cần đọc, không tự ý sửa

- `src/app/page.tsx`: lắp Header, Hero, các section, News, CTA và Footer.
- `src/app/layout.tsx`: fonts, metadata toàn site và SmoothScroll.
- `src/app/globals.css`: tokens và style toàn site.
- `src/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/Header.tsx`.
- `src/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/MenuOverlay.tsx`.
- `src/components/sites/anodeenergy-framer-website-108d0ac2/shared/SmoothScroll.tsx`.
- `src/lib/constants.ts`: nội dung menu và footer nằm chung file.
- `docs/research/anodeenergy-framer-website-108d0ac2/root-8a5edab2/DESIGN_TOKENS.md`.

`MENU.secondary` chứa `{ label: "Newsroom", href: "/news/filters/all" }`: đây là entry được thay bằng Viewroom. Footer có entry Newsroom khác, nằm trong nhóm Media: giữ nguyên theo phạm vi yêu cầu. Không replace-all chuỗi Newsroom.

Header fixed cao 72px mobile / 86px từ breakpoint `tab`, z-index 60; MenuOverlay z-index 50. Header chọn màu thông qua vùng `[data-nav-theme="dark"]`. Route mới phải chừa chỗ header và đặt theme đúng, không sửa logic header. Root đã có Lenis: ngăn xung đột wheel/touch bằng vùng viewer có `data-lenis-prevent` và quản lý input cục bộ.

### UI đang có

- Geist cho body/heading; Spline Sans Mono, Fragment Mono, PT Mono cho label kỹ thuật.
- Ink `#0a0a0a`, ink-2 `#121212`, panel `#f5f5f5`, line `#e4e4e4`, brand `#00e05c`.
- Gutter mobile 16px, desktop thường 32px; max-width 1800px.
- Breakpoints `tab: 50.625rem`, `desk: 75rem`, `wide: 87.5rem`.
- Typography lớn, tracking âm, đường kẻ mảnh, các nút có sweep; hạn chế border radius tùy tiện.

Nguồn thực thi là `globals.css` và component hiện tại; tài liệu research có thể cũ hơn source.

### Baseline git

Khi bắt đầu audit đã có thay đổi của người dùng tại `Hero.tsx`, và `public/3d tokyo/` là thư mục untracked. Giữ nguyên các thay đổi này. Không reset, clean, tự commit hoặc stage tài sản của người dùng. Kiểm tra lại baseline khi thực thi vì trạng thái có thể đổi.

## 4. Nguồn kỹ thuật đã đối chiếu

- [Spark overview](https://sparkjs.dev/docs/overview/): Three.js + WebGL2 và tích hợp splat vào scene hiện có.
- [Spark loading](https://sparkjs.dev/docs/loading-splats/): định dạng và giới hạn auto-detection, đặc biệt `.splat` / `.ksplat` khi dùng URL không có extension.
- [Spark SplatMesh](https://sparkjs.dev/docs/splat-mesh/) và [SparkRenderer](https://sparkjs.dev/docs/spark-renderer/): kiểm tra lại API theo bản package thực sự cài.
- [Spark getting started](https://sparkjs.dev/docs/): trang tại thời điểm kiểm tra có ví dụ dòng 2.x; không trộn snippet của 0.1 với API 2.x.
- [React Three Fiber README](https://github.com/pmndrs/react-three-fiber): cặp React 19 / Fiber 9; kiểm chứng peer dependencies của phiên bản chọn.
- [Three FBXLoader](https://threejs.org/docs/pages/FBXLoader.html), [LoadingManager](https://threejs.org/docs/pages/LoadingManager.html), [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [OBJLoader](https://threejs.org/docs/pages/OBJLoader.html), [MTLLoader](https://threejs.org/docs/pages/MTLLoader.html).
- Next.js local guides đã đọc: `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` và `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`. `ssr: false` phải nằm trong Client Component boundary, không đặt trực tiếp trong Server Component.

Các nguồn này xác nhận khả năng thư viện, **chưa xác nhận viewer của dự án render thành công**. Chưa có runtime benchmark hoặc format smoke test trong công việc viết prompt này.
