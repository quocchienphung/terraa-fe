# Prompt cho Claude Code — nâng cấp tương tác chuột và độ chân thực của Earth

Đây là brief cho bước tiếp theo sau khi `anode-motion-threejs-agent.md` đã được triển khai. Các thông số mới bên dưới là khởi điểm để kiểm tra và tune, không phải thông số đã đo từ Stripe hay một mô phỏng khí tượng chính xác.

## 1. Nhiệm vụ và giới hạn

Bạn là senior creative frontend/WebGL engineer có kinh nghiệm Three.js, GLSL, texture pipeline và thiết kế tương tác. Hãy trực tiếp nâng cấp globe đang chạy trong repository này, kiểm tra bằng browser và bàn giao code đã tích hợp. Không chỉ trả lời bằng một kế hoạch hoặc một demo độc lập.

Repo: `C:/Users/quocc/Downloads/terraa-fe`.

Hiện website đã chạy tốt. Yêu cầu mới chỉ tập trung vào section **Global Footprint / Where We Operate**:

1. Giữ chuyển động tự quay mặc định như hiện tại khi người dùng không tương tác.
2. Thêm điều khiển chuột để xoay trái/phải, nhanh/chậm theo vị trí con trỏ; chuyển chiều phải mềm, không giật.
3. Cho phép kéo ngang trực tiếp để khám phá globe nếu triển khai đủ state handling như mô tả bên dưới. Hover steering là tính năng bắt buộc; drag bổ sung không được phá nó hoặc thay thế nó.
4. Cải thiện texture đất, địa hình, nước, mây và ánh sáng để có cảm giác ảnh vệ tinh thật. Không biến globe thành mô hình địa hình phóng đại hay quả bóng nhựa.
5. Giữ title, bố cục, kích thước/crop globe, marker, legend, card, prev/next và pause/resume đang hoạt động.

Art direction: Trái Đất lớn trên nền gần đen; đại dương navy tối, đất có sắc độ tự nhiên, địa hình sắc vừa phải, mây trắng/xám có mật độ và chiều sâu, đường chuyển ngày/đêm mềm, city lights tiết chế, atmosphere cyan mỏng. Hình gốc `public/images/reference/globe-night.webp` là chuẩn cảm giác ảnh chụp, không phải texture bọc hình cầu.

Reference cảm giác chuyển động: https://stripe.com/managed-payments . Chỉ học sự liên tục, độ mượt và phản hồi tương tác. Không mặc định rằng Stripe có chính xác mô hình tương tác dưới đây; đây là yêu cầu riêng của người dùng. Không lấy phong cách chấm, tím/hồng hoặc đường bay thanh toán của Stripe.

Prompt này thay thế giới hạn “drag ngoài phạm vi” trong brief cũ. Không mở rộng sang sửa animation text, ticker, Solutions, navigation hay nội dung các section khác. Không đổi engine sang React Three Fiber/OrbitControls chỉ để thêm một trục xoay; scene Three.js hiện tại đã có hệ thống orientation và focus riêng.

## 2. Đọc code thực tế trước khi sửa

Đọc `AGENTS.md`, `package.json`, git status và các file sau. Giữ mọi thay đổi người dùng đã có; không reset/rebuild repository từ đầu.

Đường dẫn cơ sở:

`src/components/sites/anodeenergy-framer-website-108d0ac2/root-8a5edab2/`

Các file quan trọng:

- `GlobalFootprint.tsx`
- `globe/EarthCanvas.tsx`
- `globe/create-earth-scene.ts`
- `globe/earth-config.ts`
- `globe/project-markers.ts`
- `src/types/anode.ts`
- `src/lib/constants.ts`
- `src/hooks/use-reduced-motion.ts`
- `scripts/build-earth-textures.py`
- `public/textures/earth/MANIFEST.md` và `manifest.json`
- `tests/globe-geo.test.ts`
- `docs/research/anodeenergy-framer-website-108d0ac2/root-8a5edab2/MOTION_IMPLEMENTATION.md`

Trước khi viết code Next.js, đọc guide phiên bản cài trong repo ở `node_modules/next/dist/docs/`, nhất là client/server boundary và lazy loading. Giữ named exports, TypeScript strict, không `any`, không bỏ lint rules để che lỗi. Static layout dùng Tailwind/CSS; animation runtime cập nhật qua ref/engine.

### Kết quả audit source ngày 26/09/2026

Xác minh lại vì source có thể thay đổi sau audit:

- Đã có Three.js ^0.186.1, client-only dynamic import, lazy mount gần viewport, poster fallback, projection/occlusion và một render loop. Không dựng lại những phần này.
- Canvas hiện có `pointer-events-none` trong `GlobalFootprint.tsx`, nên chưa nhận thao tác chuột.
- `EarthCanvas.tsx` đang điều khiển orientation bằng `spin`, `tilt`, quaternion và focus tween. Auto-spin có period 150 giây/vòng. Speed hiện bị clamp 0..1; các điều kiện `speed > 0` không hỗ trợ quay ngược.
- `cloudPeriodSeconds` hiện là 1400 giây/vòng tương đối. `clouds.rotation.y` được cập nhật bên trong nhánh surface rotation và nhân cùng `speed`. Vì vậy gió/mây đang phụ thuộc vào việc globe có quay hay không. Đây là coupling xác nhận từ code; cảm giác mây “đơ” còn cần quan sát ở cùng góc nhìn.
- Surface shader dùng `masks.r` tại `vUv` cố định để giảm city lights dưới mây, trong khi cloud mesh có rotation riêng. Sau khi cloud drift, mask che city lights và mây hiển thị có thể lệch nhau. Chưa có cloud shadow thực sự di chuyển trên surface.
- Desktop day map 4K, mobile 2K; normal và packed masks đều 2K. Normal được sinh từ GEBCO elevation với strength 6; shader nhân thêm normalScale 0.9.
- Day map là NASA Blue Marble có **shaded topography** sẵn. Nó không phải albedo thuần không có ánh sáng. Baked relief cộng normal lighting có thể làm địa hình quá đậm hoặc hướng bóng không nhất quán; phải kiểm tra trước khi tăng normal strength.
- `earth-masks-2k.webp` đóng gói cloud density ở R, water mask ở G, được xuất lossy WebP quality 88. Việc dùng kênh màu để chứa dữ liệu độc lập trong định dạng nén mất dữ liệu có nguy cơ làm biến dạng mask; kiểm tra thực tế, không khẳng định artifact nếu chưa quan sát.
- GlobalFootprint dùng `spinning = !userPaused && !hold && !reduced`. `hold` đang phục vụ hover/focus UI; nó không phân biệt được tất cả lý do pause cần có sau nâng cấp.

Đọc báo cáo test cũ để hiểu baseline, nhưng không dùng kết quả cũ như bằng chứng rằng phần nâng cấp mới đã đạt.

## 3. Hợp đồng tương tác chuột

### 3.1. Idle phải giữ nguyên

- Khi chưa có tương tác hoặc con trỏ ở ngoài vùng globe: quay cùng chiều và tốc độ mặc định hiện tại, khoảng 150 giây/vòng.
- Không reset orientation khi chuột vào/ra, không snap về initial longitude, không đổi camera framing.
- Toàn bộ input chỉ điều khiển target angular velocity hoặc delta yaw; render loop là nơi duy nhất cập nhật orientation cuối cùng.

### 3.2. Hover steering theo vị trí, không theo số sự kiện mousemove

Chuẩn hóa tọa độ ngang con trỏ theo vùng tương tác: `x ∈ [-1, 1]`, -1 ở trái và +1 ở phải. Ưu tiên vùng globe thực tế, không phản hồi khi trỏ vào title/card/control hay khoảng nền đen xa khỏi silhouette. Có thể dùng ray–sphere hit test rẻ theo camera và framing hiện tại; không raycast toàn scene mỗi frame.

Yêu cầu cảm giác:

- Vùng giữa khoảng ±12% tọa độ chuẩn hóa giữ tốc độ idle, tránh jitter khi con trỏ gần tâm.
- Di chuyển sang trái: giảm tốc, qua 0 rồi quay trái nhanh dần khi đi xa tâm.
- Di chuyển sang phải: tăng tốc quay phải nhẹ nhàng theo khoảng cách tới tâm.
- Mép vùng tương tác giới hạn khoảng 4–6 lần tốc độ idle, không tăng vô hạn.
- Con trỏ đứng yên ở một vị trí thì globe giữ tốc độ tương ứng. Không yêu cầu người dùng phải liên tục di chuột mới quay.
- Tách “trái/phải trên màn hình” khỏi dấu rotation.y. Kiểm chứng bằng một lục địa nhìn thấy: con trỏ phía phải phải làm bề mặt chạy sang phải theo convention đã chọn; nếu camera/UV làm dấu ngược thì sửa mapping, không đổi text hướng dẫn để che lỗi.

Gợi ý hàm liên tục, dùng khi dấu dương thực sự là chuyển động sang phải trên màn hình:

```text
baseOmega = 2π / 150                     // rad/s, giữ nguyên baseline
deadZone = 0.12
q = clamp((abs(x) - deadZone) / (1 - deadZone), 0, 1)
s = q*q*(3 - 2*q)                       // smoothstep
multiplier = x < 0 ? 1 - 7*s : 1 + 5*s
targetOmega = baseOmega * multiplier
```

Mapping này giữ +1x ở giữa, đi qua điểm dừng ở phía trái rồi tới -6x ở mép trái; mép phải +6x. Đây là lựa chọn UX có chủ đích để chuyển từ idle sang reverse liên tục, không phải phép đối xứng tốc độ hai bên tâm. Tập trung các số này trong config để tune. Nếu chọn mapping khác, nêu rõ lý do và chứng minh không có discontinuity khó chịu.

Làm mượt theo thời gian thực:

```text
omega += (targetOmega - omega) * (1 - exp(-dt / tau))
yaw += omega * dt
```

Tau khởi điểm 0.18–0.30 giây khi steer, 0.35–0.60 giây khi về idle. Không dùng `lerp(..., 0.1)` cố định mỗi frame; không tăng yaw theo số lần mousemove. Phải hỗ trợ omega âm trong logic render, dirty/busy, tilt return và stop threshold. Dùng `abs(omega)` ở điều kiện chuyển động phù hợp; không để inertia hoặc tilt easing thành số âm gây mất ổn định.

Khi pointerleave/window blur/tab hidden/offscreen: clear input steering cũ. Khi hiện lại, reset clock để không catch-up góc từ thời gian tab bị ẩn. Khi chuột trở lại cần dùng tọa độ mới, không giữ lệnh quay nhanh từ trước.

### 3.3. Drag trực tiếp — bổ sung sau hover ổn định

Cho phép nhấn trái và kéo ngang trên bề mặt globe:

- `pointerdown`: chỉ primary pointer và nút trái, bỏ qua target thuộc marker/card/control. Bắt đầu trạng thái drag sau ngưỡng khoảng 4–6 CSS px để click nhỏ không bị xem là drag.
- Khi đã drag: tạm override hover steering/auto-spin, dùng pointer capture để không mất thao tác khi kéo ra mép. Delta góc dựa trên delta CSS px và projected globe radius/canvas width; không dựa drawing-buffer pixels hoặc DPR.
- Kéo nhanh/quãng xa thì xoay nhanh/quãng xa tương ứng; kéo chậm vẫn chính xác. Không cho yaw giật khi pointerdown. Không zoom, pan camera, lật ngược cực hoặc quay tilt tự do.
- Dùng velocity estimate có smoothing và clamp để tạo inertia ngắn sau release, khoảng 0.4–0.8 giây. Sau đó hòa trở về hover target nếu vẫn ở globe, hoặc idle nếu đã ra ngoài. Không cộng cả inertia, auto-spin và hover vào cùng yaw mà không có state owner.
- Xử lý `pointerup`, `pointercancel`, `lostpointercapture`, window blur, context loss, offscreen/unmount. Không để cursor grabbing hoặc trạng thái drag bị kẹt.
- Không kích hoạt marker/card click sau một drag vượt threshold. Không chặn click marker bình thường.
- Nếu drag làm UX rối hoặc công cụ chưa kiểm tra được đầy đủ, hoàn thành hover trước và báo riêng phần drag chưa đạt; không mô tả drag là đã hoàn thành khi chưa kiểm tra.

Hiển thị hướng dẫn rất gọn, đúng ngôn ngữ tiếng Anh của website, chỉ khi globe ready và thiết bị hỗ trợ: ví dụ “Move left or right to steer · Drag to explore”. Không dùng cursor grab nếu không có drag. Không thêm panel thông số kỹ thuật vào UI.

### 3.4. Input priority và accessibility

Làm rõ state machine, không suy tất cả từ một boolean `spinning`:

| Trạng thái | Surface | Clouds | Input |
| --- | --- | --- | --- |
| Tab ẩn / section ngoài viewport / lỗi WebGL | Ngừng render | Ngừng render | Clear drag/steering |
| User nhấn Pause | Dừng sau ease rất ngắn | Dừng | Hover không tự bật lại; explicit selection vẫn được xử lý |
| Reduced motion | Không tự quay | Không drift | Location selection tức thì; explicit manual drag có thể cập nhật trực tiếp, không inertia |
| Focus tween từ prev/next | Tween duy nhất điều khiển orientation | Drift nhẹ nếu không paused | Không để hover tranh ghi quaternion |
| Hover/focus card hoặc marker | Surface dừng để đọc | Có thể drift rất chậm | Không steer xuyên qua DOM overlay |
| Drag có chủ đích | Delta yaw trực tiếp | Drift tương đối độc lập | Ưu tiên hơn idle/hover; cancel/rebase focus tween đúng cách nếu cần |
| Hover surface | Signed target velocity | Drift tương đối độc lập | Theo vị trí chuột |
| Idle | Auto-spin hiện tại | Drift tương đối độc lập | Chờ tương tác |

Nếu userPaused/reducedMotion đổi khi tween/inertia đang chạy, xử lý ngay và nhất quán. Không để checkbox Pause báo dừng nhưng mây vẫn chạy. Nếu cho phép drag khi Pause thì phải coi là thao tác trực tiếp có chủ đích, không tự resume sau release.

Giữ nguyên keyboard prev/next location và focus ring. Nếu thêm điều khiển bàn phím cho globe, dùng một DOM control có accessible name/description, chỉ nhận ArrowLeft/ArrowRight khi nó được focus; không bắt phím toàn trang. Không biến canvas `aria-hidden` thành vùng điều khiển duy nhất không thể tiếp cận.

Mobile: không có hover thì giữ auto-spin. Nếu hỗ trợ touch drag, dùng Pointer Events, `touch-action: pan-y`, phân biệt horizontal gesture; scroll dọc vẫn native, không preventDefault toàn trang. Không làm hỏng Lenis hoặc menu scroll lock. Không nhận hai pointer cùng lúc cho rotate một trục.

## 4. Nghiên cứu texture trước khi đổi asset

Các nguồn đã tìm được, phải mở và xác minh nguồn cụ thể trước khi dùng:

1. [NASA Blue Marble Next Generation](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/): các biến thể base map/topography/bathymetry, cần chọn đúng loại.
2. [NASA topography/bathymetry maps](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/topography-bathymetry-maps/): dữ liệu elevation riêng thay vì suy ra độ cao từ màu đất.
3. [NASA Blue Marble clouds](https://visibleearth.nasa.gov/images/57747/blue-marble-clouds/77558l): cloud imagery là composite vệ tinh; đây không phải dữ liệu thời tiết realtime.
4. [Solar System Scope textures](https://www.solarsystemscope.com/textures/): có day/night/cloud/normal/specular equirectangular. Trang nêu CC BY 4.0 và texture đã chỉnh màu; kiểm tra attribution và độ khớp với bộ NASA trước khi phối.
5. [Three.js Journey — Earth shaders, phần public](https://threejs-journey.com/lessons/earth-shaders): tham khảo day/night, ocean specular, atmosphere; không cần truy cập tài liệu bị khóa hoặc sao chép project trả phí.
6. [Three.js material documentation](https://threejs.org/docs/pages/MeshPhongMaterial.html) và [color management](https://threejs.org/manual/pages/color-management.html): phân biệt normal/bump/displacement, map màu và map dữ liệu. Scene hiện dùng custom ShaderMaterial; không giả định các property của built-in material tự có tác dụng trong shader custom.

Các nguồn đã có trong manifest dự án và dùng được để đánh giá lại:

- Elevation NASA: `https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/topography/gebco_08_rev_elev_5400x2700.jpg`
- Clouds NASA: `https://assets.science.nasa.gov/content/dam/science/esd/eo/content-feature/bluemarble/images/cloud_combined_2048.jpg`
- Solar System Scope có link tải cloud 8K và normal 8K ở trang nguồn. Không mặc định tải 8K vào runtime: bản cloud JPEG khoảng 11.6MB ở lần kiểm tra, còn normal bản ultra là TIFF, không thể coi như texture ảnh browser tải trực tiếp bình thường.

Ghi một bảng trong báo cáo: asset hiện tại, hạn chế quan sát được, asset thay thế, projection, color space, compression, license/credit, pixel dimensions, network bytes và estimated GPU memory.

Không thay texture chỉ vì có số K lớn hơn. Xác minh bằng nhìn close-up surface tại cùng camera/sun/exposure. Nếu nguồn cũ đủ dữ liệu nhưng shader làm sai, sửa shading trước. Không dùng AI tạo địa hình giả hoặc noise ngẫu nhiên làm thay bản đồ thật.

## 5. Pipeline texture và địa hình chân thực

### 5.1. Chọn dữ liệu theo vai trò

Tách rõ:

- Day/albedo: màu mặt đất/nước, ưu tiên ít baked lighting nếu chiếu sáng động mạnh.
- Height/elevation: dữ liệu độ cao phục vụ tạo normal/bump, không phải ảnh màu vùng núi.
- Normal: hướng pháp tuyến chi tiết; xác minh tangent basis và trục xanh lá, tránh núi nhìn thành hố.
- Ocean/land mask: phân biệt phản xạ đại dương và bề mặt đất.
- Cloud density/alpha: độc lập với water mask để không làm biển “trôi theo mây”.
- Night lights: phát sáng ở mặt tối, bị che bởi mây đang ở đúng vị trí.

Tất cả map phải cùng equirectangular orientation, seam, north/south và registration. Dùng bờ biển, dãy Himalaya/Andes và một vài thành phố làm mốc. Cùng tỷ lệ 2:1 chưa đủ chứng minh các map khớp nhau.

Nếu lấy map có baked relief: giữ normal subtle, tránh double shadow. Không gọi nó là albedo thuần. Nếu thay bằng base map không shaded relief thì đánh giá lại material thay vì giữ nguyên toàn bộ look parameters cũ.

### 5.2. Bump/normal trước, displacement khi có lý do

Ở khung nhìn toàn cầu, “đồi núi thật” chủ yếu đến từ texture detail và phản ứng ánh sáng, không phải silhouette lởm chởm. Không tăng displacement mạnh để tạo cảm giác chi tiết giả.

- Ưu tiên normal/bump 4K desktop từ elevation nguồn đủ nét, 2K mobile. Không upscale 2K lên 4K rồi gọi là thêm chi tiết.
- Nếu lấy gradient height trong shader, dùng texel size theo kích thước map thật; wrap longitude, xử lý poles và hệ số theo độ phân giải/tỷ lệ cầu. Không hard-code 1/2048 cho mọi tier.
- Tangent/bitangent cần đi cùng rotation/tilt của Earth. Không dùng world up làm north mặc định cho mọi orientation.
- Land relief không được làm đại dương nổi như núi. Ocean mask ảnh hưởng đến normal detail/specular/roughness đúng mục đích.
- Chọn normal strength bằng so sánh A/B, không tăng từ 0.9 lên 3 chỉ vì “trông nổi hơn”. Có thể giảm strength nếu source đã shaded.
- Chỉ thêm displacement nhỏ nếu có lợi quan sát rõ và geometry budget phù hợp; kiểm tra marker radius/occlusion nếu thay geometry surface.

### 5.3. Color và compression

Day/night là màu, thường dùng sRGB annotation. Normal/height/mask là dữ liệu phi màu, không áp gamma giống ảnh chụp. Shader làm lighting trong không gian tuyến tính và output color space đúng phiên bản Three.js; tránh tự chuyển gamma thêm lần nữa.

Không mặc định lưu normal hoặc packed independent channels bằng lossy JPEG/WebP chất lượng trung bình. Chọn lossless hoặc GPU compression phù hợp với loại dữ liệu sau khi so sánh sai số. Color textures có thể dùng lossy có kiểm tra. Mọi thay đổi asset phải tái tạo được qua script, cập nhật manifest và credit; không hotlink runtime.

Budget khởi điểm: 4K cho day/cloud/normal desktop nếu nguồn có thật, 2K mobile. Không tải cả hai tier. 8K RGBA chưa nén có thể cần khoảng 128MiB trước mipmaps cho một map, nên dung lượng JPEG tải xuống không phản ánh GPU memory. Chỉ tăng 8K khi profiling và screenshot chứng minh cần thiết.

## 6. Mây: chuyển động độc lập và có chiều sâu

Không giải quyết bằng tăng tốc quay toàn globe. Mây phải có **relative drift** so với mặt đất và ánh sáng phù hợp.

### 6.1. Hai đồng hồ chuyển động

Tách `surfaceYaw` và `cloudRelativeYaw`:

- Surface yaw nhận idle/hover/drag/focus.
- Cloud relative yaw chỉ tăng theo một `weatherTime` độc lập khi visible và chưa explicit pause/reduced motion.
- Nếu clouds là child của Earth orientation thì world rotation tự bao gồm surface rotation cộng relative drift. Không cộng surfaceYaw thêm lần nữa vào cloud child.
- Khi hover đổi surface sang chiều âm, relative wind không tự đổi chiều hoặc nhân nhanh lên 6 lần.
- Khi hover card dừng surface, mây vẫn có thể drift nhẹ để scene không chết; khi người dùng bấm Pause, cả hai dừng.
- Khởi điểm relative drift một vòng 600–1000 giây, so với 1400 hiện tại; tune bằng capture cùng góc sau 10–20 giây. Đây là time-compressed artistic motion, không mô phỏng tốc độ gió thật.

Không tự thêm noise animation khiến mây nhấp nháy/sôi. Trước tiên làm một cloud layer chất lượng, sau đó mới cân nhắc layer mây cao mỏng với wind hơi khác nếu thực sự cải thiện và không tạo pattern lặp.

### 6.2. Hình khối và shading

- Cloud shell cao hơn surface rất nhẹ, giữ cảm giác bám khí quyển; không thành vòng cầu tách rời.
- Alpha/density giữ cả sợi mây mỏng và đám dày; không threshold quá gắt biến thành mảng trắng cắt giấy.
- Shading dùng sun direction và normal cùng coordinate space; có thể dùng density gradient để thêm relief tinh tế. Không tạo normal từ brightness rồi exaggerate như đá.
- Vùng mây dày có self-shading nhẹ và vùng sáng mềm; mặt đêm vẫn tối, không phát sáng trắng như neon.
- Có thể dùng optical-depth approximation để thay đổi opacity theo mật độ/góc nhìn, nhưng clamp ở limb để không tạo vành trắng dày.
- Atmosphere mỏng và clouds phải được kiểm tra riêng: không lấy bloom che texture nhòe.

### 6.3. Cloud shadow và night-light attenuation phải đi theo mây

Surface shader cần biết relative cloud transform hiện tại. Sampling cloud coverage ở surface UV cố định trong khi mesh mây đang rotate là sai về registration.

Với cloud rotation chỉ theo yaw cùng parent, có thể chuyển surface UV sang cloud UV bằng offset `cloudRelativeYaw / (2π)` với dấu được kiểm tra. Nếu thêm trục tilt hoặc nhiều layer thì dùng transform phù hợp, không áp công thức yaw đơn giản một cách mù quáng.

- Coverage dùng để che city lights phải cùng map, orientation và offset với cloud shell.
- Thêm shadow rất nhẹ lên surface, offset theo sun direction và độ cao cloud shell. Có thể dùng ray intersection với shell hoặc approximation sunward trong tangent space được giới hạn gần terminator.
- Soft shadow phải trượt theo mây; kiểm tra khi surface đứng yên mà mây trôi.
- Cloud shadow không dịch water mask/normal/đất theo, không giảm emissive của toàn mặt đêm bằng một mask tĩnh.
- Seam ±180° phải liên tục cả cloud rendering và shadow, không chỉ texture day. `RepeatWrapping` giúp sampling wrap nhưng không tự sửa source có hai mép không khớp; phải kiểm tra nguồn/seam preparation.

Ghi rõ kỹ thuật shadow/relief là approximation, không quảng cáo là volumetric raymarched clouds nếu chỉ là transparent shell.

## 7. Ánh sáng, nước và atmosphere

Giữ sun trong world/view space hợp lý để người dùng xoay globe thì lục địa đi qua ngày/đêm; không quay sun cùng texture.

- Ocean phản xạ ánh sáng mạnh hơn đất, có highlight mềm giới hạn theo water mask. Không làm mọi nơi glossy bằng một specular toàn cầu.
- Nếu custom shader chưa có PBR roughness, triển khai diffuse/specular có chủ đích; chỉ thêm field `roughness` vào config mà shader không dùng là chưa làm xong.
- Day/night blending lấy geometric normal cho terminator, fine normal cho detail shading để núi không tự phát sáng ở mặt đêm.
- Exposure/saturation giữ gần art direction cũ; cân bằng lại khi thay map. Không dùng CSS contrast/sharpen toàn canvas để che thiếu chi tiết.
- Atmosphere rim dùng góc nhìn và hướng sáng, giữ màu cyan rất mỏng. Tránh cộng haze hai lần làm surface washed out.
- Giữ được chi tiết texture khi đang chuyển động, không chỉ lúc pause ở một góc đẹp.

## 8. Kiến trúc, hiệu năng và fallback

Refactor nhỏ trên scene đang có. `EarthCanvas.tsx` vẫn là chủ sở hữu cuối của orientation/render; `GlobalFootprint.tsx` giữ DOM/state selection. Thêm module helper như `rotation-input.ts` nếu có logic thuần đáng test, không tạo abstraction thừa.

- Không setState mỗi pointermove hoặc mỗi frame. Event ghi ref/input state, RAF tiêu thụ.
- Cache rect/geometry phục vụ hit-test, cập nhật khi resize/scroll; batch reads/writes. Không đọc getBoundingClientRect nhiều lần trong mỗi frame nếu không cần.
- Khi pointer đi qua card/pin/control, input surface dừng đúng lúc; không để DOM overlay chặn toàn canvas do wrapper vô tình full-size.
- Tách explicit pause, UI hold, document visibility và reduced-motion. Weather render vẫn phải ngừng ngoài viewport.
- Damping + inertia dùng seconds, clamp delta sau wake; đừng giảm tốc độ có hệ thống trên thiết bị 120/144Hz.
- Không remount canvas để đổi tốc độ hoặc selection, không reload texture khi chuột di chuyển.
- Giữ DPR/quality tiers có sẵn, chỉ tăng sau profile. Thêm texture samples/passes phải có budget; không tự động bật nhiều-layer volumetric clouds hoặc postprocessing nặng.
- Giữ poster đến khi asset + shader + first frame sẵn sàng. WebGL/texture load/context failure vẫn có poster, card và navigation dùng được.
- Dispose tài nguyên GPU, cleanup Pointer Events/capture/RAF/timer/observer; async asset load sau unmount không leak.
- Giữ pin bám đúng surface và ẩn ở mặt sau khi yaw âm, drag nhanh hoặc focus tween bị ngắt. Card không trôi sang vị trí cũ.

## 9. Kiểm chứng và tiêu chí nghiệm thu

Trước khi chỉnh, chụp baseline ở một camera/orientation/sun/viewport cố định. So sánh sau trong cùng điều kiện; đừng dùng hai châu lục/góc sáng khác nhau để kết luận texture tốt hơn.

Tối thiểu 1440×900, 390×844 và viewport rộng khoảng 2560px. Test desktop bằng mouse; mobile bằng touch nếu công cụ hỗ trợ, phân biệt emulation với máy thật.

### Interaction checks

1. Không trỏ vào globe: idle period/direction giống trước.
2. Trỏ giữa: không jitter, giữ tốc độ baseline.
3. Trỏ trái gần tâm → xa tâm: giảm tốc, dừng rồi đảo chiều mềm; mép trái đạt cap âm.
4. Trỏ phải gần tâm → xa tâm: tăng dần, không vượt cap.
5. Đứng yên con trỏ: giữ target tốc độ; moving mouse không tạo spikes theo event frequency.
6. Rời vùng globe: tốc độ về idle mượt, orientation không reset.
7. Hover card/pin rồi rời: đọc được nội dung, không bị steering tranh quyền; resume policy đúng.
8. Drag chậm/nhanh, ra ngoài canvas, release/cancel: không jump, kẹt, click nhầm marker hoặc camera flip.
9. Pause khi đang reverse/inertia: dừng cả surface và clouds, hover không phá pause.
10. Prev/next tới marker mặt sau khi đang steer/drag: focus tween có quyền điều khiển rõ, không giật hoặc sai projection.
11. Tab hidden rồi quay lại, section offscreen rồi quay lại: không catch-up góc, không giữ input stale.
12. Touch scroll dọc, keyboard, reduced-motion và lỗi WebGL vẫn usable.

### Visual checks

- Quan sát Himalaya/Andes/bờ biển: texture rõ hơn, normal orientation đúng, không bump đại dương hoặc baked/dynamic shadow xung đột rõ.
- Mây tách khỏi mặt đất khi nhìn chuỗi frame 10–20 giây; reverse surface không reverse relative wind.
- Cloud shadow/night-light coverage khớp vị trí clouds tại ít nhất hai thời điểm.
- Mây không trắng cháy, không sôi/jitter, không vành trắng dày ở limb.
- Không seam rõ khi xoay qua ±180°, không map lệch bờ biển/poles.
- Kiểm tra mặt đêm và mặt ngày, không chỉ initial view.
- Loading có poster, không black flash/layout shift; lỗi map không làm mất nội dung section.

### Automated checks và bằng chứng

- Unit tests meaningful cho mapping input, clamp/dead zone, velocity damping ở 60Hz/120Hz, negative rotation, inertia return, cancel/priority logic.
- Giữ chạy tests geo/projection/occlusion hiện có.
- Chạy `npm test` và `npm run check`.
- Browser console không có lỗi shader/WebGL/hydration mới. Typecheck/build thành công không chứng minh shader đúng hoặc tương tác mượt.
- Ghi frame-time production với máy/browser/viewport cụ thể; không khẳng định 60fps trên mọi máy từ GPU desktop mạnh.
- Nếu có thể ghi video, so sánh interaction trái/phải + idle và mây; nếu không, lưu chuỗi frame có timestamp và nêu giới hạn. Screenshot đơn không chứng minh motion.

## 10. Deliverables

1. Code globe nâng cấp tích hợp trong homepage hiện tại.
2. Config rõ ràng cho idle speed, steering cap/dead zone/tau, drag gain/inertia, cloud drift và shading.
3. Asset pipeline/manifest/credit cập nhật nếu thay texture, phân biệt source gốc và processed output.
4. Báo cáo ngắn `docs/research/earth-interaction-realism.md`: nguyên nhân, quyết định kỹ thuật, file sửa, tài liệu nguồn, before/after, tests và giới hạn chưa xác minh.
5. Bằng chứng visual dưới `docs/design-references/earth-interaction-realism/`.

Không commit/push/deploy nếu chưa được yêu cầu. Không sửa website ngoài scope globe. Không mô tả approximation là mô phỏng vật lý thật. Nếu thiếu công cụ/asset thì nói chính xác blocker, vẫn hoàn tất phần độc lập có thể làm; không tự tuyên bố hoàn thành phần chưa kiểm tra.

Bắt đầu bằng audit ngắn source hiện tại và research texture, sau đó triển khai trực tiếp. Ưu tiên thứ tự: hover steering → state/drag → tách cloud clock/coverage → texture/lighting → visual QA/performance. Tự xử lý các quyết định kỹ thuật thông thường trong phạm vi brief.
