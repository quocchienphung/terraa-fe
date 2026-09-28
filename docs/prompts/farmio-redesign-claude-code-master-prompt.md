# Master prompt — Farmio redesign + giữ Viewroom, logo ticker và Earth

> Dành cho Claude Code chạy tại repository hiện tại. Đây là yêu cầu **triển khai code và kiểm chứng đến khi hoàn thành**, không phải yêu cầu viết thêm proposal.
> Ngày chuẩn bị: 2026-09-28. Đọc kèm [ghi chú khảo sát](./farmio-redesign-source-audit.md). Các đường dẫn bên dưới tính từ root repository; kiểm tra lại trạng thái thật trước khi sửa.

## 1. Vai trò và kết quả tôi cần

Bạn là lead frontend engineer kiêm visual implementation engineer. Hãy dùng AI agents, công cụ đọc source và browser automation để xây lại website trong **chính source code hiện tại của tôi**, lấy Farmio làm chuẩn giao diện với độ chính xác cao về bố cục, font, ảnh, màu sắc, khoảng cách, responsive và chuyển động.

Nguồn tham khảo:

- Website đang chạy: https://farmio.framer.website/
- Framer project: https://framer.com/projects/Farmio-Agriculture-Landing-Page-copy--EumX2tGiyHVZqt1CEiss-4EQvt?node=augiA20Il

Hai URL này là hai cách xem **cùng một thiết kế**. Framer editor không phải một website thứ hai cần clone, không phải Figma, không phải một route trong ứng dụng.

Kết quả bắt buộc:

1. Route `/` dùng bố cục và phong cách Farmio, triển khai đầy đủ các section của trang tham khảo.
2. Giữ route `/viewroom` và toàn bộ khả năng 3D đang có; thiết kế lại giao diện Viewroom theo cùng hệ thống thiết kế Farmio.
3. Giữ dải logo chạy của source cũ, gồm logo, thước vạch chạy và con trỏ ở giữa; tích hợp vào trang mới.
4. Giữ quả địa cầu 3D thật của source cũ, hình ảnh Earth chân thực và các tương tác; tích hợp thành section hợp ngữ cảnh trang mới.
5. Build chạy được; các hành vi quan trọng vẫn hoạt động; có ảnh đối chiếu và báo cáo những gì đã kiểm chứng.

**Định nghĩa thành công:** người xem nhận ra Farmio ngay qua giao diện tổng thể; ticker và globe hòa vào trang; Viewroom trông như một phần của cùng website và vẫn vận hành như trước.

## 2. Phạm vi được phép thay đổi và thứ tự ưu tiên

Tôi cho phép thay giao diện trang chủ hiện có ở `/`, giao diện `/viewroom`, navigation, footer, font, metadata và styling cần thiết để thực hiện lần redesign này. Không cần hỏi lại việc thay trang chủ chỉ vì workflow clone mặc định bảo vệ route đã tồn tại.

Ưu tiên khi có xung đột:

1. Yêu cầu trong prompt này và bảo toàn tính năng/dữ liệu người dùng.
2. Logic Viewroom, engine Earth và cơ chế ticker hiện có.
3. Giao diện và hành vi quan sát được trên Farmio live.
4. Thông số/layer/variant từ Framer editor để giải thích thêm.
5. Checklist trong skill clone và quy ước repository.

Các ngoại lệ có chủ đích so với bản clone thuần: bổ sung ticker, globe, link Viewroom và thiết kế Viewroom. Chỉ những phần này được cần thiết kế tích hợp. Các section Farmio còn lại phải bám bản gốc, không tự làm lại theo gu riêng.

- Không tạo project Next/Vite mới, không thay framework, không nhúng toàn bộ Farmio bằng iframe.
- Không xóa source cũ hàng loạt. Có thể ngừng render các section Anode cũ; giữ file và asset đang được ba phần bảo toàn sử dụng.
- Không reset/stash/checkout đè thay đổi của tôi. Không tự commit, push, deploy hoặc publish Framer.
- Không tự nâng Next, React, Three, Fiber, Spark hay thay lockfile để giải quyết vấn đề layout.
- Không dựng backend, auth, thanh toán hay dashboard mới ngoài yêu cầu.
- Nếu source khác snapshot trong tài liệu, code hiện tại là căn cứ; cập nhật audit trước khi chỉnh sửa.

## 3. Đọc và kiểm tra trước khi viết code

Đọc:

- `AGENTS.md`, `CLAUDE.md` và mọi instruction áp dụng trong thư mục con.
- `.agents/skills/clone-website/SKILL.md` cùng `references/inspection-guide.md`.
- Guide liên quan trong `node_modules/next/dist/docs/` về App Router, Server/Client Components, lazy loading, font và image. Đây là Next.js phiên bản trong repo, không áp dụng API cũ theo trí nhớ.
- `package.json`, `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/viewroom/page.tsx`.
- `docs/research/viewroom/IMPLEMENTATION.md`.
- `docs/research/earth-interaction-realism.md` và `public/textures/earth/MANIFEST.md`.
- `docs/research/anodeenergy-framer-website-108d0ac2/root-8a5edab2/components/ClientTicker.spec.md` và `GlobalFootprint.spec.md` để biết lịch sử; code hiện tại và kiểm thử mới ưu tiên hơn spec cũ.
- `docs/prompts/earth-interaction-realism-claude-code.md` **nếu tồn tại**. Lần khảo sát này đường dẫn trong IDE không có trên disk; không phụ thuộc file đó để tiếp tục.

Làm baseline:

1. `git status --short`, kiểm tra diff hiện có, inventory route, assets, tests và dependency.
2. Chạy các lệnh hiện có: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Ghi lỗi đã có từ trước riêng với lỗi do mình tạo.
3. Mở local `/` và `/viewroom`; chụp desktop/mobile. Kiểm tra logo ticker, globe và viewer trước khi sửa.
4. Ghi contract/tính năng hiện tại, đường dẫn asset, known limitations. Không biến tính năng chưa hỗ trợ thành “regression” giả và không tuyên bố hỗ trợ mới khi chưa kiểm chứng.
5. Lập output plan: `/` cập nhật; `/viewroom` giữ đường dẫn và đổi presentation; các route khác giữ trừ phần phụ trợ cần thiết cho liên kết thực tế.

Nếu môi trường cản một phép kiểm tra, ghi nguyên nhân thật và tiếp tục phần độc lập. Không ghi PASS cho lệnh chưa chạy. Không dùng baseline lỗi như lý do bỏ qua toàn bộ verification cuối.

## 4. Bản đồ source cần bảo toàn

Quy ước viết tắt chỉ trong tài liệu:

- `OLD_PAGE` = `src/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/`
- `OLD_SHARED` = `src/components/sites/anodeenergy-framer-website-108d0ac2/shared/`

### 4.1. Logo ticker

- `OLD_PAGE/ClientTicker.tsx`
- `OLD_SHARED/TickerMotion.tsx`
- `OLD_SHARED/icons.tsx` — `MARQUEE_LOGOS`
- `src/lib/ticker-math.ts`, `src/lib/motion-config.ts` — `TICKER`
- `src/hooks/use-reduced-motion.ts`
- Caption hiện lấy từ `TICKER_EYEBROW` trong `src/lib/constants.ts`.

### 4.2. Earth

- `OLD_PAGE/GlobalFootprint.tsx`
- Toàn bộ `OLD_PAGE/globe/`: `EarthCanvas.tsx`, `create-earth-scene.ts`, `earth-config.ts`, `project-markers.ts`, `rotation-input.ts`, `trackball.ts`.
- `MAP`, `MAP_LOCATIONS` trong `src/lib/constants.ts`; kiểu dữ liệu trong `src/types/anode.ts`.
- `public/textures/earth/**`, poster được khai báo bởi `MAP.image`, các icons và utility mà globe đang import.

### 4.3. Viewroom

- Entry: `src/app/viewroom/page.tsx`, `src/components/viewroom/ViewroomClient.tsx`, `ViewroomShell.tsx`.
- Engine: `TerraViewport.tsx`, `ViewerScene.tsx`, `AssetRenderer.tsx`, `CameraController.tsx`, `SparkProvider.tsx`, `DaylightRig.tsx`.
- Presentation có logic gắn kèm: `ViewerHud.tsx`, `ViewerPanels.tsx`, `ViewerLoading.tsx`, `ViewerFallback.tsx`, `OpenModelMenu.tsx`.
- Hành vi: `viewerHooks.ts`, `viewerCommands.ts`, `useSiteMenuOpen.ts`.
- Core: toàn bộ `src/lib/viewroom/**`, đặc biệt manifests, types, adapters, resolver, local bundle, detect format, camera fit, tour và disposal.
- Assets: theo `viewerManifest.ts` và các URL thật trong source; `public/viewroom/**` là một phần inventory, không được giả định tất cả models nằm ở `public/models/`.
- Tests: `tests/viewroom-*.test.ts`, `tests/globe-geo.test.ts`, `tests/trackball.test.ts`, `tests/rotation-input.test.ts`, `tests/motion-helpers.test.ts`.

Giữ API ổn định nếu có thể. File UI chứa state/handler không có nghĩa là được xóa logic khi thay JSX. Trước khi refactor, liệt kê props, events, state, side effects và lifecycle cần giữ.

## 5. Khảo sát Farmio thật trước khi triển khai từng section

Dùng browser automation đang có. Mở cả live site và Framer editor ở chế độ đọc. Nếu editor không truy cập được trong phiên của bạn, dùng live site làm chính và ghi hạn chế; không chờ vô thời hạn, không yêu cầu credential qua chat.

Ở mỗi section, thu thập:

- Screenshot desktop 1440×900, tablet 768×1024, phone 390×844; thêm full page và ảnh từng trạng thái.
- DOM hierarchy; kích thước container, max-width, gutters, grid/flex, gap, padding, radius, shadow, overflow, vị trí sticky và z-index.
- Computed CSS của heading/body/label/button; font thật, weight và variable font axes, line-height, letter-spacing.
- Mọi lớp ảnh/video/overlay, `object-fit`, `object-position`, aspect ratio, gradient và SVG.
- Text hiển thị, đích link/anchor, trạng thái hover/focus/active/open/closed, hành vi bàn phím.
- Loại tương tác: scroll, click, hover, autoplay hoặc kết hợp; ghi trigger, state trước/sau, duration, easing, khoảng sticky.
- Responsive thực tế; không chỉ thu nhỏ desktop bằng CSS scale.

**Scroll trước khi click** để phân biệt scroll-driven và click-driven. Không suy đoán carousel hay sticky chỉ từ ảnh tĩnh. Đợi font/media tải và animation settle trước khi đo ảnh final; chụp riêng animation nếu cần.

Framer có thể tạo nhiều node cho breakpoint, animation hoặc bản sao loop. Chỉ lấy nội dung logic một lần; không render ba lần cùng section vì DOM có ba variants.

Tạo research/asset namespace mới theo quy tắc site-key/page-key của skill. Viết spec cho section trước khi giao builder. Mỗi số đo ghi rõ `measured`, `observed`, hoặc `proposed`; không gọi số tự chọn là thông số lấy từ bản gốc.

### Section inventory ban đầu — phải đối chiếu lại

| Phần | Điều phải khảo sát và tái hiện |
| --- | --- |
| Header | Thanh navigation trắng dạng pill, logo, links, CTA lime; trạng thái khi cuộn, menu tablet/mobile |
| Hero | Ảnh nông nghiệp phủ nền, overlay tối, headline lớn, eyebrow, media card nhỏ, mô tả và CTA; đo đúng crop và khoảng trống |
| About | Heading lớn và bốn thống kê; kiểm tra reveal/counter thực tế |
| Solutions | Ba card ảnh, title/body/badges; đo chiều cao, radius và bố cục responsive |
| Services | Năm nội dung 01–05; desktop/tablet và phone có cấu trúc khác; xác minh sticky/scroll transition, không đổi thành tabs tùy ý |
| Features / impact | Nội dung về tác động, hai số liệu nổi bật và ảnh; giữ bố cục gốc |
| How it works | Ba bước; giữ đúng grid, divider, hierarchy và motion quan sát được |
| Gallery | Bảy ảnh trong cấu trúc quan sát được; giữ crop, tỷ lệ, gaps và hành vi thật |
| Team | Ba hồ sơ; giữ ảnh, tên/vai trò và states theo nguồn |
| Testimonials | Bốn nội dung; kiểm tra autoplay, arrows, pagination, drag/swipe, loop, pause thay vì giả định |
| FAQ | Sáu câu hỏi; mở từng câu, lấy nội dung, kiểm tra single/multiple-open và animation |
| CTA cuối | Background/lớp ảnh, heading, button và khoảng đệm |
| Footer | Logo, mô tả, nhóm link, email, social và copyright |

Không bỏ các section phía cuối trang vì ưu tiên hero. Không sao chép badge quảng cáo “Made in Framer” như tính năng sản phẩm.

## 6. Asset, font và nội dung

- Tải đúng ảnh, SVG, video, poster và font được tham chiếu bởi nguồn nếu có quyền truy cập; lưu local trong namespace Farmio. Ghi URL nguồn, tên local, kích thước và section sử dụng.
- Không dùng ảnh ngẫu nhiên, placeholder, emoji thay icon, ảnh screenshot của toàn section hoặc ảnh AI để giả nội dung gốc.
- Giữ phân lớp của hero/cards; không bỏ foreground/overlay chỉ vì đã tải background.
- Không hotlink tài nguyên quan trọng nếu có thể lưu local. Kiểm tra response là file thật, không phải HTML lỗi; tránh tải ảnh thumbnail làm ảnh hero.
- Font quyết định độ giống. Đo và kiểm tra file/axes thật; không thay bằng Geist/Inter vì đã cài sẵn.
- Lần đo ban đầu thấy BDO Grotesk Variable, ink `#04303b`, CTA `#e7f352`; đây là điểm bắt đầu, không thay cho extraction toàn bộ.
- Computed weight của heading từng trả về `1000`; phải kiểm tra `font-variation-settings`, font-face và con chữ thực tế trước khi chuyển thẳng thành font-weight 1000.
- Mặc định giữ ngôn ngữ/nội dung Farmio cho các section clone để fidelity có thể so sánh. Không tự viết một bộ marketing copy Terra mới, bịa đối tác, số liệu, đánh giá hay đội ngũ.
- Nội dung cũ thuộc ngành năng lượng không tự động trở thành thông tin nông nghiệp. Với ticker/globe, tách presentation copy khỏi dữ liệu; dùng caption trung tính, không biến địa điểm demo thành farm thật.
- Model Tokyo và các fixture vẫn phải được nhận diện đúng là prototype/dev fixture, không gọi là dữ liệu cây trồng hoặc bản scan nông trại thật.
- Nếu metadata/brand cũ “Anode Energy” không còn đúng trang mới, cập nhật theo giao diện đang triển khai; attribution model/texture phải giữ.
- Link nội bộ phải trỏ tới anchor/route có thật. `/viewroom` và link Home phải hoạt động cả khi đang ở route khác (`/#about`, không phải `/viewroom#about`).
- Với Contact/Get started: khảo sát đích `/contact-us` của nguồn. Để hoàn chỉnh luồng, có thể tạo trang contact phụ trợ bám nguồn nếu cần, ghi rõ trong route plan. Không giả báo “gửi thành công” khi không có backend; không gửi form thử tới dịch vụ thật. Không mở rộng thành hệ thống CRM/auth.

## 7. Ghép logo ticker vào Farmio

Vị trí mặc định: **ngay sau hero, trước About**. Đây là phần bổ sung của người dùng, không phải section đo từ Farmio.

Giữ các đặc điểm theo screenshot và code cũ:

- Logo monochrome thật, chạy ngang liên tục; duplicate runs để loop không hở/giật.
- Thước vạch nhỏ/lớn bên dưới là track riêng; giữ con trỏ đứng yên ở giữa và tam giác chỉ thị.
- Pill caption ở phía trên, khoảng thở và tỷ lệ logo phù hợp ảnh người dùng.
- Giữ hành vi scroll coupling đang có, pause, visibility/offscreen và reduced motion; không thay toàn bộ bằng CSS marquee đơn giản nếu làm mất các hành vi đó.
- Cấu hình hiện tại: logo 40 px/s, ruler 56 px/s; không tự thay tốc độ cho “sôi động hơn”. Đo source hiện tại trước khi dùng làm baseline.
- Duplicate logo runs phải ẩn với assistive technology; không tạo hàng chục focus target vô nghĩa.

Được điều chỉnh: padding section, nền trắng/off-white, màu caption/ink và font để khớp Farmio. Giữ hình dạng/logo/ruler/cursor và nhịp chuyển động. Caption cũ về power grid phải đổi sang lời trung tính đúng ngữ cảnh, không bịa quan hệ hợp tác.

Không tạo thêm một partner logo grid khác trùng chức năng. Kiểm tra màn hình hẹp không tràn ngang body và không cắt pill caption.

## 8. Ghép Earth vào Farmio

Vị trí mặc định: **sau Features / impact, trước How it works**. Giữ nguyên section Features của Farmio; thêm globe như phần mở rộng của chủ đề tác động/phạm vi toàn cầu. Không thay hero bằng globe.

Hướng tích hợp:

- Một section tối với Earth chân thực, kích thước lớn, nhìn cận, phần dưới có thể crop như screenshot người dùng.
- Heading, eyebrow, khoảng cách, controls và cards lấy ngôn ngữ Farmio. Có thể chọn nền dark ink hòa với Farmio; đồng bộ background của wrapper, renderer và overlay để không xuất hiện khung màu lệch.
- Giữ day/night, city lights, cloud layer/drift, atmosphere, relief, texture tiers và cảm giác chiều sâu của phiên bản hiện tại.
- Không thay Earth bằng ảnh, video, globe chấm, wireframe hay thư viện globe mới. Poster chỉ là loading/error fallback.
- Không tự thay tọa độ, loại marker hoặc số địa điểm bằng dữ liệu nông trại bịa. Giữ dataset và khai báo demo nếu chưa có dữ liệu nghiệp vụ mới; dùng heading trung tính phù hợp.
- Giữ pin selection, info card, previous/next, counter, Pause/Play, focus tới vị trí và keyboard path hiện có.
- Giữ drag/trackball, pointer capture, inertia/hover steering đúng source mới nhất; không phục hồi một phiên bản cũ từ screenshot.
- Giữ phân biệt pause của người dùng, UI hold, reduced motion và explicit drag; card hover/focus không làm mất state.
- Giữ vùng thao tác và scroll gutters trên touch; người dùng vẫn cuộn trang được ngoài vùng kéo globe.
- Các tọa độ DOM pins/cards phải theo cùng orientation/camera của Earth sau khi đổi kích thước wrapper. Kiểm tra che khuất mặt sau và mép màn hình.
- Giữ lazy mount khi gần viewport, client-only WebGL, dừng loop ngoài màn hình/tab ẩn, resize, disposal, context-loss/texture failure fallback.

Tái sử dụng engine; thay lớp trình bày có kiểm soát. Globe không dùng chung renderer/camera với Viewroom — đó là hai trải nghiệm riêng. Không import engine Viewroom vào homepage để “dùng chung 3D”.

## 9. Viewroom: thay layout, giữ chức năng thật

**Không được hiểu “giữ Viewroom” là giữ nguyên trang đen cũ rồi chỉ đổi header.** Phải thiết kế lại shell, title area, controls, panels, loading/error states cho cùng sản phẩm Farmio.

Farmio không có Viewroom tham khảo trực tiếp. Do đó ghi rõ đây là thiết kế suy ra từ design system Farmio, không tuyên bố là clone pixel-perfect một trang không tồn tại.

### Presentation mong muốn

- Header/footer dùng chung với homepage mới, link Viewroom rõ ràng cả desktop/mobile; thể hiện active route.
- Nền trang, font, heading, section width, pill buttons, border/radius và khoảng cách theo token Farmio đã đo.
- Viewer là vùng tương tác chính, đủ lớn để thao tác; không ép vào card nhỏ vì muốn giống landing page.
- Canvas có thể giữ nền kỹ thuật phù hợp scene. Chrome bao quanh, toolbar, popover, info/help panel và status phải thống nhất màu/hierarchy mới.
- Desktop: title/context, viewport rộng, toolbar rõ và các panel theo vùng không che hành động chính.
- Mobile: viewport chiều cao sử dụng được, controls wrap/nhóm hợp lý, panel có thể dạng sheet nếu cần; có safe area, hit target tốt và không che canvas toàn bộ.
- Không thêm bảng số liệu nông nghiệp, dashboard/sidebar hoặc tính năng giả để lấp chỗ trống.
- Giữ tên hành động quen thuộc hoặc nhãn tương đương rõ ràng. Loading/progress/error/warnings phải đọc được trên mọi nền.

### Logic bắt buộc giữ

1. Một R3F Canvas → một renderer/scene/camera cho mesh và splat trong Viewroom; Spark dùng renderer của R3F.
2. Camera Orbit/Fly/Tour, reset, fullscreen, chuyển mode không snap; keyboard/pointer ownership, tour cancellation và bàn giao camera pose.
3. Manifest/API, texture aliases/material overrides, quality settings và adapter registry.
4. Chọn sample, mở local files/folder, drag & drop, bundle relative paths, texture resolution, Back to Tokyo.
5. FBX/GLB/glTF/OBJ và các nhánh Gaussian theo khả năng thật hiện tại. Giữ thông báo với file không hỗ trợ, file hỏng, thiếu texture/bin, schema PLY sai.
6. Lazy loading: homepage không tải Fiber/Spark/Tokyo/viewer adapters vì có link Viewroom; viewer mesh không tải Spark cho tới khi cần splat.
7. Abort khi đổi asset/unmount, chống kết quả load cũ ghi đè mới, thu hồi blob URL đúng thời điểm, dispose resource không double-free.
8. Poster/fallback, WebGL unsupported/context failure, retry nếu đang có, progress, warnings, info/help và attribution.
9. Không làm mất asset đang mở hoặc camera pose chỉ vì mở menu, đổi panel hay re-render layout.

### Hai điểm nối phải xử lý rõ

**Menu input lock:** `useSiteMenuOpen.ts` đang quan sát `#site-menu[data-open]`. Nếu thay header/menu:

- Hoặc duy trì contract này với element tồn tại ổn định và trạng thái cập nhật đúng.
- Hoặc thay bằng shared state/context rõ ràng và cập nhật đồng bộ Viewroom.
- Hook hiện tại không tự tìm lại element nếu lúc effect chạy menu chưa mount. Đừng tạo menu conditionally rồi giả định MutationObserver cũ vẫn hoạt động.
- Khi menu/dialog mở, Fly/camera không nhận phím/chuột ngoài ý muốn; Escape/focus restoration/body scroll lock phải đúng.

**Smooth scroll:** root layout đang mount `SmoothScroll` dùng Lenis. Đánh giá lại với Farmio, không thêm Lenis/scroll driver thứ hai. Kiểm tra wheel zoom trong viewer, drag globe, scroll panels, anchors, menu lock và cleanup. Preserve `data-lenis-prevent*` hoặc cơ chế tương đương ở vùng cần native input.

### Known limitations không được che giấu

Đọc report hiện tại để xác nhận lại: Draco/KTX2/Meshopt chưa cấu hình; Spark 2.2 có giới hạn SPZ v4 và một số SOG; PLY mesh/point cloud không đồng nghĩa PLY Gaussian; glTF Gaussian không được giả làm point cloud; `.splat/.ksplat` từng chưa có fixture kiểm chứng. Redesign không tự động giải quyết các giới hạn này.

## 10. Kiến trúc, styling và tổ chức AI agents

Giữ Next App Router + React + TypeScript strict + Tailwind v4 và hệ component đang có. Dùng client boundary nhỏ cho interaction; không thêm `use client` cho toàn website để né SSR.

- Tạo component/asset/research namespace Farmio riêng theo skill; không chép trọn thư mục Anode rồi sửa text.
- Shared Farmio header/footer/button/section/container dùng cho `/` và `/viewroom`.
- Tách content data khỏi JSX khi cần; tránh một component nghìn dòng.
- Token mới cần scope rõ. Không replace toàn cục `brand`, `ink`, font hoặc breakpoint mà không rà tác động tới globe/viewer.
- `tab` hiện tại là 810px, trong khi Framer editor hiển thị tablet bắt đầu 768px. Không mặc định tái sử dụng breakpoint cũ cho Farmio. Kiểm tra cả 767/768 và 1199/1200.
- Giữ utility `.glass` và CSS cũ còn được sử dụng, hoặc thay bằng component/style tương đương có kiểm thử. Không xóa global rules chỉ vì homepage mới không trực tiếp import.
- Theo AGENTS: named exports, PascalCase components, camelCase utils, 2-space indent, không `any`, Tailwind utilities. Không lạm dụng inline styles; giữ dynamic transforms/renderer updates cần thiết trong engine đang hoạt động, không rewrite chúng chỉ để làm đẹp diff.
- Không đưa Framer runtime/export nguyên khối vào app. Tái hiện hành vi bằng code dễ bảo trì; chỉ thêm dependency khi thư viện hiện tại thực sự thiếu và ghi lý do.

Sử dụng nhiều agents khi môi trường hỗ trợ, nhưng lead agent chịu trách nhiệm integration:

1. Lead audit repo + reference, chốt route plan, token và interfaces chung; foundation phải xong trước khi builder phụ thuộc vào nó.
2. Giao builder theo từng section/spec nhỏ; mỗi agent có file ownership, asset paths, screenshot và CSS/state spec đầy đủ.
3. Một agent có thể phụ trách ticker/globe presentation; một agent Viewroom presentation + kiểm tra contract; chia section Farmio thành task riêng vừa sức.
4. Không cho nhiều agents cùng ghi `globals.css`, `layout.tsx`, `package.json`, shared tokens hoặc cùng một UI/engine file. Lead sở hữu các file chung.
5. Nếu dùng worktree, bảo đảm nhìn thấy baseline có thay đổi chưa commit; không dùng branch từ HEAD làm mất dependencies/source đang có. Không tự merge vào main hoặc auto-commit ngoài phạm vi được phép.
6. Mỗi agent phải báo file sửa, contract giữ, validation đã chạy, vấn đề chưa xong. Lead review diff rồi tích hợp tuần tự, không nhận lời “xong” thay cho kiểm chứng.
7. Nếu không có subagent tool, làm tuần tự với cùng quality gates. Không dừng ở việc đề xuất cần một đội agents.

## 11. Quy trình triển khai có checkpoint

### A — Audit và contracts

Baseline source/visual/tests; map dependency ba phần bảo toàn; nghiên cứu topology Farmio và route plan. Viết migration matrix `giữ / restyle / thay / thêm` theo file.

### B — Foundation và trang Farmio

Chốt fonts/tokens/assets, shared header/footer, container/button; triển khai từng section theo spec. Tiếp tục extraction section sau trong khi builder làm section đã có spec. Giữ tất cả section gốc và states responsive.

### C — Tích hợp phần giữ lại

Gắn ticker sau hero và globe sau impact. Restyle presentation; kiểm thử engine ngay sau từng lần gắn. Không đợi hoàn thành toàn trang mới phát hiện ticker/globe đã mất interaction.

### D — Viewroom

Thay shell và UI theo Farmio; giữ props/state/lifecycle. Xử lý menu contract, navigation, smooth scroll, resize/fullscreen và loading/error states. Chạy lại fixtures thật.

### E — Visual QA và regression

So sánh bản local với live ở cùng viewport, section, scroll progress và state. Sửa theo thứ tự: font → layout/crop → spacing → màu/viền → motion/microinteraction. Lặp đến khi hết sai khác lớn, không chỉ chụp hình rồi kết luận đẹp.

### F — Handoff

Chạy checks cuối, ghi evidence, kiểm tra diff không làm mất thay đổi cũ. Báo ngắn gọn kết quả và hạn chế thật. Không dừng sau A hoặc B vì đã có một hero nhìn gần giống.

Trong quá trình dài, cập nhật tiến độ ngắn, lưu checkpoint gồm việc hoàn tất, file đang sửa, tests và bước kế tiếp. Sau context reset, đọc checkpoint và tiếp tục; không audit lại từ đầu.

## 12. Ma trận kiểm chứng bắt buộc

### Giao diện và navigation

- 1440×900, 768×1024, 390×844: `/`, `/viewroom`; kiểm tra thêm 360px và desktop rộng 1920/2560 cho phần crop/globe.
- Cạnh breakpoint 767/768 và 1199/1200: menu, card grid, services, viewer toolbar không vỡ.
- Tất cả section, đúng thứ tự; không ảnh mất, text tràn, khoảng trắng vô lý, duplicate heading do variant.
- Mobile menu, links/anchors từ từng route, Back/Forward, reload trực tiếp `/viewroom`, focus/keyboard, CTA không chết.
- Services đi qua đủ 5 nội dung, đi xuống và lên; FAQ mở mọi câu; testimonials chuyển mọi item; motion đúng mô hình đã khảo sát.
- Reduced motion: nội dung vẫn hiện; không scroll trap, không phụ thuộc animation để đọc.

### Ticker

- Loop qua ít nhất một chu kỳ wrap, đổi hướng/tốc độ theo scroll như baseline; resize không tạo gap.
- Logo + ruler chạy riêng; center pointer đứng yên; offscreen/tab hidden/reduced-motion không chạy loop vô ích.

### Globe

- Drag/steer/inertia, Pause/Play, chọn pin/prev/next, card/focus, keyboard.
- Resize desktop/mobile, marker bám đúng vị trí, mặt sau bị che, không che heading/controls.
- Cuộn dọc bằng touch ở gutters; không bắt gesture toàn trang.
- Lazy loading, tab hidden/offscreen, fallback khi texture lỗi/WebGL unavailable, cleanup khi rời route.
- Giữ chất lượng texture/mây/ánh sáng so baseline; không giảm thành poster để che lỗi.

### Viewroom

- Tokyo mặc định đúng texture, orientation, ánh sáng và attribution.
- Orbit → Fly → Tour → Orbit, reset/fullscreen/Escape; camera không nhảy vô cớ.
- Open local file/folder + drag/drop; sample switch và Back to Tokyo.
- Ít nhất một mesh fixture và một Gaussian fixture thực sự render; test các fixture repo sẵn có, giữ coverage format đã có bằng unit tests và fixtures khả dụng.
- Missing texture/bin, invalid/unsupported file có thông báo thật; loading/success/error state không bị che bởi UI.
- Đổi asset nhanh, rời route lúc đang tải, quay lại nhiều lần; không stale result, canvas nhân đôi hoặc resource leak rõ rệt.
- Mở menu/info/help khi đang Fly/Tour: input lock, focus và scroll chính xác; đóng xong khôi phục đúng.
- Homepage không tải viewer stack/assets; mesh path không kéo Spark sớm. Globe Three.js trên homepage là hợp lệ, không được nhầm với tải Viewroom.
- Phone: controls sử dụng được, panel không tràn, drag/drop không phải cách duy nhất để chọn file.

### Checks và bằng chứng

Chạy `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` ở trạng thái cuối. `npm run check` chỉ gồm lint/typecheck/build; **không bao gồm test**. Có thể dùng `npm run check` + `npm test` để tránh chạy trùng.

Không thêm unit tests chỉ để snapshot utility class. Thêm test có ý nghĩa nếu đổi logic, đặc biệt menu bridge, lifecycle hoặc adapter contract. Giữ bộ tests cũ, không xóa/skip tests để lấy PASS.

Ảnh QA phải ghi viewport, route, section/state và phân biệt reference/local. Với ticker/globe/Viewroom là phần bổ sung, so sánh regression với baseline cũ và sự thống nhất với token mới; không tính chúng là sai lệch pixel của Farmio gốc. Dùng chuỗi ảnh hoặc video ngắn cho motion nếu công cụ hỗ trợ.

## 13. Deliverables và điều kiện hoàn thành

Lưu trong namespace research mới:

- `OUTPUT_PLAN.md`: route, file ownership, migration matrix, scope.
- `DESIGN_TOKENS.md`, `PAGE_TOPOLOGY.md`, `BEHAVIORS.md`, specs từng section.
- `ASSET_MANIFEST.md`: URL → local file, section, font/media metadata.
- `PRESERVATION_CONTRACT.md`: ticker/Earth/Viewroom, input/menu/scroll contracts.
- `QA_REPORT.md`: checks thật, screenshot paths, regression matrix, khác biệt có chủ đích, limitations.
- `IMPLEMENTATION.md`: các file chính, cách chạy, các quyết định tích hợp cần biết.

Chỉ coi là xong khi:

- [ ] Trang chủ bám đầy đủ Farmio, không chỉ hero hoặc vài card.
- [ ] Ticker/ruler/center pointer và Earth tương tác vẫn còn, được tích hợp hợp ngữ cảnh.
- [ ] `/viewroom` dùng giao diện mới từ shell đến HUD/panels/states, giữ engine và tất cả hành động quan trọng.
- [ ] Không còn Anode header/footer/style cũ lẫn vào giao diện ngoài các tài nguyên kỹ thuật được giữ có chủ đích.
- [ ] Responsive, menu, anchors, services, carousel, FAQ và CTA đã thử thật.
- [ ] Unit tests và build/checks đã chạy, kết quả được báo trung thực; lỗi do thay đổi được sửa.
- [ ] Visual comparison và regression evidence đã lưu, không có tuyên bố pixel-perfect hoặc 60fps nếu không đo.
- [ ] Không đè thay đổi có sẵn, không thêm backend giả, không publish/deploy.

Kết thúc bằng báo cáo tiếng Việt: đã thay gì, đã giữ gì, route xem kết quả, checks pass/fail, bằng chứng hình ảnh, phần nào còn giới hạn. Nếu còn blocker thật, nói chính xác phần chưa hoàn tất; không gọi bản dở dang là hoàn thành.

**Bắt đầu thực hiện ngay từ audit repository và mở reference; sau đó triển khai đến hết. Đừng chỉ trả lời bằng kế hoạch hoặc một prompt mới.**
