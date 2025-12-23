## 项目背景
项目痛点：有很多可以外借的设备，然后存在设备外借不知道什么时候借出以及什么时候归还，找不到归还人的联系方式，项目离线运行本地部署，容易打开，进去软件定期提醒有哪些人没还

场景：学生1要借示波器，学生2也要借示波器，有20个学生借示波器，我要知道每个学生的示波器是对应哪一个

## 产品定位
本产品是一套**本地部署的离线运行**设备借还管理系统，面向实验室管理教师，提供设备借还全流程管理、逾期提醒、资产统计等功能。

## 目标用户
**主要用户**：实验室/教学设备管理教师

**用户特征**：

+ 需要管理多种类型、多数量的可外借设备
+ 需要追踪设备借还状态和借用人信息
+ 需要及时提醒学生归还逾期设备

## 版本信息
---

version: v1.0.0

date: 2025-11-11

author: 陈子轩、李可可、宁硕

---

## 变更日志
| 时间 | 版本号 | 变更人 | 变更方式 | 主要变更内容 |
| :---: | :---: | --- | :---: | :---: |
| 11.11 | v1.0.0 | 陈子轩 | 新建PRD文档框架 | 创建PRD初稿 |
| 11.12 | v.1.0.1 | 宁硕 | 更新文档 | 补充相关文件<br/>完善用例描述 |
| 3 | | 陈子轩 | | 将AI文档重新梳理，抽离弹窗界面，并单独进行说明 |
| 4 | | | | |
| 5 | | | | |


## 功能详细说明
### 泳道图/活动图
崔力老师表格：编号、名称、品牌、规格、数量、价格、存放地

暂时无法在飞书文档外展示此内容

### 功能模块结构
```plain
设备借还系统
├── 用户认证模块
│   └── 登录功能
└── 管理端页面布局
    ├── 首页看板模块(数据可视化看板)
    ├── 逾期提醒弹窗
    ├── 借出设备记录
    │   ├── 借出操作
    │   └── 归还操作
    ├── 已还设备记录
    ├── 设备管理模块
    │   ├── 设备列表查询
    │   ├── 新增设备
    │   ├── 编辑设备
    │   └── 删除设备
    └── 个人中心模块
        └── 修改密码
```

### 用例描述
#### 单个设备显示“弹窗”逻辑说明
由于新增借出设备弹窗、归还设备确认弹窗、新增资产弹窗、编辑资产弹窗、删除资产弹窗呈现的逻辑均一致，仅仅下方button不同

#### 1.登录注册模块
**功能描述**： 仅提供登录功能，无需注册。系统为单用户使用（教师本人）。

**页面要素**：

+ 用户名输入框
+ 密码输入框（带显示/隐藏切换）
+ 登录按钮

**交互流程**：

1. 用户输入用户名和密码
2. 点击登录按钮
3. 系统验证用户名密码
4. 验证成功：跳转首页，弹出逾期提醒弹窗
5. 验证失败：提示"用户名或密码错误"

**验证规则**：

+ 用户名和密码均不能为空

**UI要求**：

+ 界面简洁美观
+ 支持Enter键快捷登录

#### 2.首页看板模块
**功能描述**： 通过图表形式直观展示设备资产和借还情况，<font style="background-color:rgba(255,246,122,0.8);">设计新增借出设备button</font>

**看板布局**：

**第一行：关键指标卡片**

+ 设备总数
+ 在借设备数量
+ 可借设备数量
+ 逾期设备数量（红色高亮）

**第二行：图表区域**

1. **设备类型分布（饼图/环形图）**
    1. 展示各类型设备数量占比
    2. 支持点击查看该类型设备详情
2. **设备借出状态（柱状图）**
    1. X轴：设备类型
    2. Y轴：数量
    3. 分组：在借数量 / 可借数量
3. **归还倒计时（时间轴/列表）**
    1. 展示近期（7天内）需归还的设备
    2. 显示：设备名称、借用人、剩余天数
    3. 按归还时间升序排列

##### 逾期提醒弹窗
**触发时机**： 用户登录成功后自动弹出

**弹窗内容**：

**标题**：设备归还提醒

**数据展示**：

+ 逾期设备列表
+ 临期设备列表（距离归还期限≤5天）

**列表字段**：

| **<font style="color:rgb(0, 0, 0);">字段</font>** | **<font style="color:rgb(0, 0, 0);">说明</font>** |
| :---: | :---: |
| <font style="color:rgb(0, 0, 0);">设备编号</font> | <font style="color:rgb(0, 0, 0);">设备唯一标识</font> |
| <font style="color:rgb(0, 0, 0);">设备名称</font> | <font style="color:rgb(0, 0, 0);">设备类型名称</font> |
| <font style="color:rgb(0, 0, 0);">借用人</font> | <font style="color:rgb(0, 0, 0);">学生姓名</font> |
| <font style="color:rgb(0, 0, 0);">联系方式</font> | <font style="color:rgb(0, 0, 0);">学生手机号</font> |
| <font style="color:rgb(0, 0, 0);">剩余天数</font> | <font style="color:rgb(0, 0, 0);">距离归还期限天数（负数表示已逾期）</font> |
| <font style="color:rgb(0, 0, 0);">通知状态</font> | <font style="color:rgb(0, 0, 0);">未通知/已通知（按钮）</font> |


**交互操作**：

+ 点击"未通知"按钮 → 变更为"已通知"状态，记录通知时间
+ 点击"已通知"按钮 → 无操作（仅展示状态）
+ 点击关闭按钮 → 关闭弹窗，进入看板页面

**显示逻辑**：

+ 优先显示逾期设备（剩余天数<0）
+ 其次显示临期设备（0≤剩余天数≤5）

这里要考虑一下如何未还设备过多的情况，需不需要设置只显示离归还时间还剩t天设备

+ 按剩余天数升序排列

#### 3.借出设备记录
**功能描述**： 查询和管理当前所有借出未归还的设备记录

**列表字段**：

| **<font style="color:rgb(0, 0, 0);">字段</font>** | **<font style="color:rgb(0, 0, 0);">类型</font>** | **<font style="color:rgb(0, 0, 0);">说明</font>** |
| :---: | :---: | :---: |
| <font style="color:rgb(0, 0, 0);">设备编号</font> | <font style="color:rgb(0, 0, 0);">文本</font> | <font style="color:rgb(0, 0, 0);">设备唯一标识</font> |
| <font style="color:rgb(0, 0, 0);">设备类型</font> | <font style="color:rgb(0, 0, 0);">文本</font> | <font style="color:rgb(0, 0, 0);">设备分类名称</font> |
| <font style="color:rgb(0, 0, 0);">设备厂商</font> | <font style="color:rgb(0, 0, 0);">文本</font> | <font style="color:rgb(0, 0, 0);">制造商名称</font> |
| <font style="color:rgb(0, 0, 0);">借用人</font> | <font style="color:rgb(0, 0, 0);">文本</font> | <font style="color:rgb(0, 0, 0);">学生姓名</font> |
| <font style="color:rgb(0, 0, 0);">班级</font> | <font style="color:rgb(0, 0, 0);">文本</font> | <font style="color:rgb(0, 0, 0);">学生班级</font> |
| <font style="color:rgb(0, 0, 0);">学号</font> | <font style="color:rgb(0, 0, 0);">文本</font> | <font style="color:rgb(0, 0, 0);">学生学号</font> |
| <font style="color:rgb(0, 0, 0);">联系方式</font> | <font style="color:rgb(0, 0, 0);">文本</font> | <font style="color:rgb(0, 0, 0);">学生手机号</font> |
| <font style="color:rgb(0, 0, 0);">借出时间</font> | <font style="color:rgb(0, 0, 0);">日期时间</font> | <font style="color:rgb(0, 0, 0);">设备借出时间</font> |
| <font style="color:rgb(0, 0, 0);">应还时间</font> | <font style="color:rgb(0, 0, 0);">日期时间</font> | <font style="color:rgb(0, 0, 0);">约定归还时间</font> |
| <font style="color:rgb(0, 0, 0);">剩余天数</font> | <font style="color:rgb(0, 0, 0);">计算字段</font> | <font style="color:rgb(0, 0, 0);">应还时间-当前时间</font> |
| <font style="color:rgb(0, 0, 0);">操作</font> | <font style="color:rgb(0, 0, 0);">按钮</font> | <font style="color:rgb(0, 0, 0);">归还按钮</font> |


**查询条件**：

| **<font style="color:rgb(0, 0, 0);">条件</font>** | **<font style="color:rgb(0, 0, 0);">控件类型</font>** | **<font style="color:rgb(0, 0, 0);">说明</font>** |
| --- | --- | --- |
| <font style="color:rgb(0, 0, 0);">设备编号</font> | <font style="color:rgb(0, 0, 0);">下拉搜索框</font> | <font style="color:rgb(0, 0, 0);">支持模糊搜索</font> |
| <font style="color:rgb(0, 0, 0);">设备类型</font> | <font style="color:rgb(0, 0, 0);">下拉框</font> | <font style="color:rgb(0, 0, 0);">单选，选项来自设备库</font> |
| <font style="color:rgb(0, 0, 0);">设备厂商</font> | <font style="color:rgb(0, 0, 0);">下拉框</font> | <font style="color:rgb(0, 0, 0);">单选，选项来自设备库</font> |
| <font style="color:rgb(0, 0, 0);">借用人</font> | <font style="color:rgb(0, 0, 0);">下拉搜索框</font> | <font style="color:rgb(0, 0, 0);">支持模糊搜索</font> |


**默认排序**： 按剩余天数升序（最近需归还的排在前面）

**操作功能**：

1. **新增借出**
    1. 点击"新增借出"按钮
    2. 弹出"借出设备"对话框（详见下文）
2. **归还设备**
    1. 点击记录行的"归还"按钮
    2. 弹出"归还确认"对话框（详见下文）

**分页**：

+ 每页显示20条记录

##### 新增借出设备弹窗
**触发方式**： 点击"借出设备记录"页面的"新增借出"按钮

**弹窗标题**：借出设备

**表单字段**：

| **<font style="color:rgb(0, 0, 0);">字段</font>** | **<font style="color:rgb(0, 0, 0);">控件</font>** | **<font style="color:rgb(0, 0, 0);">必填</font>** | **<font style="color:rgb(0, 0, 0);">验证规则</font>** |
| :---: | :---: | :---: | :---: |
| <font style="color:rgb(0, 0, 0);">设备类型</font> | <font style="color:rgb(0, 0, 0);">下拉搜索框</font> | <font style="color:rgb(0, 0, 0);">是</font> | <font style="color:rgb(0, 0, 0);">选择已有设备类型</font> |
| <font style="color:rgb(0, 0, 0);">设备编号</font> | <font style="color:rgb(0, 0, 0);">下拉搜索框</font> | <font style="color:rgb(0, 0, 0);">是</font> | <font style="color:rgb(0, 0, 0);">根据设备类型动态加载可借设备编号</font> |
| <font style="color:rgb(0, 0, 0);">借出人</font> | <font style="color:rgb(0, 0, 0);">输入框</font> | <font style="color:rgb(0, 0, 0);">是</font> | <font style="color:rgb(0, 0, 0);">1-20个字符</font> |
| <font style="color:rgb(0, 0, 0);">班级</font> | <font style="color:rgb(0, 0, 0);">输入框</font> | <font style="color:rgb(0, 0, 0);">是</font> | <font style="color:rgb(0, 0, 0);">1-50个字符</font> |
| <font style="color:rgb(0, 0, 0);">学号</font> | <font style="color:rgb(0, 0, 0);">输入框</font> | <font style="color:rgb(0, 0, 0);">是</font> | <font style="color:rgb(0, 0, 0);">10位学号</font> |
| <font style="color:rgb(0, 0, 0);">联系方式</font> | <font style="color:rgb(0, 0, 0);">输入框</font> | <font style="color:rgb(0, 0, 0);">是</font> | <font style="color:rgb(0, 0, 0);">11位手机号</font> |
| <font style="color:rgb(0, 0, 0);">借出时间</font> | <font style="color:rgb(0, 0, 0);">日期时间选择器</font> | <font style="color:rgb(0, 0, 0);">是</font> | <font style="color:rgb(0, 0, 0);">默认当前时间</font> |
| <font style="color:rgb(0, 0, 0);">应还时间</font> | <font style="color:rgb(0, 0, 0);">日期时间选择器</font> | <font style="color:rgb(0, 0, 0);">是</font> | <font style="color:rgb(0, 0, 0);">必须晚于借出时间</font> |


**交互逻辑**：

1. **设备类型选择**：
    1. 用户选择设备类型
    2. 系统加载该类型下所有可借设备（状态=可借）到"设备编号"下拉框
2. **设备编号选择**：
    1. 支持输入关键字筛选下拉选项
    2. 仅显示可借状态的设备
    3. 选择后自动带出设备厂商信息（仅展示）
3. **提交操作**：
    1. 点击"确认"按钮 → 验证表单 → 创建借出记录 → 更新设备状态为"已借出" → 关闭弹窗 → 刷新列表
    2. 点击"取消"按钮 → 关闭弹窗，不保存

**错误提示**：

+ 所选设备已被借出 → "该设备当前不可借，请选择其他设备"
+ 手机号格式错误 → "请输入正确的11位手机号"
+ 学号格式错误 → "请输入正确的学号"

##### 归还设备确认弹窗
**触发方式**： 点击"借出设备记录"列表中的"归还"按钮

**弹窗标题**：归还确认

**弹窗内容**：

```plain
确认归还以下设备？

设备编号：[设备编号]
设备名称：[设备类型]
借出人：[姓名]
借出时间：[YYYY-MM-DD HH:mm]
应还时间：[YYYY-MM-DD HH:mm]
实际归还时间：[当前时间]（自动填充）

【确认归还】 【取消】
```

**交互逻辑**：

+ 点击"确认归还" → 创建归还记录 → 更新设备状态为"可借" → 从借出列表移除 → 添加到已还列表 → 关闭弹窗
+ 点击"取消" → 关闭弹窗，不操作

#### 4.已还设备记录
**功能描述**： 查询已归还设备的历史记录，用于溯源和问题追踪

**列表字段**：

| **<font style="color:rgb(0, 0, 0);">字段</font>** | **<font style="color:rgb(0, 0, 0);">类型</font>** | **<font style="color:rgb(0, 0, 0);">说明</font>** |
| :---: | :---: | :---: |
| <font style="color:rgb(0, 0, 0);">设备编号</font> | <font style="color:rgb(0, 0, 0);">文本</font> | <font style="color:rgb(0, 0, 0);">设备唯一标识</font> |
| <font style="color:rgb(0, 0, 0);">设备类型</font> | <font style="color:rgb(0, 0, 0);">文本</font> | <font style="color:rgb(0, 0, 0);">设备分类名称</font> |
| <font style="color:rgb(0, 0, 0);">设备厂商</font> | <font style="color:rgb(0, 0, 0);">文本</font> | <font style="color:rgb(0, 0, 0);">制造商名称</font> |
| <font style="color:rgb(0, 0, 0);">借出人</font> | <font style="color:rgb(0, 0, 0);">文本</font> | <font style="color:rgb(0, 0, 0);">学生姓名</font> |
| <font style="color:rgb(0, 0, 0);">班级</font> | <font style="color:rgb(0, 0, 0);">文本</font> | <font style="color:rgb(0, 0, 0);">学生班级</font> |
| <font style="color:rgb(0, 0, 0);">学号</font> | <font style="color:rgb(0, 0, 0);">文本</font> | <font style="color:rgb(0, 0, 0);">学生学号</font> |
| <font style="color:rgb(0, 0, 0);">联系方式</font> | <font style="color:rgb(0, 0, 0);">文本</font> | <font style="color:rgb(0, 0, 0);">学生手机号</font> |
| <font style="color:rgb(0, 0, 0);">借出时间</font> | <font style="color:rgb(0, 0, 0);">日期时间</font> | <font style="color:rgb(0, 0, 0);">设备借出时间</font> |
| <font style="color:rgb(0, 0, 0);">归还时间</font> | <font style="color:rgb(0, 0, 0);">日期时间</font> | <font style="color:rgb(0, 0, 0);">实际归还时间</font> |
| <font style="color:rgb(0, 0, 0);">借用天数</font> | <font style="color:rgb(0, 0, 0);">计算字段</font> | <font style="color:rgb(0, 0, 0);">归还时间-借出时间</font> |
| <font style="color:rgb(0, 0, 0);">操作</font> | <font style="color:rgb(0, 0, 0);">按钮</font> | <font style="color:rgb(0, 0, 0);">删除记录</font> |


**查询条件**： 与"借出设备记录"相同，复用查询接口，增加归还时间范围筛选

**默认排序**： 按归还时间降序（最近归还的排在前面）

**操作功能**：

1. **删除记录**
    1. 点击"删除记录"按钮
    2. 弹出"删除记录"二次确认对话框

#### 5.资产管理模块
##### 设备列表查询
**功能描述**： 管理所有设备信息，包括查询、编辑、删除

**列表字段**：

| **<font style="color:rgb(0, 0, 0);">字段</font>** | **<font style="color:rgb(0, 0, 0);">说明</font>** | **<font style="color:rgb(0, 0, 0);">数据来源</font>** |
| :---: | :---: | :---: |
| <font style="color:rgb(0, 0, 0);">设备编号</font> | <font style="color:rgb(0, 0, 0);">唯一标识</font> | <font style="color:rgb(0, 0, 0);">用户录入或导入</font> |
| <font style="color:rgb(0, 0, 0);">设备名称</font> | <font style="color:rgb(0, 0, 0);">设备类型</font> | <font style="color:rgb(0, 0, 0);">用户录入或导入</font> |
| <font style="color:rgb(0, 0, 0);">设备品牌</font> | <font style="color:rgb(0, 0, 0);">品牌/厂商</font> | <font style="color:rgb(0, 0, 0);">用户录入或导入</font> |
| <font style="color:rgb(0, 0, 0);">规格型号</font> | <font style="color:rgb(0, 0, 0);">详细规格</font> | <font style="color:rgb(0, 0, 0);">用户录入或导入</font> |
| <font style="color:rgb(0, 0, 0);">单价</font> | <font style="color:rgb(0, 0, 0);">设备价格</font> | <font style="color:rgb(0, 0, 0);">用户录入或导入</font> |
| <font style="color:rgb(0, 0, 0);">存放地点</font> | <font style="color:rgb(0, 0, 0);">存储位置</font> | <font style="color:rgb(0, 0, 0);">用户录入或导入</font> |
| <font style="color:rgb(0, 0, 0);">设备状态</font> | <font style="color:rgb(0, 0, 0);">可借/已借出</font> | <font style="color:rgb(0, 0, 0);">系统自动维护</font> |
| <font style="color:rgb(0, 0, 0);">操作</font> | <font style="color:rgb(0, 0, 0);">编辑/删除按钮</font> | <font style="color:rgb(0, 0, 0);">-</font> |


**查询条件**：

+ 设备编号（模糊搜索）
+ 设备名称（模糊搜索）
+ 设备品牌（下拉框）
+ 设备状态（下拉框：全部/可借/已借出）

**批量导入**：

+ 支持通过Excel导入设备信息
+ 模板参考"1040007-20251022-在账资产查询.xlsx"
+ 导入字段：编号、名称、品牌、规格、数量、价格、存放地

**操作功能**：

+ 新增设备（<u>新增设备弹窗</u>实现）
+ 编辑设备（详见下文）
+ 删除设备（详见下文）

##### 新增资产弹窗
**触发方式**： 点击"设备管理"页面的"新增设备"按钮

**弹窗标题**：新增设备

**第一步：选择新增类型**

```plain
请选择新增方式：

( ) 新增已有类型设备（增加数量）
( ) 新增新类型设备

【下一步】 【取消】
```

**第二步：填写设备信息**

**情况1：新增已有类型设备**

| **<font style="color:rgb(0, 0, 0);">字段</font>** | **<font style="color:rgb(0, 0, 0);">控件</font>** | **<font style="color:rgb(0, 0, 0);">必填</font>** | **<font style="color:rgb(0, 0, 0);">说明</font>** |
| --- | --- | --- | --- |
| <font style="color:rgb(0, 0, 0);">设备类型</font> | <font style="color:rgb(0, 0, 0);">下拉框</font> | <font style="color:rgb(0, 0, 0);">是</font> | <font style="color:rgb(0, 0, 0);">选择已有设备类型</font> |
| <font style="color:rgb(0, 0, 0);">设备编号</font> | <font style="color:rgb(0, 0, 0);">输入框</font> | <font style="color:rgb(0, 0, 0);">是</font> | <font style="color:rgb(0, 0, 0);">手动输入新设备编号</font> |
| <font style="color:rgb(0, 0, 0);">存放地点</font> | <font style="color:rgb(0, 0, 0);">输入框</font> | <font style="color:rgb(0, 0, 0);">否</font> | <font style="color:rgb(0, 0, 0);">可修改默认存放地</font> |


+ 选择设备类型后，自动带出该类型的品牌、规格、单价信息（可编辑）
+ 设备名称、品牌、规格、单价继承所选类型的属性

**情况2：新增新类型设备**

| **<font style="color:rgb(0, 0, 0);">字段</font>** | **<font style="color:rgb(0, 0, 0);">控件</font>** | **<font style="color:rgb(0, 0, 0);">必填</font>** | **<font style="color:rgb(0, 0, 0);">说明</font>** |
| --- | --- | --- | --- |
| <font style="color:rgb(0, 0, 0);">设备编号</font> | <font style="color:rgb(0, 0, 0);">输入框</font> | <font style="color:rgb(0, 0, 0);">是</font> | <font style="color:rgb(0, 0, 0);">唯一标识</font> |
| <font style="color:rgb(0, 0, 0);">设备名称</font> | <font style="color:rgb(0, 0, 0);">输入框</font> | <font style="color:rgb(0, 0, 0);">是</font> | <font style="color:rgb(0, 0, 0);">新类型名称</font> |
| <font style="color:rgb(0, 0, 0);">设备品牌</font> | <font style="color:rgb(0, 0, 0);">输入框</font> | <font style="color:rgb(0, 0, 0);">是</font> | <font style="color:rgb(0, 0, 0);">品牌/厂商</font> |
| <font style="color:rgb(0, 0, 0);">规格型号</font> | <font style="color:rgb(0, 0, 0);">输入框</font> | <font style="color:rgb(0, 0, 0);">否</font> | <font style="color:rgb(0, 0, 0);">详细规格</font> |
| <font style="color:rgb(0, 0, 0);">单价</font> | <font style="color:rgb(0, 0, 0);">数字输入框</font> | <font style="color:rgb(0, 0, 0);">否</font> | <font style="color:rgb(0, 0, 0);">单位：元</font> |
| <font style="color:rgb(0, 0, 0);">存放地点</font> | <font style="color:rgb(0, 0, 0);">输入框</font> | <font style="color:rgb(0, 0, 0);">否</font> | <font style="color:rgb(0, 0, 0);">存储位置</font> |


**提交操作**：

+ 验证设备编号唯一性
+ 创建设备记录，默认状态为"可借"
+ 如为新类型，同步更新设备类型下拉选项
+ 关闭弹窗，刷新列表

##### 编辑资产弹窗
**触发方式**： 点击设备列表中的"编辑"按钮

**弹窗标题**：编辑设备

**表单字段**： 与"新增新类型设备"相同，预填充当前设备信息

**限制**：

+ 设备编号不可修改（灰显）
+ 已借出的设备可编辑除设备编号外的其他信息

**提交操作**： 保存修改 → 关闭弹窗 → 刷新列表

---

##### 删除资产弹窗
页面复用“归还设备确认弹窗”，将确认修改为删除，并且要二次确认防止误触删除（讨论一下是做弹窗确认还是手写输入/划选复制 设备号）

**触发方式**： 点击设备列表中的"删除"按钮

**二次确认弹窗**：

```plain
确认删除设备？

设备编号：[设备编号]
设备名称：[设备名称]

删除后数据不可恢复！

【确认删除】 【取消】
```

**删除规则**：

+ 已借出的设备不可删除，提示"该设备当前已借出,无法删除"
+ 删除成功后刷新列表

---

#### 个人中心模块
##### 修改密码
**页面布局**：

| **<font style="color:rgb(0, 0, 0);">字段</font>** | **<font style="color:rgb(0, 0, 0);">控件</font>** | **<font style="color:rgb(0, 0, 0);">必填</font>** | **<font style="color:rgb(0, 0, 0);">验证规则</font>** |
| --- | --- | --- | --- |
| <font style="color:rgb(0, 0, 0);">原密码</font> | <font style="color:rgb(0, 0, 0);">密码输入框</font> | <font style="color:rgb(0, 0, 0);">是</font> | <font style="color:rgb(0, 0, 0);">-</font> |
| <font style="color:rgb(0, 0, 0);">新密码</font> | <font style="color:rgb(0, 0, 0);">密码输入框</font> | <font style="color:rgb(0, 0, 0);">是</font> | <font style="color:rgb(0, 0, 0);">6-20位，含字母和数字</font> |
| <font style="color:rgb(0, 0, 0);">确认新密码</font> | <font style="color:rgb(0, 0, 0);">密码输入框</font> | <font style="color:rgb(0, 0, 0);">是</font> | <font style="color:rgb(0, 0, 0);">必须与新密码一致</font> |


**交互流程**：

1. 用户输入原密码、新密码、确认新密码
2. 点击"确认修改"按钮
3. 系统验证原密码是否正确
4. 验证新密码和确认密码是否一致
5. 验证通过：更新密码和密码提示 → 提示"密码修改成功，请重新登录" → 跳转登录页
6. 验证失败：提示具体错误信息

**错误提示**：

+ 原密码错误 → "原密码输入错误"
+ 两次新密码不一致 → "两次输入的新密码不一致"
+ 新密码格式不符 → "密码必须包含字母和数字，长度6-20位"

### 素材
弹窗提示未还设备页面

进入主页面先弹窗提示目前有哪些未还设备，距离归还期还有几天，显示借出人联系方式，显示未通知/已通知button

显示近期（设备距离归还期限剩5天）要归还设备

看板页面

进行图文展示，告诉老师总共有哪些资产外借，我一共拥有哪些类型的资产，每种类型资产借出多少，外借资产倒计时要用合适的图表呈现，也要设计对应点击能跳转页面

借出设备记录

设备编号、设备类型、设备厂商、借出时间、借出人、班级、学号、联系方式、剩余归还时间、归还操作button（弹窗显示后再确认）

查询条件：设备编号、设备类型（下拉框）、设备厂商、归还时间（排序） 查询列表呈现：默认按照归还时间最近---最远

图中新建就是新增借出设备：选择设备类型=》设备编号：输入+下拉框（允许通过输入去筛选下拉框选择）

借出设备筛选条件**顺序待定**

![](https://cdn.nlark.com/yuque/0/2025/png/42479919/1762945352532-5eab664d-8614-4166-938e-3c111b221bf7.png)

已还设备记录

溯源，防止归还设备出现问题

查询和已借设备查询复用接口

设备管理

增删改查

新增设备按钮

新增设备有两种情况：1》 新增已有类型设备（只增加数量） 2》新增新类型设备

1》/2》进行选择

新增已有直接增加设备名字

新增新类型设备=》数据库新增一条记录，按照设备查询的一级一级关系手动添加，前端在查询下拉框自动生成

删和改都是基于查询逻辑去做，右侧给一个修改按钮，一个删除按钮

个人中心

修改密码，二次确认，密码提示

归还设备弹窗

只用确认

借出设备弹窗

各栏都下拉选择

![](https://cdn.nlark.com/yuque/0/2025/png/42479919/1762945352826-0a3dc4d3-29d7-4eed-8c62-6f8f78a4349e.png)

共性点：以怎样的顺序查询，我和宁硕讨论出顺序

### 交互原型
暂时无法在飞书文档外展示此内容

### 非功能性需求
#### 兼容性要求
| **<font style="color:rgb(0, 0, 0);">项目</font>** | **<font style="color:rgb(0, 0, 0);">要求</font>** |
| :---: | :---: |
| <font style="color:rgb(0, 0, 0);">操作系统</font> | <font style="color:rgb(0, 0, 0);">Windows 10及以上</font> |
| <font style="color:rgb(0, 0, 0);">浏览器</font> | <font style="color:rgb(0, 0, 0);">Chrome 90+、Edge 90+</font> |


