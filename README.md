# 前端图形学路线（Canvas → WebGL → deck.gl/nebula.gl）

> 目标：面向工程实践，从 2D 基础到 GPU 渲染与可视化的全链路能力。仓库按周推进，包含示例代码、任务清单与参考资料。

## 仓库结构

```
.
├── week01_canvas_basics/      # Canvas 基础示例与练习
├── week02_svg_vs_canvas/      # SVG 与 Canvas 对比实验
├── week03_webgl_intro/        # 原生 WebGL 三角形示例
├── week04_threejs_scene/      # Three.js 场景化游览
├── week05_deckgl_basics/      # deck.gl 地理可视化入门
├── week06_nebulagl_edit/      # nebula.gl 可编辑图层骨架
├── notes/                     # （预留）学习笔记与资料整理
├── README.md
└── .gitignore
```

- 示例均使用原生 HTML + JS，可直接用静态服务器打开。
- `notes/` 目录暂留空位，后续可加入学习笔记或阅读总结。

## 快速开始

```bash
# 任一示例目录下启动静态服务器（以 Python 为例）
cd week01_canvas_basics
python3 -m http.server 5173
# 浏览器访问 http://localhost:5173 即可查看示例
```

> 也可使用 VS Code Live Server、`npx serve` 等任意静态服务器工具。

## 六周主线任务

| 周次 | 主题 | 目标 | 练习与验收 |
| --- | --- | --- | --- |
| Week 01 | Canvas 基础打底 | 掌握 2D context、基本图形、坐标变换、动画循环 | 完成太阳系旋转 + 电力节点连线 Demo；实现播放/暂停按钮 |
| Week 02 | SVG vs Canvas & 事件模型 | 理解向量/位图差异、命中测试、交互事件 | 同一线路数据分别用 SVG/Canvas 实现；记录 FPS 与交互差异小结 |
| Week 03 | WebGL 零到一 | 会写最小顶点/片元着色器；理解 attribute/uniform/buffer | 渲染可旋转彩色三角形；封装上传顶点数据的工具函数 |
| Week 04 | Three.js 场景化思维 | 掌握 Scene/Camera/Renderer、光照、纹理、控制器 | 构建三维站点与线路游览视图；支持相机轨道控制与截图 |
| Week 05 | deck.gl / luma.gl 地理可视化 | 理解 Layer 系统、GeoJSON 与投影；掌握多图层协同 | 渲染电力网络点/线图层；根据负载着色，保证 10 万要素 30 FPS |
| Week 06 | nebula.gl 可编辑与度量 | 熟悉 EditableGeoJsonLayer、捕捉、量测 | 地图上拖拽修改线路折点；端点吸附与长度计算验证 |

### Week 01 – 每日拆解（示例）

- **Day 1**：熟悉 `<canvas>`、2D context、绘制矩形/圆形。
- **Day 2**：封装坐标转换函数，加入平移/缩放。
- **Day 3**：实现太阳系旋转动画（`requestAnimationFrame`）。
- **Day 4**：绘制电力节点/连线，加入颜色与文本。
- **Day 5**：整合播放/暂停控制，撰写总结笔记。

> 可根据自己的节奏调整每日任务；建议每天结束时在 `notes/` 内记录心得。

## Git 工作流建议

```bash
git add .
git commit -m "feat: 完成 week01 canvas 练习"
git push origin main
```

- 每周完成一个主题时建议创建单独分支，方便 code review。
- 可以在 Pull Request 中记录本周收获、性能测试数据或问题清单。

## 推荐资料

- [MDN Canvas API](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API)
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [Three.js Journey](https://threejs-journey.com/)
- [deck.gl 文档](https://deck.gl/docs)
- [nebula.gl 文档](https://nebula.gl/)
- 《WebGL 编程指南》（Matsuda & Lea）

---

未来计划：
- 继续扩展 GPU 后处理、WebGPU 相关练习目录，完善后续周的进阶路线。
- `notes/` 目录可以存储学习心得、问题记录与性能数据截图。

欢迎持续迭代，保持学习节奏！
