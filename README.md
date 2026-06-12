# 手机售后门店模拟器

一款基于 Phaser 3 + TypeScript 开发的 2D 俯视小游戏，玩家扮演实习前台，在手机售后门店完成顾客接待任务。

## 游戏玩法

- 在 10 分钟营业日内按叫号队列接待 8 位顾客
- 完成四步流程：接待 → 初检 → 报价 → 取机通知
- 遵守规则：碎屏先报价、进水先断电、电池鼓包单独隔离
- 操作失误扣除客户满意度，低于 65 分关卡失败
- 每关结束展示平均接待时长与失误列表

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 本地预览构建产物
npm run start
```

### Docker 部署

```bash
# 使用 docker-compose 启动静态服务器
docker-compose up -d

# 访问 http://localhost:8080
```

## 项目结构

```
├── src/
│   ├── config/
│   │   ├── labels.json        # 标签文本配置
│   │   └── level1.json        # 关卡配置（可新增 level2.json 等）
│   ├── scenes/
│   │   ├── BootScene.ts       # 启动场景
│   │   ├── MenuScene.ts       # 主菜单场景
│   │   ├── GameScene.ts       # 主游戏场景
│   │   └── ResultScene.ts     # 结算场景
│   ├── types/
│   │   └── game.ts            # TypeScript 类型定义
│   └── index.ts               # 游戏入口
├── Dockerfile
├── docker-compose.yml
├── webpack.config.js
├── tsconfig.json
└── package.json
```

## 关卡配置 JSON 格式

关卡配置文件位于 `src/config/level*.json`，格式如下：

```json
{
  "id": 1,
  "name": "关卡名称",
  "duration": 600,
  "customerCount": 8,
  "passScore": 65,
  "customers": [
    {
      "id": 1,
      "name": "顾客姓名",
      "phoneBrand": "iPhone",
      "phoneModel": "iPhone 15 Pro",
      "faultType": "water_damage",
      "correctServiceType": "water_repair",
      "correctPrice": 680,
      "priceRange": { "min": 600, "max": 750 },
      "faultTags": ["进水受潮", "无法开机"],
      "correctTags": ["进水受潮", "无法开机"],
      "specialRules": ["iphone_water_backup"],
      "isWaterDamaged": true,
      "isFoldable": false
    }
  ],
  "ruleCards": [
    {
      "id": "rule_id",
      "title": "规则标题",
      "content": "规则详细描述",
      "condition": {
        "brand": "iPhone",
        "faultType": "water_damage",
        "isFoldable": false
      }
    }
  ]
}
```

### 字段说明

#### 关卡根对象

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `number` | 关卡唯一标识 |
| `name` | `string` | 关卡显示名称 |
| `duration` | `number` | 关卡时长（秒），600 = 10分钟 |
| `customerCount` | `number` | 本关顾客总数 |
| `passScore` | `number` | 过关最低满意度（0-100） |
| `customers` | `Customer[]` | 顾客数组 |
| `ruleCards` | `RuleCard[]` | 规则提示卡片数组 |

#### Customer 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `number` | 顾客编号（取餐号） |
| `name` | `string` | 顾客姓名 |
| `phoneBrand` | `string` | 手机品牌：`iPhone` / `Samsung` / `Huawei` / `Xiaomi` / `OPPO` |
| `phoneModel` | `string` | 手机具体型号 |
| `faultType` | `string` | 故障类型（见下方枚举） |
| `correctServiceType` | `string` | 正确的受理类型（见下方枚举） |
| `correctPrice` | `number` | 标准配件价格 |
| `priceRange` | `{min, max}` | 可接受报价范围，超出范围扣分 |
| `faultTags` | `string[]` | 顾客描述的所有故障标签 |
| `correctTags` | `string[]` | 需要正确归类的核心故障标签 |
| `specialRules` | `string[]` | 可选，关联特殊规则 ID |
| `isWaterDamaged` | `boolean` | 可选，是否为进水机 |
| `isFoldable` | `boolean` | 可选，是否为折叠屏手机 |

#### RuleCard 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 规则唯一标识 |
| `title` | `string` | 卡片标题（醒目显示） |
| `content` | `string` | 规则详细内容 |
| `condition` | `object` | 触发条件，匹配顾客属性时显示卡片 |
| `condition.brand` | `string` | 可选，匹配手机品牌 |
| `condition.faultType` | `string` | 可选，匹配故障类型 |
| `condition.isFoldable` | `boolean` | 可选，匹配是否折叠屏 |

### 故障类型枚举（faultType）

| 值 | 说明 |
|----|------|
| `screen_crack` | 屏幕碎裂 |
| `water_damage` | 进水受潮 |
| `battery_swelling` | 电池鼓包 |
| `no_power` | 无法开机 |
| `speaker_issue` | 扬声器故障 |
| `camera_issue` | 摄像头问题 |
| `button_issue` | 按键失灵 |
| `charging_issue` | 充电故障 |

### 受理类型枚举（correctServiceType）

| 值 | 说明 |
|----|------|
| `screen_repair` | 屏幕维修 |
| `water_repair` | 进水维修 |
| `battery_repair` | 电池更换 |
| `general_repair` | 综合维修 |
| `diagnosis` | 故障检测 |

## 标签配置

`src/config/labels.json` 定义了界面显示的文字及标签与检测区域的映射关系：

```json
{
  "faultLabels": {
    "screen_crack": "屏幕碎裂"
  },
  "serviceTypes": {
    "screen_repair": "屏幕维修"
  },
  "inspectionAreas": {
    "display_area": "显示区域"
  },
  "tagAreaMapping": {
    "屏幕碎裂": "display_area"
  }
}
```

`tagAreaMapping` 决定了拖拽故障标签时应该放入哪个检测区域，分类错误会扣分。

## 扣分规则

| 环节 | 典型失误 | 扣分 |
|------|----------|------|
| 接待 | 选择错误的受理类型 | 8 分 |
| 初检 | 故障标签拖入错误区域 | 6 分/个 |
| 报价 | 价格超出合理范围 | 10 分 |
