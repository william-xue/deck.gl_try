# 从零到 WebGL 实战 - 3~6个月硬核路线

> 目标：从"会用框架"跨越到"懂底层渲染"，掌握高性能图形编程能力

## 路线总览

```
阶段1: 浏览器渲染原理 (2-3周)
  ↓
阶段2: Canvas 2D 高性能实战 (3-4周)
  ↓
阶段3: WebGL 基础 (6-8周)
  ↓
阶段4: WebGL 进阶与实战项目 (4-6周)
  ↓
阶段5: 专项深入 (持续)
```

---

## 阶段 1：浏览器渲染原理（2-3周）

### 目标
理解浏览器"怎么把代码变成屏幕上的像素"，能用 DevTools 分析性能瓶颈。

### 核心概念
- 渲染管线：DOM → Style → Layout → Paint → Raster → Composite
- 重排（Reflow）vs 重绘（Repaint）vs 合成（Composite）
- 合成层（Compositing Layer）触发条件与代价
- 栅格化（Rasterization）、GPU 加速
- 事件循环、requestAnimationFrame、Long Task

### 实战项目 1.1：性能分析小工具
**任务**：做一个滚动/动画性能对比页面
- 实现 3 种方案：
  1. 用 `left/top` 做动画（触发重排）
  2. 用 `transform` 做动画（只合成）
  3. 用 `will-change` 提前提层
- 用 Chrome DevTools 录制 Performance，对比三者的 Timeline
- 能指出哪里发生了 Layout/Paint/Raster/Composite

**验收标准**
- [ ] 能用 Performance 面板准确识别重排/重绘/合成
- [ ] 能解释为什么 `transform` 比 `left` 流畅
- [ ] 能看懂 Layers 面板的合成树结构

### 实战项目 1.2：FPS 监控器
**任务**：用 `requestAnimationFrame` 实现一个 FPS 计数器
```js
let lastTime = performance.now();
let frames = 0;
function tick(now) {
  frames++;
  if (now - lastTime >= 1000) {
    console.log(`FPS: ${frames}`);
    frames = 0;
    lastTime = now;
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
```
- 在页面上实时显示 FPS
- 添加"压力测试"按钮，创建大量 DOM 看 FPS 下降
- 用 Performance 面板找到掉帧的原因

**验收标准**
- [ ] FPS 监控准确（±2fps 误差内）
- [ ] 能复现并解释掉帧原因（Long Task/频繁重排/GC）
- [ ] 理解 rAF 的调度时机与帧预算（16.7ms）

### 学习资源
- [浏览器工作原理](https://web.dev/howbrowserswork/)
- [渲染性能](https://web.dev/rendering-performance/)
- [Chrome DevTools 性能分析](https://developer.chrome.com/docs/devtools/performance/)
- 视频：[Jake Archibald: 浏览器渲染原理](https://www.youtube.com/watch?v=cCOL7MC4Pl0)

---

## 阶段 2：Canvas 2D 高性能实战（3-4周）

### 目标
掌握 Canvas 2D 的增量绘制、分层缓存、性能优化，能做出 60fps 的实时图表。

### 核心概念
- Canvas 坐标系、变换矩阵（translate/rotate/scale/transform）
- 路径（Path）、填充、描边、裁剪（clip）
- 离屏缓冲（OffscreenCanvas/第二个 canvas）
- 分层绘制：静态层 + 动态层
- 增量渲染：脏矩形、只画变化区域
- 高 DPR 适配（Retina 屏）
- requestAnimationFrame 合帧处理

### 实战项目 2.1：粒子系统
**任务**：实现 5000+ 粒子的平滑运动
- 每个粒子有位置、速度、颜色、大小
- 每帧更新位置、边界反弹
- 用 rAF 驱动，保持 60fps
- 优化点：
  - TypedArray 存储粒子数据（Float32Array）
  - 批量绘制（一次 beginPath 画所有粒子）
  - 脏矩形优化（只清理/重绘变化区域）

**验收标准**
- [ ] 5000 粒子稳定 60fps
- [ ] 用 Performance 验证每帧 < 16ms
- [ ] 代码中使用 TypedArray 和批量绘制

### 实战项目 2.2：高性能 K 线图（核心）
**任务**：实现一个实时更新的 K 线图表
- 功能要求：
  - 显示 500 根历史 K 线
  - WebSocket 模拟数据推送（每 100ms 一次）
  - 鼠标悬停显示十字线和数值
  - 支持滚轮缩放、拖动平移
- 性能要求：
  - 分 3 层 Canvas：
    1. 背景层（网格、坐标轴）- 静态缓存
    2. K 线层（历史数据）- 变化时重绘
    3. 交互层（十字线、当前值）- 每帧重绘
  - 用 rAF 合帧：高频数据按帧合并处理
  - 增量更新：只更新"当前那根 K"

**代码骨架**
```js
// 数据队列
const tickQueue = [];
socket.onmessage = e => tickQueue.push(JSON.parse(e.data));

// 分层 Canvas
const bgCanvas = document.getElementById('bg');
const chartCanvas = document.getElementById('chart');
const interactCanvas = document.getElementById('interact');

// rAF 合帧渲染
function frame() {
  if (tickQueue.length) {
    const batch = tickQueue.splice(0); // 合并这一帧的所有 tick
    updateCurrentCandle(batch);        // 只更新当前K线
    redrawChartLayer();                // 只重绘K线层
  }
  redrawInteractLayer(); // 十字线每帧都画
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

**验收标准**
- [ ] 每秒 10 次数据推送，稳定 60fps
- [ ] 分层实现正确（背景不闪烁、十字线流畅）
- [ ] Performance 面板：每帧 < 16ms，无 Long Task
- [ ] 鼠标交互不卡顿

### 实战项目 2.3：图片编辑器
**任务**：实现基础图片编辑功能
- 加载图片到 Canvas
- 实现滤镜：灰度、反色、亮度调整
- 使用 ImageData 直接操作像素
- 添加文字、贴纸（离屏缓冲合成）
- 导出为图片（toDataURL/toBlob）

**验收标准**
- [ ] 滤镜处理流畅（< 100ms for 1080p）
- [ ] 理解 ImageData 的像素数组结构
- [ ] 使用离屏 canvas 做图层合成

### 学习资源
- [MDN Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [HTML5 Canvas Deep Dive](https://joshondesign.com/p/books/canvasdeepdive/toc.html)
- [High Performance Canvas](https://www.html5rocks.com/en/tutorials/canvas/performance/)

---

## 阶段 3：WebGL 基础（6-8周）

### 目标
理解 GPU 渲染管线、会写 Shader、能做基础的 3D 图形和批量绘制。

### 核心概念
- GPU 渲染管线：Vertex Shader → Rasterization → Fragment Shader
- 顶点缓冲区（VBO）、索引缓冲区（EBO）、顶点数组对象（VAO）
- 着色器语言（GLSL）：vec/mat 数据类型、内建函数
- 坐标变换：模型矩阵、视图矩阵、投影矩阵（MVP）
- 纹理（Texture）、帧缓冲区（Framebuffer）
- 深度测试、混合（Blending）、剔除（Culling）

### 实战项目 3.1：彩色三角形
**任务**：WebGL 的 "Hello World"
- 创建 WebGL 上下文
- 编写 Vertex Shader 和 Fragment Shader
- 创建 VBO，传递顶点位置和颜色
- 绘制一个渐变色三角形

**Vertex Shader 示例**
```glsl
attribute vec2 a_position;
attribute vec3 a_color;
varying vec3 v_color;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_color = a_color;
}
```

**Fragment Shader 示例**
```glsl
precision mediump float;
varying vec3 v_color;

void main() {
  gl_FragColor = vec4(v_color, 1.0);
}
```

**验收标准**
- [ ] 能独立编写并编译 Shader
- [ ] 理解 attribute、varying、uniform 的区别
- [ ] 能解释为什么颜色会自动插值（光栅化）

### 实战项目 3.2：纹理贴图
**任务**：在矩形上贴一张图片
- 加载图片并创建纹理
- 传递纹理坐标（UV）
- 在 Fragment Shader 中采样纹理（texture2D）
- 实现纹理的平铺、拉伸、过滤（LINEAR/NEAREST）

**验收标准**
- [ ] 能正确加载并显示纹理
- [ ] 理解 UV 坐标系（0-1）
- [ ] 能调整纹理过滤和环绕模式

### 实战项目 3.3：3D 旋转立方体
**任务**：实现经典的旋转立方体
- 定义立方体的 8 个顶点和 6 个面（索引缓冲）
- 实现 MVP 变换矩阵
  - Model：立方体自转
  - View：摄像机位置
  - Projection：透视投影
- 启用深度测试（DEPTH_TEST）
- 每帧更新旋转角度

**关键代码**
```js
// 顶点着色器中
uniform mat4 u_mvp;
attribute vec3 a_position;

void main() {
  gl_Position = u_mvp * vec4(a_position, 1.0);
}

// JS 中计算 MVP
const mvp = mat4.create();
mat4.multiply(mvp, projection, view);
mat4.multiply(mvp, mvp, model);
gl.uniformMatrix4fv(u_mvpLoc, false, mvp);
```

**验收标准**
- [ ] 立方体能正确旋转，无面片错位
- [ ] 理解深度测试的作用
- [ ] 能手动计算 MVP 矩阵（或用 gl-matrix）

### 实战项目 3.4：粒子系统（GPU 版本）
**任务**：用 WebGL 实例化绘制 10 万个粒子
- 使用 `ANGLE_instanced_arrays` 扩展（或 WebGL2 的 `drawArraysInstanced`）
- 每个粒子的位置/颜色存在单独的 VBO
- Vertex Shader 中用 `gl_InstanceID` 区分每个粒子
- CPU 只更新位置数据，GPU 批量绘制

**验收标准**
- [ ] 10 万粒子稳定 60fps
- [ ] 理解实例化绘制的原理
- [ ] 用 `bufferSubData` 做增量更新

### 学习资源
- **必读**：[WebGL Fundamentals](https://webglfundamentals.org/) - 最好的 WebGL 教程
- [The Book of Shaders](https://thebookofshaders.com/) - 学 GLSL 必看
- [WebGL2 Fundamentals](https://webgl2fundamentals.org/)
- 库：[gl-matrix](https://glmatrix.net/) - 矩阵运算库

---

## 阶段 4：WebGL 进阶与实战项目（4-6周）

### 目标
掌握复杂场景优化、后处理、大规模数据可视化。

### 核心技术
- 帧缓冲区（FBO）与离屏渲染
- 多目标渲染（MRT）
- 后处理效果（Bloom/DOF/Motion Blur）
- 大数据优化：LOD、视锥剔除、空间索引
- Compute-like 技巧（用 Texture 做 GPGPU）

### 实战项目 4.1：后处理管线
**任务**：实现 Bloom（泛光）效果
- 渲染场景到纹理（FBO）
- 提取高亮部分（threshold pass）
- 高斯模糊（两遍分离式模糊）
- 叠加到原图（additive blending）

**验收标准**
- [ ] Bloom 效果正确且可调节强度
- [ ] 理解多 Pass 渲染流程
- [ ] FBO 切换无错误

### 实战项目 4.2：大规模散点图
**任务**：渲染 100 万个点的实时散点图
- 数据存储：用纹理存坐标/颜色（1024x1024 纹理 = 100万像素）
- Vertex Shader 从纹理读取数据
- 支持缩放/平移（MVP 变换）
- 优化：视锥剔除（只画可见点）、LOD（远处点更小）

**验收标准**
- [ ] 100 万点稳定 60fps
- [ ] 缩放/平移流畅
- [ ] 理解用纹理做数据存储的技巧

### 实战项目 4.3：实时 K 线图（WebGL 版本）
**任务**：把阶段 2 的 K 线图用 WebGL 重写
- 每根 K 线用实例化绘制（2 个三角形 = 1 个矩形）
- Vertex Shader 中根据 OHLC 数据生成顶点
- 支持 10 万根 K 线的流畅渲染
- 增量更新：只用 `bufferSubData` 更新"当前K"的数据

**数据结构**
```js
// 每根K线：[时间, 开, 高, 低, 收, 成交量]
const candleData = new Float32Array(100000 * 6);

// 只更新最后一根
gl.bufferSubData(gl.ARRAY_BUFFER, 
  (currentIndex * 6) * 4, // offset
  new Float32Array([ts, o, h, l, c, v])
);
```

**验收标准**
- [ ] 10 万根 K 线稳定 60fps
- [ ] 实时推送数据不掉帧
- [ ] 增量更新正确（只改变当前K）

### 实战项目 4.4：3D 地球可视化
**任务**：在球面上显示数据点（如地震、航班）
- 加载地球纹理贴图
- 根据经纬度计算球面坐标
- 用光照模型（Phong/Blinn-Phong）
- 实现鼠标旋转地球（Arcball）

**验收标准**
- [ ] 地球纹理正确、光照合理
- [ ] 数据点位置准确
- [ ] 交互流畅

### 学习资源
- [GPU Gems（免费在线）](https://developer.nvidia.com/gpugems/gpugems/contributors) - 图形学经典
- [Shadertoy](https://www.shadertoy.com/) - Shader 创意灵感
- [Three.js 源码](https://github.com/mrdoob/three.js) - 学习工程实践

---

## 阶段 5：专项深入（持续）

### 方向选择

#### A. 数据可视化方向
**目标**：成为可视化专家
- 深入学习 D3.js、ECharts、deck.gl 源码
- 实现自己的图表库（支持 Canvas/WebGL 双引擎）
- 研究大规模数据聚合算法（binning/clustering）
- 商业项目：金融行情、工业监控大屏、GIS 可视化

**推荐资源**
- [D3.js 源码](https://github.com/d3/d3)
- [deck.gl 文档](https://deck.gl/)
- [Observable](https://observablehq.com/) - 可视化创作平台

#### B. 游戏/3D 方向
**目标**：成为图形/游戏工程师
- 深入 Three.js/Babylon.js，做定制化渲染
- 学习物理引擎（Cannon.js/Ammo.js）
- 实现阴影、全局光照、PBR 材质
- 商业项目：3D 产品展示、虚拟展厅、WebGL 游戏

**推荐资源**
- [Three.js Journey](https://threejs-journey.com/) - 付费但质量极高
- [Real-Time Rendering 书](https://www.realtimerendering.com/)
- [Unity Shader 入门](https://www.zhihu.com/column/c_1339307806320799744)

#### C. 音视频方向
**目标**：成为多媒体工程师
- WebCodecs API、Canvas/WebGL 帧处理
- 实时滤镜、美颜、特效
- WebRTC 视频流处理
- 商业项目：在线编辑器、直播美颜、视频会议

**推荐资源**
- [WebCodecs 文档](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)
- [FFmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm)

#### D. WebGPU 前沿方向
**目标**：掌握下一代图形 API
- 学习 WebGPU（比 WebGL 更现代、更强大）
- Compute Shader 做 GPGPU 计算
- 跨平台高性能应用
- 商业项目：AI 模型推理、科学计算可视化

**推荐资源**
- [WebGPU Fundamentals](https://webgpufundamentals.org/)
- [WebGPU Samples](https://austin-eng.com/webgpu-samples/)

---

## 学习建议与避坑指南

### 学习策略
1. **项目驱动**：不要只看教程，每个概念都要做个小项目验证
2. **性能优先**：每个项目都用 DevTools 验证性能，养成 profiling 习惯
3. **读源码**：看 PixiJS/regl/Three.js 源码，学习工程实践
4. **做笔记**：用 Markdown 记录踩坑和解决方案
5. **循序渐进**：不要跳步，基础不牢会卡很久

### 常见坑
- ❌ 跳过 Canvas 2D 直接学 WebGL（基础不牢）
- ❌ 不做性能分析，只关注功能实现
- ❌ 只看教程不动手，代码一定要自己写
- ❌ 纠结数学细节（矩阵推导），先会用再深究
- ❌ 闭门造车，多看开源项目源码

### 时间分配建议
- 每天至少 2 小时编码（周末 4+ 小时）
- 70% 时间写代码，20% 看文档/源码，10% 看视频
- 每周至少完成一个小项目

### 验收里程碑
- ✅ 第 1 个月：能用 Canvas 2D 做出流畅的粒子系统和 K 线图
- ✅ 第 2 个月：能独立写 Shader，实现 3D 物体和纹理
- ✅ 第 3 个月：能用 WebGL 做实例化绘制，处理 10 万级数据
- ✅ 第 4-6 个月：完成一个商业级项目（可视化/游戏/多媒体）

---

## 推荐工具与库

### 开发工具
- **编辑器**：VS Code + GLSL 语法高亮插件
- **调试**：Chrome DevTools + [Spector.js](https://spector.babylonjs.com/)（WebGL 调试器）
- **性能**：Chrome Performance、Frame Profiler
- **Shader 编辑**：[Shadertoy](https://www.shadertoy.com/)、[GLSL Sandbox](http://glslsandbox.com/)

### 常用库
- **数学库**：[gl-matrix](https://glmatrix.net/)（必备）
- **轻量 WebGL**：[regl](https://github.com/regl-project/regl)、[TWGL](https://twgljs.org/)
- **全功能引擎**：[Three.js](https://threejs.org/)、[Babylon.js](https://www.babylonjs.com/)
- **2D 加速**：[PixiJS](https://pixijs.com/)
- **可视化**：[deck.gl](https://deck.gl/)、[Plotly.js](https://plotly.com/javascript/)

---

## 最后：为什么值得投入

### 短期收益（3-6 个月）
- ✅ 技术面试碾压同级候选人
- ✅ 能接高溢价的可视化/图形外包
- ✅ 公司内部成为"图形/性能优化"专家

### 长期价值（1-3 年）
- ✅ 不可替代性：AI 还写不好 Shader 和性能优化
- ✅ 职业天花板高：可以一直写代码且越老越值钱
- ✅ 跨行业适用：游戏、金融、工业、医疗都需要图形人才
- ✅ 副业潜力：可视化咨询、Shader 特效、3D 展示都是高价服务

### 个人成长
- 真正理解"计算机怎么画图"
- 建立系统性能分析和优化的方法论
- 跨越"业务开发"和"底层工程"的鸿沟

---

## 行动清单

### 本周行动（Week 1）
- [ ] 安装 Chrome DevTools，学会录制 Performance
- [ ] 完成"性能分析小工具"项目
- [ ] 实现 FPS 监控器
- [ ] 阅读《浏览器工作原理》前 3 章

### 本月目标（Month 1）
- [ ] 完成阶段 1 和阶段 2 所有项目
- [ ] 做出 60fps 的粒子系统
- [ ] 做出分层缓存的 K 线图
- [ ] 开始写学习笔记（Markdown/博客）

### 3 个月目标
- [ ] 完成阶段 3 所有 WebGL 基础项目
- [ ] 能独立编写 Shader 和 MVP 变换
- [ ] 实现 10 万粒子的 GPU 绘制

### 6 个月目标
- [ ] 完成一个商业级项目（选一个方向）
- [ ] 在 GitHub 上开源一个图形库/工具
- [ ] 技术博客至少 10 篇
- [ ] 开始接外包或准备跳槽

---

## 资源汇总

### 必读教程
1. [WebGL Fundamentals](https://webglfundamentals.org/) ⭐⭐⭐⭐⭐
2. [The Book of Shaders](https://thebookofshaders.com/) ⭐⭐⭐⭐⭐
3. [浏览器工作原理](https://web.dev/howbrowserswork/) ⭐⭐⭐⭐
4. [High Performance Canvas](https://www.html5rocks.com/en/tutorials/canvas/performance/) ⭐⭐⭐⭐

### 推荐书籍
- 《WebGL 编程指南》- 入门必读
- 《Real-Time Rendering》- 图形学圣经（偏理论）
- 《游戏引擎架构》- 工程实践

### 社区与参考
- [Stack Overflow - WebGL 标签](https://stackoverflow.com/questions/tagged/webgl)
- [Shadertoy](https://www.shadertoy.com/) - Shader 创意
- [Three.js Discourse](https://discourse.threejs.org/)
- [知乎 - WebGL 话题](https://www.zhihu.com/topic/19550826)

---

## 结语

这份路线图的核心是"项目驱动 + 性能优先 + 循序渐进"。不要被术语吓到，每个概念都配有可运行的代码和验收标准。

**记住**：
- 业务代码 3 个月能上手，渲染/图形需要 6 个月打基础
- 但前者天花板低且容易被替代，后者越做越值钱
- 你投入的每一小时，都在建立护城河

**现在就开始**：
1. 打开 Chrome DevTools
2. 创建第一个 `<canvas>` 元素
3. 写下第一行 `requestAnimationFrame`

从今天起，你就是懂"底层渲染"的前端工程师了。加油！🚀

---

**版本**：v1.0  
**更新日期**：2025-10-28  
**作者建议**：每完成一个阶段，回来更新这份文档，记录你的进度和心得
