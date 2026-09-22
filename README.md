# 知序学研

中文学术辅导与期刊投稿指导网站，包含九个页面、动态背景及公开咨询入口。

## GitHub Pages 发布

仓库设置中选择 Pages，发布方式选择 Deploy from a branch，分支选择 main，目录选择根目录 /(root)。这是静态网站，不需要额外构建或数据库，访客无需登录。

首页为 `index.html`，学科页为 `disciplines.html`，手记目录为 `notes.html`，文章为 `notes-文章名.html`。站内链接和图片采用相对路径。

## 本地预览

运行 `python -m http.server 8000`，在浏览器打开 `http://localhost:8000`。

页面案例保留“展示样例”标注；企业微信区域预留真实二维码位置。
