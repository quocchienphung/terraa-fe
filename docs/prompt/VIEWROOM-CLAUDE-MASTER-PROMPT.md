# Master prompt thực thi cho Claude Code — Terra Viewroom

Copy nội dung khối dưới vào Claude Code khi đang mở repository này. Các đường dẫn tương đối tính từ root repo. Hai tài liệu đi kèm là một phần bắt buộc của prompt, không cần dán lại toàn bộ.

```text
Bạn hãy trực tiếp triển khai trang Terra Viewroom trong repository đang mở. Đừng chỉ trả lời bằng kế hoạch, pseudocode hoặc UI mockup. Làm đến khi có trang hoạt động, model Tokyo thật render được, các kiểm chứng được thực hiện và giới hạn được báo trung thực.

Trước khi sửa code, đọc đầy đủ:
1. AGENTS.md và mọi instruction áp dụng cho thư mục định sửa.
2. docs/prompt/VIEWROOM-ASSET-AUDIT.md
3. docs/prompt/VIEWROOM-TECHNICAL-MASTER-PROMPT.md
4. package.json, lockfile, git status/diff hiện tại và các file UI/integration được chỉ ra trong audit.
5. Tài liệu liên quan trong node_modules/next/dist/docs/ theo AGENTS.md; API/typings đúng version của Three.js, React Three Fiber và Spark trước khi tích hợp.

ĐÍCH SẢN PHẨM
- Thêm /viewroom và đổi đúng mục Newsroom trong MENU.secondary thành Viewroom trỏ /viewroom.
- Reuse UI/style và Header hiện có. Giữ nguyên homepage, root layout, globals.css, Hero, globe, News section, footer và phần khác. Không replace-all Newsroom vì footer cũng có mục này.
- Viewport thống nhất React + TypeScript + React Three Fiber + Three.js WebGL2. MeshAdapter dùng FBXLoader/GLTFLoader/OBJLoader; SplatAdapter dùng @sparkjsdev/spark trong cùng renderer/scene/camera. HTML overlay cho toolbar/panels.
- Default asset: public/3d tokyo/source/Export.fbx. Đọc và dùng 3 texture hiện có. Có Orbit, Fly trên desktop phù hợp, Cinematic Tour, Reset, Fullscreen, Info/Help và Open model local.
- Thực hiện loader paths cho .fbx, .glb, .gltf, .obj và Gaussian .ply, .splat, .ksplat, .spz, .sog. Không coi mọi PLY là 3DGS; không dùng point cloud để giả Gaussian renderer.
- Gaussian branch phải chạy thật với fixture PLY/SPZ phù hợp, không để TODO chờ training. Tokyo hiện tại là mesh prototype, không được gắn nhãn một scene đã được reconstruct bằng 3DGS.

QUYẾT ĐỊNH FRAMEWORK
Người dùng mô tả React + TypeScript + Vite như kiến trúc mong muốn, nhưng repository hiện là Next.js 16.3.5 / React 19.2.4. Ưu tiên ràng buộc giữ nguyên website: triển khai route trong Next hiện tại, giữ TerraViewport core portable để reuse trong Vite về sau. Không migrate repo sang Vite, không tạo app/iframe riêng để né integration. Nêu quyết định này trong báo cáo; nếu người dùng sau đó yêu cầu rõ host Vite riêng thì xử lý như phạm vi mới.

TRÌNH TỰ LÀM VIỆC
A. Audit và baseline
   - Xác minh lại hiện trạng, không coi audit là dữ liệu bất biến.
   - Ghi file đang modified/untracked và giữ nguyên thay đổi người dùng; Hero.tsx đã có thay đổi trước công việc này.
   - Đọc homepage, tokens, header/menu, Lenis và assets. Không cần hỏi lại những quyết định đã rõ trong spec.
   - Xem peer dependencies rồi chọn Fiber/Spark compatible với React/Three hiện có. Không dùng --force/--legacy-peer-deps để che incompatibility, không nâng/hạ Three toàn repo âm thầm.

B. Dựng lát cắt hoàn chỉnh đầu tiên
   - Route shell + client-only lazy viewport + Header + entry menu.
   - Một R3F Canvas, camera fit và Orbit, default Tokyo FBX, đúng textures, loading/error/Retry.
   - Kiểm tra thực tế trong browser trước khi trang trí thêm controls. Nếu model trắng/đen, sửa resource/material/framing thay vì che bằng poster.
   - Texture audit đã phát hiện Atlas.psd, props_alpha.psd cần alias sang JPG/PNG hiện có; LM_Final.tga thiếu và không có embedded Video Content được tìm thấy. Kiểm tra connection/slot để xử lý thiếu map có chủ đích. Không bịa texture hoặc tuyên bố hoàn hảo khi lighting khác bản gốc.

C. Hoàn thiện core thống nhất
   - Adapter contracts, format registry, asset descriptor, local resource resolver, progress phases, stale load guard và ownership/disposal.
   - GLB/GLTF/OBJ sidecar support; Spark integration đúng version cùng renderer/camera; filename/fileType khi dùng blob URL.
   - Open model local không upload server, Back to Tokyo, file hỏng/missing resource có lỗi cụ thể.

D. Camera và UI
   - Chỉ một camera controller hoạt động mỗi thời điểm. Fly/Orbit/Tour chuyển mode không snap hoặc tranh quyền.
   - Tour có keyframe được chọn bằng quan sát Tokyo, Play/Pause/Restart/Exit thật; không auto-play mặc định.
   - Desktop/mobile, keyboard/focus, reduced motion, menu/Lenis interaction, fullscreen, context loss/recovery.
   - Bám typography, màu, spacing homepage; canvas chiếm trọng tâm. Không thêm marketing sections hoặc dashboard sidebar ngoài yêu cầu.

E. Kiểm chứng và hoàn thiện
   - Chạy lint, typecheck, tests và production build; kiểm tra production route/assets.
   - Dùng browser kiểm tra Tokyo textures, controls, menu, local import, lỗi, route transitions và các viewport trong spec.
   - Có visual proof cho PLY 3DGS và SPZ thật. Tìm fixture nhỏ từ nguồn chính thức được phép dùng nếu repo chưa có; ghi nguồn. Không bịa fixture hay báo pass khi chưa chạy.
   - Với mỗi format, phân biệt implemented / verified / limitation. Đừng che các format chưa thử bằng nhãn Universal.
   - Kiểm tra cleanup khi rời/vào route và đổi model nhiều lần, không khiến homepage tải Spark/Fiber/Tokyo.
   - Lưu screenshots và docs/research/viewroom/IMPLEMENTATION.md; review diff cuối để bảo vệ scope.

PHẠM VI FILE ĐƯỢC THAY ĐỔI
- Thêm src/app/viewroom/**, src/components/viewroom/**, src/lib/viewroom/**.
- Thêm test Viewroom, tài liệu/screenshot Viewroom và asset fixture nhỏ có nguồn khi cần.
- package.json và lockfile chỉ cho dependency thực sự cần.
- src/lib/constants.ts chỉ sửa entry Newsroom trong MENU.secondary thành Viewroom.
- Source khác giữ nguyên. Đọc/reuse shared components nhưng không refactor chúng. Nếu phát hiện bắt buộc phải mở rộng scope, trước tiên thử giải pháp scoped; chỉ hỏi khi thật sự không thể giải quyết trong phạm vi này, nêu file và lý do cụ thể.

ĐIỀU KIỆN DỪNG
Không dừng khi mới có skeleton, FBX untextured, toolbar giả, Spark stub hoặc chỉ build pass. Hoàn thành toàn bộ phần có thể thực hiện theo acceptance matrix trong technical prompt. Nếu có chặn thực sự như không cài được dependency, thiếu fixture không thể lấy hoặc môi trường không có GPU/browser, báo đúng phần bị chặn, tiếp tục những phần độc lập và không claim đã xác minh phần đó.

Không tự commit, reset/clean, deploy, upload model ra dịch vụ ngoài hoặc thay đổi phần không liên quan. Giữ tiến độ bằng cập nhật ngắn: đã xác minh gì, vấn đề thật là gì, bước tiếp theo giải quyết gì.

Khi bàn giao, trả lời bằng tiếng Việt, gồm:
1. Route /viewroom và những trải nghiệm đã hoạt động.
2. File chính và cách thêm asset PLY/SPZ sau training.
3. Lệnh kiểm tra đã chạy và kết quả thật.
4. Screenshot paths, format đã render, các format chưa xác minh.
5. Các giới hạn còn lại, đặc biệt texture Tokyo thiếu và số đo performance chưa có nếu đúng như vậy.

Bắt đầu bằng việc đọc repo và các tài liệu trên, sau đó triển khai ngay.
```

## Lệnh gọi ngắn thay cho copy toàn bộ

```text
Hãy thực thi docs/prompt/VIEWROOM-CLAUDE-MASTER-PROMPT.md trong repo này, đọc đầy đủ technical prompt và asset audit được tham chiếu. Triển khai /viewroom theo scope đã khóa, render Tokyo FBX thật và tích hợp Spark cùng viewport. Giữ nguyên homepage/layout và thay đổi hiện có của tôi; kiểm chứng rồi bàn giao bằng tiếng Việt.
```
