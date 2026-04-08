---
name: blog-organizer
description: 将用户输入的博客内容整理成 markdown 格式，并同步到文档项目
---

## What I do

将用户输入的博客内容整理成规范的 markdown 格式博客文章，自动总结标题，生成英文文件名，保存到文档项目，并更新导航配置。

## 路径配置

```
basePath = env.XX_DOCS_PATH
```

所有路径操作均基于 `basePath`，即 `env.XX_DOCS_PATH` 的值。

## 执行步骤

### 步骤 0：检查环境变量
验证 `env.XX_DOCS_PATH` 是否已设置。若未设置，提示用户配置环境变量。

### 步骤 1：Git Pull
在 `{basePath}` 目录执行 `git pull`，确保本地代码最新。

### 步骤 2：激活技能
当用户说"帮我整理博客内容"、"整理博客"或类似表达时激活此技能。

### 步骤 3：接收输入
提示用户输入博客内容（多行文本），等待用户完成输入。

### 步骤 4：总结标题
分析用户输入的内容，自动提取主题，生成一个简洁的中文标题（不超过30个字符）。

### 步骤 5：格式化内容
将用户输入的内容整理成标准 markdown 格式：
- 标题使用 `#` 标记
- 段落之间留空行
- 保持原有的列表、代码块等格式

### 步骤 6：生成文件名
将总结出的中文标题翻译成简短的英文，使用连字符分隔：
- 例如："Python入门教程" → `python-getting-started`
- 去掉特殊字符
- 全部小写

### 步骤 7：保存博客文件
将格式化后的 markdown 内容写入：
```
{basePath}/docs/pending/{filename}.md
```

### 步骤 8：更新导航配置
编辑 `{basePath}/docs/.vitepress/nav/pending.ts` 文件，在 `items` 数组的末尾添加新条目：

```typescript
{ text: '中文标题', link: '文件名' }
```

### 步骤 9：Git Commit & Push
在 `{basePath}` 目录执行：
1. `git add .` - 暂存所有更改
2. `git commit -m "新增博客 {中文标题}"` - 提交更改
3. `git push` - 同步到远程仓库

## 输出要求

完成后向用户报告：
- 已创建的博客文件路径
- 导航配置已更新的说明
- Git 提交和推送的结果