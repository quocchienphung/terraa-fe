# Farmio redesign — ghi chú khảo sát để Claude bắt đầu đúng

Ngày: 2026-09-28. Đây là khảo sát chuẩn bị prompt, **không phải báo cáo đã triển khai hoặc đã test ứng dụng**.

## Nguồn và mức kiểm chứng

- [Farmio live](https://farmio.framer.website/): đã mở bằng Chrome, xem hero và vùng solutions/services, đọc DOM/AX và lấy một số computed styles.
- [Framer project](https://framer.com/projects/Farmio-Agriculture-Landing-Page-copy--EumX2tGiyHVZqt1CEiss-4EQvt?node=augiA20Il): browser hiện tại mở được editor và canvas. Web fetch riêng không đọc được editor; không được suy ra project bị khóa với trình duyệt.
- Editor hiển thị Home, `/contact-us`, `/404`; breakpoint Desktop 1200, Tablet 1199–768, Phone 767. Đây là cấu trúc nguồn, không phải yêu cầu clone toàn bộ editor hoặc mọi page.
- Chưa thực hiện khảo sát responsive đầy đủ, chưa đo timing/sticky ranges, chưa thử mọi FAQ/carousel state. Claude triển khai phải làm các bước này.
- Hai screenshot người dùng gửi thể hiện ticker và Earth cần giữ. Chưa lưu chúng thành file local trong task này; không giả định Claude có attachment đó ở phiên khác. Master prompt đã mô tả đặc điểm và trỏ đến source/baseline sẵn có.

## Một số số đo ban đầu

Computed styles từ live ở viewport 2048×1018, không phải universal token cho mọi breakpoint:

| Thuộc tính | Giá trị quan sát |
| --- | --- |
| Heading font-family | `"BDO Grotesk Variable", sans-serif` |
| Hero h1 | 62px; line-height 71.3px; letter-spacing -3.72px; trắng |
| Các h2 được đọc | 52px; line-height 62.4px; letter-spacing -3.12px |
| Heading trên nền sáng | `rgb(4,48,59)` = `#04303b` |
| CTA nền lime | `rgb(231,243,82)` = `#e7f352` |
| CTA border-radius | 42px trên link được đọc |
| Computed heading weight | 1000 — cần xem font axes và descendants trước khi áp dụng |

Hero có ảnh đồng ruộng nền lớn, overlay tối, nav pill trắng, heading trắng, media card nhỏ phía dưới trái và mô tả/CTA phía dưới phải ở viewport khảo sát. Solutions có ba card ảnh bo góc. Đây là observations để định hướng, không thay thế screenshot/spec chính xác.

Services có năm panel desktop/tablet và một cấu trúc phone riêng trong canvas. Testimonials có bốn nội dung và pagination; thứ tự thay đổi giữa hai lần đọc, cho thấy có chuyển động nhưng chưa đủ để kết luận timing hay toàn bộ trigger. Đừng chuyển thành static grid hoặc tự quyết click-only.

## Trạng thái repository tại lúc khảo sát

- Working directory: `C:/Users/quocc/Downloads/terraa-fe`.
- `git status --short` ban đầu có thay đổi ở `package.json` và `package-lock.json`; đó là thay đổi đã có trước task tạo prompt. Không hoàn nguyên.
- `CLAUDE.md` dẫn tới `AGENTS.md`.
- Package manifest: Next 16.3.5, React 19.2.4, Three ^0.186.1, Fiber ^9.8.1, Spark 2.2.0, Lenis ^1.3.26, Tailwind v4. Kiểm tra lại lockfile/runtime khi triển khai; các con số này không phải khuyến nghị nâng package.
- Routes phát hiện trong `src/app`: `/` và `/viewroom`.
- Homepage đang render các component Anode; layout dùng nhiều font cũ và mount Lenis toàn cục.
- `tab` trong `globals.css` = 50.625rem (810px ở root 16px), `desk` = 75rem (1200px); không hoàn toàn trùng breakpoint Farmio.
- Thư mục `docs/prompts/` chưa tồn tại trước task. File Earth đang mở trong IDE không tìm thấy tại đường dẫn đó trên disk; report Earth và các ảnh regression vẫn có.

## Những ràng buộc đã đọc trong code

| Phần | Căn cứ | Điều dễ mất khi redesign |
| --- | --- | --- |
| Ticker | `ClientTicker.tsx`, `TickerMotion.tsx`, `motion-config.ts` | Hai track tốc độ khác nhau, scroll coupling, ruler/cursor, duplicate run, reduced motion |
| Earth | `GlobalFootprint.tsx`, `globe/EarthCanvas.tsx` | Client-only/lazy, markers/card projections, drag area/gutters, states pause/hold, cleanup và poster fallback |
| Viewroom shell | `ViewroomShell.tsx` | Selection state, file/folder drop, local bundle, delayed blob URL revoke, Back to Tokyo |
| Menu bridge | `useSiteMenuOpen.ts` | Effect tìm `#site-menu` một lần rồi observe `data-open`; menu mount muộn có thể không được theo dõi |
| Smooth scroll | `shared/SmoothScroll.tsx` | Một Lenis instance, stop/resume counter, reduced-motion lifecycle |
| Styling | `globals.css`, route Viewroom | Utility/token cũ còn được các phần giữ lại sử dụng; đổi/xóa toàn cục dễ gây regression |

Viewroom report mô tả kiến trúc một renderer/scene/camera cho mesh và splat, dynamic adapters, camera ownership, material fixes, abort/disposal, fixture verification và format limitations. Đó là **báo cáo lịch sử**, chưa được task tạo prompt này chạy lại. Dùng làm checklist và xác nhận với code hiện tại.

Tài liệu và evidence cũ hữu ích:

- `docs/research/viewroom/IMPLEMENTATION.md`
- `docs/design-references/viewroom/`
- `docs/research/earth-interaction-realism.md`
- `docs/design-references/earth-interaction-realism/`
- `docs/design-references/motion-upgrade/`
- `public/textures/earth/MANIFEST.md`
- `docs/research/anodeenergy-framer-website-108d0ac2/root-8a5edab2/`

## Quyết định tích hợp đề xuất trong master prompt

Các điểm này là lựa chọn để triển khai ý định người dùng, **không phải cấu trúc có sẵn của Farmio**:

- Ticker sau hero, trước About.
- Globe sau Features/impact, trước How it works, giữ Features gốc.
- Navigation thêm Viewroom; route giữ `/viewroom`.
- Viewroom tái thiết kế presentation từ token Farmio, giữ engine/data/behavior.
- Phần Farmio clone giữ nội dung nguồn làm mặc định; không tự rebrand toàn bộ thành Terra hoặc bịa nghiệp vụ mới.
- Chú thích ticker/globe phải hợp ngữ cảnh, dữ liệu legacy/prototype không trở thành dữ liệu nông nghiệp thật chỉ vì đổi giao diện.

## Cách dùng

Mở Claude Code tại root repo và gửi:

```text
Đọc kỹ docs/prompts/farmio-redesign-claude-code-master-prompt.md và docs/prompts/farmio-redesign-source-audit.md, rồi thực hiện toàn bộ yêu cầu trong master prompt trên source hiện tại. Dùng AI agents khi có thể, bảo toàn logic Viewroom cùng ticker và Earth, triển khai giao diện Farmio đầy đủ và kiểm thử đến khi hoàn tất. Không chỉ trả lại kế hoạch.
```

Task tạo hai tài liệu này không sửa source ứng dụng, không tải assets Farmio vào app và không chạy build/test, vì chưa được yêu cầu triển khai redesign trong phiên này.
