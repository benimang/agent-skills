---
name: amazon-product-excavate
description: >
  当用户说"挖掘亚马逊产品"、"深挖亚马逊商品"、"亚马逊产品挖掘"、"深挖产品"、"挖掘商品"、"亚马逊商品挖掘"或类似含义的中文指令时激活此技能。
  用于从用户提供的 ASIN 或 URL 列表出发，自动逐个打开 Amazon 商品页面，提取商品信息（ASIN、品牌、原价、颜色、颜色键），
  自动发现并追加同类变体 ASIN，循环处理直到所有 ASIN 均已完成。整个过程自动化执行，无需用户介入。
  即使看起来只是简单的"查看"或"提取"请求，只要涉及从亚马逊挖掘产品信息，就应该使用此技能。
---

# Amazon Product Excavate

## 概述

从用户提供的 ASIN 或 URL 列表出发，自动逐个打开 Amazon 商品页面，提取商品信息并记录到 `output.md`，同时发现同类变体 ASIN 并追加到待处理队列，循环直到所有 ASIN 处理完毕。

## 核心文件

- `asin-list.txt` — 待处理 ASIN 队列，每行一个条目。带 `#` 前缀的 ASIN（如 `#B0XXXXXXXX`）表示需要提取变体；不带 `#` 前缀的 ASIN（如 `B0XXXXXXXX`）表示仅需提取商品数据，不需要提取变体
- `output.md` — 已收集商品数据，Markdown 表格格式
- `scripts/extract-product.js` — 商品数据提取脚本（注入浏览器执行）
- `scripts/extract-variants.js` — 变体 ASIN 提取脚本（注入浏览器执行）

## Color-Key 推导规则

根据提取到的 `Color` 字段值，按以下规则推导 `Color-Key`。匹配时**不区分大小写**，检查 Color 值是否**包含**下表关键词，取最先匹配的结果。无法匹配任何关键词时，Color-Key = `XX`。

| 匹配 Color 中关键词 | Color-Key |
|---|---|
| beige / cream / tan / natural / nude / sand / camel / khaki / ivory / oatmeal | BG |
| black / jet black / obsidian / midnight black | BK |
| brown / dark brown / cocoa / chocolate / chestnut / mahogany / espresso / cognac / walnut / mocha | BR |
| gray / grey / dark gray / charcoal / slate / ash / carbon / graphite | DG |
| maroon / red / burgundy / wine / crimson / garnet / oxblood / berry / rose | MA |
| blue / navy / navy blue / royal blue / cobalt / indigo / teal | NB |
| silver / platinum / chrome / metallic silver | SL |
| 以上均不匹配 | XX |

**匹配顺序**：按上表从上到下依次尝试匹配，取最先匹配到的行对应的 Color-Key。

**注意**：此推导在流程中完成（浏览器外部逻辑），提取脚本无需返回 `color-key` 字段。

## 执行流程

### Step 1: 初始化文件

检查当前工作目录下的文件：

1. **`asin-list.txt`**：如果不存在，创建空文件
2. **`output.md`**：如果不存在，创建并写入表头：

```markdown
# Amazon Product Collection

| ASIN    | Brand | Price | Color | Color-Key |
|---------|-------|-------|-------|-----------|
```

如果 `output.md` 已存在，读取内容并提取所有已有 ASIN（从表格行中解析 `| ASIN |` 列），建立 `collected_asins` 去重集合。

### Step 2: 处理用户输入

如果用户提供了 ASIN 或 URL 列表，执行以下逻辑。如果用户未提供（例如直接说"开始挖掘"），跳过此步骤，直接使用 `asin-list.txt` 中已有的 ASIN。

**提取与过滤逻辑：**

1. 遍历用户提供的列表中的每一项
2. 如果是 10 位字母数字的组合（ASIN 格式），直接提取，转换为大写
3. 如果是 URL，从中提取 ASIN：
   - 匹配 `/dp/([A-Z0-9]{10})`
   - 匹配 `/gp/product/([A-Z0-9]{10})`
   - 匹配 `/product/([A-Z0-9]{10})`
4. 过滤掉已存在于 `collected_asins`（来自 `output.md`）中的 ASIN
5. 读取 `asin-list.txt` 当前内容，提取每行的 ASIN 部分（去掉 `#` 前缀后比较），过滤掉已存在于文件中的 ASIN
6. 将剩余的新 ASIN 追加到 `asin-list.txt` 末尾（每行一个，大写格式，**带 `#` 前缀**）。因为用户直接提供的 ASIN 是种子 ASIN，需要提取变体，所以写入时格式为 `#B0XXXXXXXX`

### Step 3: 浏览器初始化

**3.1 打开 Amazon 官网**

调用 `chrome-devtools_navigate_page` 导航到 `https://www.amazon.com`，等待页面加载完成（timeout: 30000）。

**3.2 检查并切换配送区域**

检查页面左上角配送地址区域是否显示 "10001"（纽约邮编）。如果不是：

1. 点击配送地址区域（通常是 `#nav-global-location-slot` 或 `#glow-ingress-line2`）
2. 等待地址弹窗出现
3. 在邮编输入框中输入 "10001"
4. 点击确认/应用按钮
5. 等待页面重新加载

如果配送区域切换失败，记录警告但继续执行（价格可能显示非美元价格）。

**3.3 检查并切换语言**

检查页面右上角语言切换区域是否为英语。如果不是：

1. 点击语言切换按钮（通常是 `#icp-nav-flyout` 或 `#nav-tools` 中的语言链接）
2. 在弹出的语言列表中选择 "English" 或 "ENG"
3. 等待页面切换语言并重新加载

如果语言切换失败，记录警告但继续执行。

### Step 4: 循环处理 ASIN

读取 `asin-list.txt` 的全部内容。如果文件为空或没有 ASIN，告知用户"没有待处理的 ASIN"并结束。

对 `asin-list.txt` 中的每一行，按以下方式解析：

- 如果行以 `#` 开头（如 `#B0XXXXXXXX`），则该 ASIN **需要提取变体**，实际 ASIN 为 `#` 后面的部分
- 如果行不以 `#` 开头（如 `B0XXXXXXXX`），则该 ASIN **不需要提取变体**，仅提取商品数据

解析后得到两个值：`asin`（实际 ASIN 字符串）和 `need_variants`（布尔值，是否需要提取变体）。

对每个 ASIN，按以下子步骤顺序处理。每个子步骤设有超时时间，失败时重试 1 次，仍失败则跳过该 ASIN（保留在 `asin-list.txt` 中）。

---

#### 4.1 打开商品页

**超时：30 秒 | 重试：1 次**

调用 `chrome-devtools_navigate_page` 导航到 `https://www.amazon.com/dp/{ASIN}`（timeout: 30000）。

失败处理：如果导航超时或页面加载异常，重试 1 次。仍失败则跳过此 ASIN，继续处理下一个。

#### 4.2 等待页面就绪

**超时：15 秒（最多等待 3 次，每次 5 秒）**

页面导航完成后，等待核心商品元素加载。使用 `chrome-devtools_evaluate_script` 执行：

```javascript
() => {
  const hasTitle = document.getElementById('productTitle') || document.querySelector('#titleSection h1');
  const hasBuyBox = document.getElementById('buybox') || document.querySelector('#addToCart');
  return !!(hasTitle || hasBuyBox);
}
```

如果返回 `false`，等待 5 秒后再次检查，最多重试 3 次。如果页面 15 秒后仍未就绪，标记为加载失败。

#### 4.3 提取商品数据

**超时：15 秒 | 重试：1 次**

读取脚本文件 `scripts/extract-product.js` 的内容，然后调用 `chrome-devtools_evaluate_script` 注入执行。脚本返回结构：

```json
{
  "success": true/false,
  "asin": "B0XXXXXXXX",
  "brand": "Brand Name",
  "price": "$29.99",
  "color": "Black",
  "error": "..."  // 仅失败时有
}

// 注意：color-key 不由脚本返回，由流程根据 Color-Key 推导规则在浏览器外部计算
```

**失败处理**：如果 `success` 为 `false` 或脚本执行超时/报错，重试 1 次。仍失败则跳过此 ASIN。

#### 4.4 截图保存

**超时：15 秒 | 重试：1 次**

**必须**在 4.3 数据提取成功后立即执行（此时页面已就绪且在前台）。

调用 `chrome-devtools_take_screenshot` 将页面截图保存到当前工作目录：
- 文件名格式：`{ASIN}.png`
- 参数 `filePath`：`{current_working_directory}/{ASIN}.png`

如果截图失败，重试 1 次。仍失败则记录警告，但**不跳过**该 ASIN（截图非关键步骤）。

#### 4.5 写入数据到 output.md

**无超时（本地文件操作）**

将 4.3 提取到的数据以 Markdown 表格行格式追加到 `output.md`：

1. **推导 Color-Key**：根据提取到的 `Color` 字段值，按照「Color-Key 推导规则」章节计算 `Color-Key`
2. 格式：`| {ASIN} | {Brand} | {Price} | {Color} | {Color-Key} |`
3. 如果字段值中包含 `|` 字符，替换为空格
4. 保持表格列对齐（根据各列最大宽度补空格）

**对齐示例**：

```markdown
| ASIN       | Brand        | Price  | Color    | Color-Key |
|------------|--------------|--------|----------|-----------|
| B0XXXXXXXX | SomeBrand    | $29.99 | Black    | BK        |
| B0YYYYYYYY | AnotherBrand | $49.99 | White    | XX        |
| B0ZZZZZZZZ | CoolBrand    | $19.99 | Navy Blue| NB        |
```

每次写入后，将该 ASIN 加入 `collected_asins` 去重集合。

**注意**：写入前先读取 `output.md` 的当前内容，追加新行后整体重写文件以确保格式对齐。

#### 4.6 提取变体 ASIN

**仅在 `need_variants` 为 `true` 时执行此步骤。如果 `need_variants` 为 `false`（即 ASIN 行不以 `#` 开头），跳过此步骤和 4.7，直接进入 4.8。**

**超时：10 秒 | 重试：1 次**

读取脚本文件 `scripts/extract-variants.js` 的内容，然后调用 `chrome-devtools_evaluate_script` 注入执行。脚本返回结构：

```json
{
  "success": true/false,
  "currentAsin": "B0XXXXXXXX",
  "variants": [
    { "name": "Black", "asin": "B0AAAAAAAA" },
    { "name": "White", "asin": "B0BBBBBBBB" }
  ]
}
```

**变体筛选逻辑**（纯逻辑处理，不需要浏览器操作）：

1. 从 `variants` 数组中排除 `currentAsin` 本身
2. 排除 `asin` 字段为空或无效的项
3. 尝试进行"同类型不同色"筛选：
   - 检查变体 `name` 是否包含类型标识（如 `95-96`、`88-94` 等数字范围模式 `\d{2,4}-\d{2,4}`）
   - 如果有类型标识，只保留与当前商品类型标识相同但名称不同的变体
   - 如果没有类型标识，保留所有变体（无法判断是否同类型，保守保留）
4. 将筛选后的变体 ASIN 列表称为 `candidate_asins`

**失败处理**：如果脚本执行超时或报错，重试 1 次。仍失败则跳过变体提取步骤（不影响主流程继续）。

#### 4.7 过滤并追加变体 ASIN

**无超时（本地文件操作）**

对 `candidate_asins`（4.6 的输出）进行双重过滤：

1. **过滤 output.md 中已存在的 ASIN**：检查 `collected_asins` 去重集合
2. **过滤 asin-list.txt 中已存在的 ASIN**：读取 `asin-list.txt` 当前内容，提取每行的 ASIN 部分（去掉 `#` 前缀后比较），过滤掉已存在的 ASIN

过滤后，将剩余的新 ASIN 追加到 `asin-list.txt` 末尾（每行一个，大写格式，**不带 `#` 前缀**）。因为这些变体 ASIN 不需要再递归提取变体，所以格式为 `B0XXXXXXXX`（不带 `#`）。

#### 4.8 从 asin-list.txt 移除已完成的 ASIN

**无超时（本地文件操作）**

只有当 4.1 到 4.5 全部成功时（截图失败除外），才执行此步骤：

1. 读取 `asin-list.txt` 的当前内容
2. 移除当前处理的 ASIN 行（需要匹配完整行内容，包括 `#` 前缀）。例如当前 ASIN 行为 `#B0XXXXXXXX`，则移除 `#B0XXXXXXXX` 这一行；如果行为 `B0XXXXXXXX`，则移除 `B0XXXXXXXX` 这一行
3. 写回文件

如果中间任何步骤失败导致跳过，**不移除**该 ASIN，保留在 `asin-list.txt` 中以便下次重试。

### Step 5: 循环终止与报告

当 `asin-list.txt` 为空（所有 ASIN 已处理完毕）或遍历完一轮后没有成功处理任何 ASIN（避免死循环）时，停止循环。

向用户报告：

```
挖掘完成！
- 成功处理: {N} 个商品
- 处理失败（保留在列表中）: {M} 个
- 数据文件: {路径}/output.md
- 截图目录: {路径}/
- 待重试 ASIN: {如 asin-list.txt 非空则显示剩余 ASIN 列表}
```

## 超时与重试汇总

| 子步骤 | 超时时间 | 重试次数 | 失败策略 |
|--------|---------|---------|---------|
| 4.1 打开商品页 | 30s | 1 | 跳过该 ASIN |
| 4.2 等待页面就绪 | 15s（3x5s） | — | 标记加载失败 |
| 4.3 提取商品数据 | 15s | 1 | 跳过该 ASIN |
| 4.4 截图保存 | 15s | 1 | 记录警告，不跳过 |
| 4.6 提取变体 | 10s | 1 | 仅 `#` 前缀时执行，跳过变体，不跳过 ASIN |

## 注意事项

1. **死循环防护**：每轮遍历结束后检查是否有 ASIN 被成功处理。如果一轮遍历中没有成功处理任何 ASIN，应停止循环并报告剩余 ASIN。
2. **文件操作原子性**：每次写入 `asin-list.txt` 或 `output.md` 时，先读取完整内容，修改后再整体写回，避免并发写入丢失数据。
3. **ASIN 大写统一**：所有 ASIN 在写入文件前统一转换为大写。
4. **截图时机**：截图必须在数据提取之后、页签切换之前完成，确保截图内容与提取数据一致。
5. **Markdown 格式对齐**：每次写入 `output.md` 时，应重新计算各列宽度并格式化整个表格，确保编辑时有良好的可读性。
6. **页面状态依赖**：步骤 4.1-4.6 必须在同一页面上下文中连续执行，不可在中间切换到其他页签。
7. **`#` 前缀约定**：`asin-list.txt` 中每行以 `#` 开头表示该 ASIN 需要提取变体（种子 ASIN），不以 `#` 开头表示仅需提取商品数据（发现的变体 ASIN）。这避免了变体的递归提取，大幅减少不必要的页面操作。
8. **Color-Key 推导**：Color-Key 由流程在浏览器外部根据 Color 字段推导生成，不依赖浏览器脚本。仅使用 BG、BK、BR、DG、MA、NB、SL 七个值，无法匹配时使用 XX。