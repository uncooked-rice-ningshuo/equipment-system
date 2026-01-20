# 设备借还管理系统 - AI 功能增强方案

## 文档信息

- **版本**：v1.1.0
- **日期**：2026-01-10
- **作者**：AI 助手
- **状态**：待审阅

---

## 一、借用风险评估系统

### 1.1 功能概述

借用风险评估系统旨在通过分析借用人的历史借用行为，建立信用评分体系，为设备借出决策提供数据支持，降低设备损坏和逾期风险。

### 1.2 核心功能模块

#### 1.2.1 借用人信用档案管理

**功能描述**：为每个借用人建立完整的信用档案，记录其借用历史、信用评分、风险等级等信息。

**数据字段**：

```typescript
interface BorrowerProfile {
  id: number;
  student_id: string; // 学号（唯一标识）
  name: string; // 姓名
  class: string; // 班级
  phone: string; // 联系方式

  // 信用评分相关
  credit_score: number; // 信用评分（0-100）
  risk_level: 'low' | 'medium' | 'high'; // 风险等级
  credit_rating: 'A' | 'B' | 'C' | 'D'; // 信用等级

  // 借用统计
  total_borrows: number; // 总借用次数
  on_time_returns: number; // 按时归还次数
  overdue_returns: number; // 逾期归还次数
  damaged_returns: number; // 设备损坏次数

  // 时间相关
  first_borrow_date: string; // 首次借用时间
  last_borrow_date: string; // 最近借用时间

  // 计算字段
  on_time_rate: number; // 按时归还率
  avg_borrow_days: number; // 平均借用天数

  // 风险标记
  risk_tags: string[]; // 风险标签（如：频繁逾期、设备损坏等）
  is_blacklisted: boolean; // 是否黑名单
  blacklist_reason?: string; // 黑名单原因

  // 系统字段
  created_at: string;
  updated_at: string;
}
```

#### 1.2.2 信用评分算法

**评分维度**：

1. **按时归还率（40%）**

   - 按时归还次数 / 总归还次数 × 40
   - 基础分：60 分，按时归还率每提升 10%加 4 分

2. **借用频率（20%）**

   - 基于借用次数的稳定性评分
   - 过度频繁借用扣分（可能存在滥用风险）

3. **设备完好率（25%）**

   - 设备完好归还次数 / 总归还次数 × 25
   - 设备损坏记录严重扣分

4. **借用时长合理性（15%）**
   - 平均借用时长与标准时长的偏差
   - 过度延长借用时间扣分

**评分等级划分**：

- **A 级（90-100 分）**：优秀，可优先借出
- **B 级（75-89 分）**：良好，正常借出
- **C 级（60-74 分）**：一般，需要关注
- **D 级（0-59 分）**：较差，限制借出

**风险等级映射**：

- **低风险**：A 级、B 级
- **中风险**：C 级
- **高风险**：D 级

#### 1.2.3 风险预警机制

**预警触发条件**：

1. 逾期次数超过 3 次
2. 设备损坏次数超过 2 次
3. 信用评分低于 60 分
4. 连续 3 次借用时长超过标准时长 50%
5. 短时间内频繁借用同一类型设备

**预警级别**：

- **黄色预警**：中等风险，需要关注
- **橙色预警**：较高风险，需要谨慎
- **红色预警**：高风险，建议拒绝

**预警处理流程**：

1. 系统自动识别风险
2. 在借出页面显示风险提示
3. 管理员根据情况决定是否借出
4. 记录借出决策和原因

#### 1.2.4 借用风险评估界面

**新增借出设备时的风险评估展示**：

```
┌─────────────────────────────────────────────────────┐
│  借出设备                                           │
├─────────────────────────────────────────────────────┤
│  设备类型：[下拉选择]                                │
│  设备编号：[下拉选择]                                │
│  借用人：[输入]                                      │
│  班级：[输入]                                        │
│  学号：[输入]                                        │
│  联系方式：[输入]                                    │
├─────────────────────────────────────────────────────┤
│  📊 借用人信用评估                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │  信用评分：85分 (B级)                       │   │
│  │  风险等级：🟢 低风险                         │   │
│  │  按时归还率：92%                             │   │
│  │  历史借用：15次                              │   │
│  │  逾期记录：0次                               │   │
│  │  设备损坏：0次                               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  💡 建议：该借用人信用良好，可以正常借出             │
│                                                     │
│  [查看详细档案] [确认借出] [取消]                    │
└─────────────────────────────────────────────────────┘
```

**高风险借用人展示**：

```
┌─────────────────────────────────────────────────────┐
│  📊 借用人信用评估                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │  信用评分：45分 (D级) ⚠️                    │   │
│  │  风险等级：🔴 高风险                         │   │
│  │  按时归还率：60%                             │   │
│  │  历史借用：8次                               │   │
│  │  逾期记录：3次                               │   │
│  │  设备损坏：1次                               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ⚠️ 风险提示：                                      │
│  • 该借用人存在多次逾期记录                          │
│  • 曾有设备损坏记录                                 │
│  • 建议谨慎借出或要求担保                           │
│                                                     │
│  🏷️ 风险标签：频繁逾期、设备损坏                     │
│                                                     │
│  [查看详细档案] [强制借出] [取消]                    │
└─────────────────────────────────────────────────────┘
```

#### 1.2.5 信用档案管理页面

**页面功能**：

1. 查看所有借用人的信用档案
2. 按信用等级、风险等级筛选
3. 查看借用人的详细借用历史
4. 手动调整信用评分（管理员权限）
5. 添加/移除黑名单
6. 导出信用报告

**列表字段**： | 字段 | 说明 | |------|------| | 学号 | 唯一标识 | | 姓名 | 借用人姓名 | | 班级 | 所属班级 | | 信用评分 | 0-100 分 | | 信用等级 | A/B/C/D | | 风险等级 | 低/中/高 | | 按时归还率 | 百分比 | | 历史借用次数 | 总借用次数 | | 逾期次数 | 逾期归还次数 | | 设备损坏次数 | 设备损坏记录 | | 风险标签 | 风险标签列表 | | 状态 | 正常/黑名单 | | 操作 | 查看详情/编辑/黑名单 |

### 1.3 数据库设计

#### 1.3.1 借用人信用档案表

```sql
CREATE TABLE borrower_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  class TEXT,
  phone TEXT,

  credit_score INTEGER DEFAULT 60,
  risk_level TEXT DEFAULT 'low',
  credit_rating TEXT DEFAULT 'C',

  total_borrows INTEGER DEFAULT 0,
  on_time_returns INTEGER DEFAULT 0,
  overdue_returns INTEGER DEFAULT 0,
  damaged_returns INTEGER DEFAULT 0,

  first_borrow_date TEXT,
  last_borrow_date TEXT,

  on_time_rate REAL DEFAULT 0,
  avg_borrow_days REAL DEFAULT 0,

  risk_tags TEXT DEFAULT '[]',
  is_blacklisted INTEGER DEFAULT 0,
  blacklist_reason TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### 1.3.2 借用风险评估记录表

```sql
CREATE TABLE borrow_risk_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  borrow_record_id INTEGER NOT NULL,
  borrower_profile_id INTEGER NOT NULL,

  pre_borrow_score INTEGER,
  risk_level TEXT,
  risk_tags TEXT,
  warning_level TEXT,

  admin_decision TEXT,
  admin_reason TEXT,

  created_at TEXT DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (borrow_record_id) REFERENCES borrow_records(id),
  FOREIGN KEY (borrower_profile_id) REFERENCES borrower_profiles(id)
);
```

### 1.4 技术实现方案

#### 1.4.1 信用评分计算服务

```typescript
// services/creditScoreCalculator.ts

interface BorrowHistory {
  borrow_time: string;
  return_deadline: string;
  actual_return_time: string;
  device_status: string;
}

interface CreditScoreInput {
  borrowHistory: BorrowHistory[];
  totalBorrows: number;
}

class CreditScoreCalculator {
  calculate(input: CreditScoreInput): number {
    const { borrowHistory, totalBorrows } = input;

    if (totalBorrows === 0) {
      return 60; // 新用户基础分
    }

    let score = 60; // 基础分

    // 1. 按时归还率评分（40分）
    const onTimeReturns = borrowHistory.filter(
      (h) => new Date(h.actual_return_time) <= new Date(h.return_deadline),
    ).length;
    const onTimeRate = onTimeReturns / borrowHistory.length;
    score += onTimeRate * 40;

    // 2. 借用频率评分（20分）
    const frequencyScore = this.calculateFrequencyScore(borrowHistory);
    score += frequencyScore;

    // 3. 设备完好率评分（25分）
    const intactReturns = borrowHistory.filter(
      (h) => h.device_status === 'intact',
    ).length;
    const intactRate = intactReturns / borrowHistory.length;
    score += intactRate * 25;

    // 4. 借用时长合理性（15分）
    const durationScore = this.calculateDurationScore(borrowHistory);
    score += durationScore;

    return Math.min(100, Math.max(0, Math.round(score)));
  }

  private calculateFrequencyScore(history: BorrowHistory[]): number {
    // 实现借用频率评分逻辑
    return 15; // 示例值
  }

  private calculateDurationScore(history: BorrowHistory[]): number {
    // 实现借用时长评分逻辑
    return 12; // 示例值
  }

  getRiskLevel(score: number): 'low' | 'medium' | 'high' {
    if (score >= 75) return 'low';
    if (score >= 60) return 'medium';
    return 'high';
  }

  getCreditRating(score: number): 'A' | 'B' | 'C' | 'D' {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  }
}

export default CreditScoreCalculator;
```

#### 1.4.2 风险评估 API

```javascript
// electron/services/riskAssessment.js

const { getDatabase, queryAll, runStmt } = require('./database');
const CreditScoreCalculator = require('../services/creditScoreCalculator');

class RiskAssessmentService {
  async assessBorrower(studentId) {
    const db = getDatabase();

    // 获取借用人的借用历史
    const borrowHistory = queryAll(
      db,
      `SELECT br.*, d.status as device_status
       FROM borrow_records br
       JOIN devices d ON br.device_id = d.id
       WHERE br.borrower_student_id = ?`,
      [studentId],
    );

    // 计算信用评分
    const calculator = new CreditScoreCalculator();
    const score = calculator.calculate({
      borrowHistory,
      totalBorrows: borrowHistory.length,
    });

    // 获取或创建信用档案
    let profile = queryAll(
      db,
      'SELECT * FROM borrower_profiles WHERE student_id = ?',
      [studentId],
    )[0];

    if (!profile) {
      // 创建新档案
      runStmt(
        db,
        `INSERT INTO borrower_profiles
         (student_id, name, class, phone, credit_score, risk_level, credit_rating)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          studentId,
          '',
          '',
          '',
          score,
          calculator.getRiskLevel(score),
          calculator.getCreditRating(score),
        ],
      );
    } else {
      // 更新现有档案
      runStmt(
        db,
        `UPDATE borrower_profiles
         SET credit_score = ?, risk_level = ?, credit_rating = ?, updated_at = ?
         WHERE student_id = ?`,
        [
          score,
          calculator.getRiskLevel(score),
          calculator.getCreditRating(score),
          new Date().toISOString(),
          studentId,
        ],
      );
    }

    return {
      score,
      riskLevel: calculator.getRiskLevel(score),
      creditRating: calculator.getCreditRating(score),
      borrowHistory: borrowHistory.length,
    };
  }

  async getRiskWarning(score, borrowHistory) {
    const warnings = [];

    if (score < 60) {
      warnings.push({
        level: 'red',
        message: '该借用人信用评分较低，存在较高风险',
      });
    }

    const overdueCount = borrowHistory.filter(
      (h) => new Date(h.actual_return_time) > new Date(h.return_deadline),
    ).length;

    if (overdueCount >= 3) {
      warnings.push({
        level: 'orange',
        message: `该借用人有${overdueCount}次逾期记录`,
      });
    }

    const damagedCount = borrowHistory.filter(
      (h) => h.device_status === 'damaged',
    ).length;

    if (damagedCount > 0) {
      warnings.push({
        level: 'orange',
        message: `该借用人曾有${damagedCount}次设备损坏记录`,
      });
    }

    return warnings;
  }
}

module.exports = RiskAssessmentService;
```

---

## 二、智能报表生成系统

### 2.1 功能概述

智能报表生成系统利用 AI 技术，自动分析设备借还数据，生成工作报表和阶段性工作总结报告，帮助管理员快速了解设备使用情况、发现潜在问题，提高管理效率。

### 2.2 核心功能模块

#### 2.2.1 工作报表生成

**报表类型**：

1. **日报表**

   - 当日借出设备统计
   - 当日归还设备统计
   - 逾期设备提醒
   - 设备状态概览

2. **周报表**

   - 本周借出趋势
   - 本周归还趋势
   - 设备使用率分析
   - 借用人活跃度排行

3. **月报表**

   - 月度设备使用统计
   - 设备类型分布
   - 借用人信用分析
   - 设备损坏统计
   - 工作量统计

4. **学期报表**
   - 学期设备使用总览
   - 设备利用率分析
   - 借用人行为分析
   - 设备维护建议

**报表内容结构**：

```typescript
interface WorkReport {
  reportId: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'semester';
  period: {
    start: string;
    end: string;
  };

  // 统计数据
  statistics: {
    totalBorrows: number; // 总借出次数
    totalReturns: number; // 总归还次数
    totalOverdue: number; // 总逾期次数
    totalDamaged: number; // 总损坏次数
    avgBorrowDays: number; // 平均借用天数
    deviceUtilization: number; // 设备利用率
  };

  // 设备统计
  deviceStats: {
    byType: DeviceTypeStat[]; // 按类型统计
    byStatus: DeviceStatusStat[]; // 按状态统计
    topBorrowed: TopDevice[]; // 热门设备排行
  };

  // 借用人统计
  borrowerStats: {
    activeBorrowers: number; // 活跃借用人数量
    topBorrowers: TopBorrower[]; // 活跃借用人排行
    creditDistribution: CreditDist[]; // 信用分布
    riskBorrowers: RiskBorrower[]; // 高风险借用人
  };

  // 趋势分析
  trends: {
    borrowTrend: TrendData[]; // 借出趋势
    returnTrend: TrendData[]; // 归还趋势
    overdueTrend: TrendData[]; // 逾期趋势
  };

  // 问题识别
  issues: {
    overdueDevices: OverdueDevice[]; // 逾期设备列表
    damagedDevices: DamagedDevice[]; // 损坏设备列表
    riskWarnings: RiskWarning[]; // 风险预警
  };

  // AI分析
  aiAnalysis: {
    summary: string; // AI生成的总结
    insights: string[]; // 洞察发现
    recommendations: string[]; // 改进建议
    predictions: string[]; // 预测分析
  };

  // 元数据
  metadata: {
    generatedAt: string;
    generatedBy: string;
    dataRange: string;
  };
}
```

#### 2.2.2 阶段性工作总结报告生成

**报告类型**：

1. **周阶段性报告**

   - 本周工作回顾
   - 关键指标分析
   - 问题与挑战
   - 下周工作计划

2. **月阶段性报告**

   - 月度工作总结
   - 重点工作成果
   - 数据分析报告
   - 改进措施建议

3. **学期阶段性报告**
   - 学期工作总览
   - 设备管理成效
   - 借用管理分析
   - 未来工作规划

**阶段性工作总结报告结构**：

```typescript
interface PhaseWorkSummary {
  summaryId: string;
  summaryType: 'weekly' | 'monthly' | 'semester';
  period: {
    start: string;
    end: string;
  };

  // 报告标题
  reportTitle: string;

  // 基本信息
  basicInfo: {
    workDays: number; // 工作天数
    totalBorrows: number; // 总借出次数
    totalReturns: number; // 总归还次数
    totalOverdue: number; // 总逾期次数
    totalDamaged: number; // 总损坏次数
    deviceUtilization: number; // 设备利用率
  };

  // 一、工作概述（AI生成）
  workOverview: {
    title: string;
    content: string; // 工作概述正文
    keyPoints: string[]; // 关键点列表
  };

  // 二、工作成果（AI生成）
  achievements: {
    title: string;
    items: AchievementItem[]; // 成果项目列表
    summary: string; // 成果总结
  };

  // 三、数据分析（AI生成）
  dataAnalysis: {
    title: string;
    sections: AnalysisSection[]; // 分析章节
    charts: ChartData[]; // 图表数据
    summary: string; // 分析总结
  };

  // 四、问题与挑战（AI生成）
  challenges: {
    title: string;
    issues: ChallengeItem[]; // 问题列表
    impactAnalysis: string; // 影响分析
  };

  // 五、改进措施（AI生成）
  improvements: {
    title: string;
    measures: ImprovementMeasure[]; // 改进措施列表
    priority: string[]; // 优先级排序
  };

  // 六、工作计划（AI生成）
  workPlan: {
    title: string;
    shortTermPlan: string; // 短期计划
    longTermPlan: string; // 长期计划
    milestones: Milestone[]; // 里程碑
  };

  // 七、总结与展望（AI生成）
  conclusion: {
    title: string;
    summary: string; // 总结
    outlook: string; // 展望
  };

  // AI生成的完整报告文本
  aiGeneratedText: {
    executiveSummary: string; // 执行摘要
    detailedReport: string; // 详细报告
    appendices: string[]; // 附录
  };

  // 元数据
  metadata: {
    generatedAt: string;
    generatedBy: string;
    version: string;
  };
}
```

**阶段性工作总结报告内容示例**：

```
设备借还管理阶段性工作总结报告

报告类型：月阶段性报告
报告周期：2026年1月
报告时间：2026年1月31日
报告人：设备管理员

一、工作概述

本月设备借还管理工作整体运行平稳有序，共完成设备借出操作458次，设备归还操作432次，设备利用率保持在82.3%的较高水平。主要服务对象为计算机学院、电子工程学院和物理学院的学生，其中计算机学院学生占比达到52%，是主要服务群体。

本月重点工作包括：建立借用人信用档案体系、优化设备借用流程、加强逾期设备提醒、完善设备维护记录等。通过一系列改进措施，设备逾期率较上月下降15%，设备完好率提升至98.5%，管理效率显著提高。

二、工作成果

1. 设备管理成效显著
   - 完成设备借还管理890次，无重大失误
   - 设备利用率提升至82.3%，较上月增长5.2%
   - 设备完好率达到98.5%，较上月提升2.3%
   - 逾期设备数量控制在12台，较上月减少5台

2. 信用体系建设完成
   - 建立了156名借用人的信用档案
   - 实现了信用评分自动化计算
   - 建立了风险预警机制
   - 识别并标记了8名高风险借用人

3. 管理流程优化
   - 优化了设备借出流程，平均处理时间缩短30%
   - 建立了设备预约制度，提高了管理效率
   - 完善了逾期提醒机制，提醒及时率达到95%
   - 建立了设备定期检查制度

三、数据分析

1. 设备使用分析
   - 数字示波器使用率最高，本月借出156次，占比34.1%
   - 笔记本电脑次之，借出128次，占比27.9%
   - 服务器借出98次，占比21.4%
   - 打印机借出52次，占比11.4%
   - 柜式空调借出24次，占比5.2%

2. 借用人分析
   - 计算机学院学生占比52%，借出238次
   - 电子工程学院占比28%，借出128次
   - 物理学院占比20%，借出92次
   - 活跃借用人（借用次数≥5次）45人
   - 新增借用人23人

3. 信用分析
   - A级信用借用人42人，占比26.9%
   - B级信用借用人68人，占比43.6%
   - C级信用借用人38人，占比24.4%
   - D级信用借用人8人，占比5.1%
   - 按时归还率达到91.2%

4. 逾期分析
   - 本月逾期设备12台，逾期率2.6%
   - 逾期时长：1-3天6台，4-7天4台，8天以上2台
   - 逾期主要分布在计算机学院（7台）
   - 逾期原因：实验延期（5台）、忘记归还（4台）、其他（3台）

四、问题与挑战

1. 逾期问题仍需关注
   - 虽然逾期率有所下降，但仍有12台设备逾期
   - 计算机学院逾期问题较为突出，占比58.3%
   - 部分学生存在多次逾期记录，信用意识有待加强

2. 设备维护压力增大
   - 部分设备使用频率高，老化现象明显
   - 本月发现设备故障8次，需要加强维护
   - 维护人员配备不足，影响维护效率

3. 管理效率有待提升
   - 周三、周四借出高峰期，排队现象明显
   - 设备预约制度需要进一步完善
   - 人工记录和统计工作量大，自动化程度不够

五、改进措施

1. 加强逾期管理
   - 建立逾期分级预警机制，提前3天、1天、当天提醒
   - 对多次逾期学生进行约谈，加强信用教育
   - 建立逾期黑名单制度，对严重逾期学生限制借用

2. 优化设备维护
   - 建立设备定期检查制度，每月全面检查一次
   - 对高频使用设备增加维护频次
   - 建立设备维护档案，记录维护历史
   - 申请增加维护人员配备

3. 提升管理效率
   - 完善设备预约系统，实现线上预约
   - 优化高峰期人员安排，增加临时工作人员
   - 推进管理信息化建设，减少人工操作
   - 建立数据自动统计和分析系统

六、工作计划

短期计划（下月）：
1. 完善设备预约系统，实现线上预约功能
2. 建立设备定期检查制度，完成本月设备检查
3. 加强逾期管理，将逾期率控制在2%以下
4. 优化借出流程，进一步缩短处理时间
5. 开展借用人信用教育活动，提高信用意识

长期计划（本学期）：
1. 建立完善的设备管理体系，实现全流程信息化
2. 完善信用评分体系，实现智能化风险管理
3. 建立设备维护计划，实现预防性维护
4. 开展管理培训，提高管理水平
5. 建立绩效考核体系，激励工作积极性

七、总结与展望

本月设备借还管理工作取得了显著成效，设备利用率和管理效率均有所提升，逾期率得到有效控制。通过建立信用体系和优化管理流程，管理水平明显提高。

展望下月，我们将继续完善管理体系，推进信息化建设，提高管理效率和服务质量。重点做好设备预约系统建设、逾期管理优化、设备维护保障等工作，为师生提供更加优质的服务。

我们相信，在全体管理人员的共同努力下，设备借还管理工作将不断取得新的成绩，为教学科研提供更好的保障。

报告人：设备管理员
报告日期：2026年1月31日
```

#### 2.2.3 AI 分析引擎

**AI 分析功能**：

1. **数据洞察**

   - 识别设备使用模式
   - 发现异常借用行为
   - 分析借用人偏好
   - 预测设备需求

2. **智能总结**

   - 自动生成工作总结
   - 提取关键信息
   - 生成阶段性报告
   - 提供决策建议

3. **趋势预测**

   - 预测设备使用趋势
   - 预测逾期风险
   - 预测设备维护需求
   - 预测资源需求

4. **问题识别**
   - 自动识别异常情况
   - 风险预警
   - 设备异常提醒
   - 流程优化建议

**AI 分析模板**：

```typescript
interface AIAnalysisTemplate {
  templateId: string;
  templateName: string;
  templateType: 'report' | 'summary';

  // 数据输入
  inputData: {
    borrowRecords: any[];
    deviceStats: any;
    borrowerStats: any;
    timeRange: string;
  };

  // 分析配置
  analysisConfig: {
    includeTrends: boolean;
    includePredictions: boolean;
    includeRecommendations: boolean;
    detailLevel: 'brief' | 'standard' | 'detailed';
  };

  // 输出格式
  outputFormat: {
    includeCharts: boolean;
    includeTables: boolean;
    includeText: boolean;
    language: 'zh-CN';
  };

  // AI提示词模板
  promptTemplate: string;
}
```

#### 2.2.4 报表生成界面

**报表生成页面**：

```
┌─────────────────────────────────────────────────────┐
│  📊 智能报表生成                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  报表类型：                                         │
│  ○ 日报表  ○ 周报表  ○ 月报表  ○ 学期报表         │
│                                                     │
│  时间范围：                                         │
│  [2026-01-01] 至 [2026-01-10]                     │
│                                                     │
│  报表内容：                                         │
│  ☑️ 统计数据  ☑️ 设备统计  ☑️ 借用人统计           │
│  ☑️ 趋势分析  ☑️ 问题识别  ☑️ AI分析               │
│                                                     │
│  AI分析选项：                                       │
│  ☑️ 生成智能总结  ☑️ 提供洞察发现  ☑️ 给出改进建议   │
│                                                     │
│  输出格式：                                         │
│  ○ PDF  ○ Word                                    │
│                                                     │
│  [生成报表] [保存模板] [查看历史]                    │
└─────────────────────────────────────────────────────┘
```

**阶段性工作总结报告生成页面**：

```
┌─────────────────────────────────────────────────────┐
│  📝 阶段性工作总结报告生成                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  报告类型：                                         │
│  ○ 周阶段性报告  ○ 月阶段性报告  ○ 学期阶段性报告   │
│                                                     │
│  报告周期：                                         │
│  [2026年1月]                                       │
│                                                     │
│  报告内容：                                         │
│  ☑️ 工作概述  ☑️ 工作成果  ☑️ 数据分析             │
│  ☑️ 问题与挑战  ☑️ 改进措施  ☑️ 工作计划           │
│  ☑️ 总结与展望                                      │
│                                                     │
│  AI分析选项：                                       │
│  ☑️ 自动生成报告内容  ☑️ 提供数据洞察  ☑️ 给出建议  │
│                                                     │
│  输出格式：                                         │
│  ○ PDF  ○ Word                                    │
│                                                     │
│  [生成报告] [保存模板] [查看历史]                    │
└─────────────────────────────────────────────────────┘
```

**报表预览页面**：

```
┌─────────────────────────────────────────────────────┐
│  📄 工作报表预览                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  设备借还管理工作报表                                │
│  报表类型：周报表                                    │
│  时间范围：2026-01-04 至 2026-01-10                 │
│  生成时间：2026-01-10 14:30:00                      │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  📊 统计概览                                 │   │
│  │  • 总借出次数：156次                         │   │
│  │  • 总归还次数：142次                         │   │
│  │  • 逾期设备：8台                            │   │
│  │  • 设备利用率：78.5%                         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  🤖 AI智能分析                              │   │
│  │                                             │   │
│  │  📌 工作总结：                               │   │
│  │  本周设备借还管理工作整体运行平稳，共处理156  │   │
│  │  次借出请求，设备利用率保持在78.5%的较高水   │   │
│  │  平。示波器和笔记本电脑是最受欢迎的设备类型。   │   │
│  │                                             │   │
│  │  💡 洞察发现：                               │   │
│  │  • 周三和周四是借出高峰期，建议增加人手       │   │
│  │  • 数字示波器使用率最高，可考虑增加库存       │   │
│  │  • 8台设备逾期，主要集中在计算机学院           │   │
│  │                                             │   │
│  │  🎯 改进建议：                               │   │
│  │  • 加强对计算机学院学生的归还提醒             │   │
│  │  • 建立设备预约制度，提高管理效率             │   │
│  │  • 定期检查设备状态，预防损坏                 │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [下载PDF] [下载Word] [返回]                        │
└─────────────────────────────────────────────────────┘
```

**阶段性工作总结报告预览页面**：

```
┌─────────────────────────────────────────────────────┐
│  📄 阶段性工作总结报告预览                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  设备借还管理阶段性工作总结报告                        │
│  报告类型：月阶段性报告                              │
│  报告周期：2026年1月                                │
│  生成时间：2026-01-31 16:00:00                      │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  一、工作概述                                 │   │
│  │                                             │   │
│  │  本月设备借还管理工作整体运行平稳有序，共完   │   │
│  │  成设备借出操作458次，设备归还操作432次，设   │   │
│  │  备利用率保持在82.3%的较高水平。本月重点工   │   │
│  │  作包括：建立借用人信用档案体系、优化设备借   │   │
│  │  用流程、加强逾期设备提醒、完善设备维护记录   │   │
│  │  等。                                         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  二、工作成果                                 │   │
│  │                                             │   │
│  │  1. 设备管理成效显著                         │   │
│  │     • 完成设备借还管理890次，无重大失误     │   │
│  │     • 设备利用率提升至82.3%，较上月增长5.2%  │   │
│  │     • 设备完好率达到98.5%，较上月提升2.3%   │   │
│  │                                             │   │
│  │  2. 信用体系建设完成                         │   │
│  │     • 建立了156名借用人的信用档案           │   │
│  │     • 实现了信用评分自动化计算               │   │
│  │     • 建立了风险预警机制                   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  三、数据分析                                 │   │
│  │                                             │   │
│  │  1. 设备使用分析：                           │   │
│  │     • 数字示波器使用率最高（156次，34.1%）    │   │
│  │     • 笔记本电脑次之（128次，27.9%）        │   │
│  │     • 服务器（98次，21.4%）                 │   │
│  │                                             │   │
│  │  2. 借用人分析：                             │   │
│  │     • 计算机学院学生占比52%                  │   │
│  │     • 电子工程学院占比28%                     │   │
│  │     • 物理学院占比20%                        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [下载PDF] [下载Word] [编辑] [返回]                  │
└─────────────────────────────────────────────────────┘
```

#### 2.2.5 报表历史管理

**功能**：

1. 查看历史报表列表
2. 按时间、类型筛选
3. 重新生成历史报表
4. 删除报表
5. 导出报表

**列表字段**： | 字段 | 说明 | |------|------| | 报表 ID | 唯一标识 | | 报表类型 | 日报/周报/月报/学期报/阶段性报告 | | 时间范围 | 报表覆盖的时间段 | | 生成时间 | 报表生成时间 | | 生成人 | 管理员姓名 | | 报表状态 | 已生成/生成中/失败 | | 操作 | 查看/下载/删除 |

### 2.3 数据库设计

#### 2.3.1 工作报表表

```sql
CREATE TABLE work_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id TEXT NOT NULL UNIQUE,
  report_type TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,

  statistics_json TEXT NOT NULL,
  device_stats_json TEXT NOT NULL,
  borrower_stats_json TEXT NOT NULL,
  trends_json TEXT NOT NULL,
  issues_json TEXT NOT NULL,
  ai_analysis_json TEXT NOT NULL,

  generated_at TEXT NOT NULL,
  generated_by TEXT NOT NULL,

  FOREIGN KEY (generated_by) REFERENCES user(id)
);
```

#### 2.3.2 阶段性工作总结报告表

```sql
CREATE TABLE phase_work_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  summary_id TEXT NOT NULL UNIQUE,
  summary_type TEXT NOT NULL,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,

  report_title TEXT NOT NULL,
  basic_info_json TEXT NOT NULL,
  work_overview_json TEXT NOT NULL,
  achievements_json TEXT NOT NULL,
  data_analysis_json TEXT NOT NULL,
  challenges_json TEXT NOT NULL,
  improvements_json TEXT NOT NULL,
  work_plan_json TEXT NOT NULL,
  conclusion_json TEXT NOT NULL,
  ai_generated_text_json TEXT NOT NULL,

  generated_at TEXT NOT NULL,
  generated_by TEXT NOT NULL,

  FOREIGN KEY (generated_by) REFERENCES user(id)
);
```

#### 2.3.3 报表模板表

```sql
CREATE TABLE report_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id TEXT NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL,
  template_config_json TEXT NOT NULL,
  prompt_template TEXT NOT NULL,

  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  FOREIGN KEY (created_by) REFERENCES user(id)
);
```

### 2.4 技术实现方案

#### 2.4.1 AI 分析服务

```typescript
// services/aiAnalysisService.ts

interface AnalysisInput {
  borrowRecords: any[];
  deviceStats: any;
  borrowerStats: any;
  timeRange: { start: string; end: string };
}

interface AnalysisOutput {
  summary: string;
  insights: string[];
  recommendations: string[];
  predictions: string[];
}

class AIAnalysisService {
  async generateWorkReport(input: AnalysisInput): Promise<AnalysisOutput> {
    const prompt = this.buildReportPrompt(input);

    // 调用AI API生成分析
    const aiResponse = await this.callAIAPI(prompt);

    return this.parseAIResponse(aiResponse);
  }

  async generatePhaseSummary(
    input: AnalysisInput,
    summaryType: string,
  ): Promise<string> {
    const prompt = this.buildPhaseSummaryPrompt(input, summaryType);

    const aiResponse = await this.callAIAPI(prompt);

    return aiResponse;
  }

  private buildReportPrompt(input: AnalysisInput): string {
    const { borrowRecords, deviceStats, borrowerStats, timeRange } = input;

    return `
请基于以下设备借还管理数据，生成一份工作报表分析：

时间范围：${timeRange.start} 至 ${timeRange.end}

统计数据：
- 总借出次数：${borrowRecords.length}
- 总归还次数：${borrowRecords.filter((r) => r.actual_return_time).length}
- 逾期设备：${borrowRecords.filter((r) => this.isOverdue(r)).length}

设备统计：
${JSON.stringify(deviceStats, null, 2)}

借用人统计：
${JSON.stringify(borrowerStats, null, 2)}

请提供：
1. 工作总结（200-300字）
2. 洞察发现（3-5条）
3. 改进建议（3-5条）
4. 趋势预测（2-3条）

请以JSON格式返回：
{
  "summary": "...",
  "insights": ["...", "..."],
  "recommendations": ["...", "..."],
  "predictions": ["...", "..."]
}
`;
  }

  private buildPhaseSummaryPrompt(
    input: AnalysisInput,
    summaryType: string,
  ): string {
    const { borrowRecords, deviceStats, borrowerStats, timeRange } = input;
    const periodText =
      summaryType === 'weekly'
        ? '本周'
        : summaryType === 'monthly'
        ? '本月'
        : '本学期';

    return `
请基于以下设备借还管理数据，生成一份${periodText}阶段性工作总结报告：

时间范围：${timeRange.start} 至 ${timeRange.end}

统计数据：
- 总借出次数：${borrowRecords.length}
- 总归还次数：${borrowRecords.filter((r) => r.actual_return_time).length}
- 逾期设备：${borrowRecords.filter((r) => this.isOverdue(r)).length}

设备统计：
${JSON.stringify(deviceStats, null, 2)}

借用人统计：
${JSON.stringify(borrowerStats, null, 2)}

请生成一份完整的阶段性工作总结报告，包括：
一、工作概述
二、工作成果
三、数据分析
四、问题与挑战
五、改进措施
六、工作计划
七、总结与展望

要求：
1. 使用正式、专业的文书汇报语言
2. 内容详实，数据准确
3. 分析深入，建议可行
4. 字数控制在1500-2500字
5. 体现阶段性特点和工作成效
`;
  }

  private async callAIAPI(prompt: string): Promise<any> {
    // 这里可以接入各种AI服务
    // 例如：OpenAI GPT、百度文心一言、阿里通义千问等

    // 示例：调用OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的设备借还管理系统分析师，擅长数据分析和文书报告撰写。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private parseAIResponse(response: string): AnalysisOutput {
    try {
      return JSON.parse(response);
    } catch (error) {
      // 如果解析失败，返回默认值
      return {
        summary: response,
        insights: [],
        recommendations: [],
        predictions: [],
      };
    }
  }

  private isOverdue(record: any): boolean {
    if (!record.actual_return_time) {
      return new Date() > new Date(record.return_deadline);
    }
    return (
      new Date(record.actual_return_time) > new Date(record.return_deadline)
    );
  }
}

export default AIAnalysisService;
```

#### 2.4.2 报表生成 API

```javascript
// electron/services/reportGenerator.js

const { getDatabase, queryAll } = require('./database');
const AIAnalysisService = require('../services/aiAnalysisService');

class ReportGeneratorService {
  async generateReport(reportType, startDate, endDate, options = {}) {
    const db = getDatabase();

    // 获取借还记录
    const borrowRecords = queryAll(
      db,
      `SELECT br.*, d.code as device_code, d.name as device_name, d.type as device_type
       FROM borrow_records br
       JOIN devices d ON br.device_id = d.id
       WHERE br.borrow_time >= ? AND br.borrow_time <= ?`,
      [startDate, endDate],
    );

    // 获取设备统计
    const deviceStats = await this.getDeviceStats(db, startDate, endDate);

    // 获取借用人统计
    const borrowerStats = await this.getBorrowerStats(db, startDate, endDate);

    // AI分析
    const aiAnalysis = new AIAnalysisService();
    const analysis = await aiAnalysis.generateWorkReport({
      borrowRecords,
      deviceStats,
      borrowerStats,
      timeRange: { start: startDate, end: endDate },
    });

    // 生成报表
    const report = {
      reportId: this.generateReportId(),
      reportType,
      period: { start: startDate, end: endDate },
      statistics: this.calculateStatistics(borrowRecords),
      deviceStats,
      borrowerStats,
      trends: this.calculateTrends(borrowRecords),
      issues: this.identifyIssues(borrowRecords),
      aiAnalysis: analysis,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'system',
        dataRange: `${startDate} 至 ${endDate}`,
      },
    };

    // 保存报表
    await this.saveReport(report);

    return report;
  }

  async generatePhaseSummary(summaryType, startDate, endDate) {
    const db = getDatabase();

    const borrowRecords = queryAll(
      db,
      `SELECT br.*, d.code as device_code, d.name as device_name
       FROM borrow_records br
       JOIN devices d ON br.device_id = d.id
       WHERE br.borrow_time >= ? AND br.borrow_time <= ?`,
      [startDate, endDate],
    );

    const deviceStats = await this.getDeviceStats(db, startDate, endDate);
    const borrowerStats = await this.getBorrowerStats(db, startDate, endDate);

    const aiAnalysis = new AIAnalysisService();
    const summaryText = await aiAnalysis.generatePhaseSummary(
      {
        borrowRecords,
        deviceStats,
        borrowerStats,
        timeRange: { start: startDate, end: endDate },
      },
      summaryType,
    );

    const summary = {
      summaryId: this.generateSummaryId(),
      summaryType,
      period: { start: startDate, end: endDate },
      reportTitle: this.generateReportTitle(summaryType, startDate, endDate),
      basicInfo: this.calculateBasicInfo(borrowRecords),
      workOverview: this.generateWorkOverview(borrowRecords),
      achievements: this.generateAchievements(borrowRecords),
      dataAnalysis: this.generateDataAnalysis(deviceStats, borrowerStats),
      challenges: this.generateChallenges(borrowRecords),
      improvements: this.generateImprovements(borrowRecords),
      workPlan: this.generateWorkPlan(),
      conclusion: this.generateConclusion(),
      aiGeneratedText: {
        executiveSummary: summaryText.substring(0, 300),
        detailedReport: summaryText,
        appendices: [],
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: 'system',
        version: '1.0.0',
      },
    };

    await this.savePhaseSummary(summary);

    return summary;
  }

  async getDeviceStats(db, startDate, endDate) {
    const byType = queryAll(
      db,
      `SELECT d.type, COUNT(*) as count
       FROM borrow_records br
       JOIN devices d ON br.device_id = d.id
       WHERE br.borrow_time >= ? AND br.borrow_time <= ?
       GROUP BY d.type`,
      [startDate, endDate],
    );

    const topBorrowed = queryAll(
      db,
      `SELECT d.code, d.name, d.type, COUNT(*) as borrow_count
       FROM borrow_records br
       JOIN devices d ON br.device_id = d.id
       WHERE br.borrow_time >= ? AND br.borrow_time <= ?
       GROUP BY d.id
       ORDER BY borrow_count DESC
       LIMIT 10`,
      [startDate, endDate],
    );

    return {
      byType,
      topBorrowed,
    };
  }

  async getBorrowerStats(db, startDate, endDate) {
    const activeBorrowers = queryAll(
      db,
      `SELECT borrower_name, borrower_class, COUNT(*) as borrow_count
       FROM borrow_records
       WHERE borrow_time >= ? AND borrow_time <= ?
       GROUP BY borrower_student_id
       ORDER BY borrow_count DESC`,
      [startDate, endDate],
    );

    return {
      activeBorrowers: activeBorrowers.length,
      topBorrowers: activeBorrowers.slice(0, 10),
    };
  }

  calculateStatistics(borrowRecords) {
    const totalBorrows = borrowRecords.length;
    const totalReturns = borrowRecords.filter(
      (r) => r.actual_return_time,
    ).length;
    const overdueCount = borrowRecords.filter(
      (r) =>
        r.actual_return_time &&
        new Date(r.actual_return_time) > new Date(r.return_deadline),
    ).length;

    return {
      totalBorrows,
      totalReturns,
      totalOverdue: overdueCount,
      totalDamaged: 0,
      avgBorrowDays: 0,
      deviceUtilization: 0,
    };
  }

  calculateTrends(borrowRecords) {
    // 按天统计借出趋势
    const dailyBorrows = {};
    borrowRecords.forEach((record) => {
      const date = record.borrow_time.split('T')[0];
      dailyBorrows[date] = (dailyBorrows[date] || 0) + 1;
    });

    return {
      borrowTrend: Object.entries(dailyBorrows).map(([date, count]) => ({
        date,
        count,
      })),
    };
  }

  identifyIssues(borrowRecords) {
    const overdueDevices = borrowRecords.filter(
      (r) => !r.actual_return_time && new Date() > new Date(r.return_deadline),
    );

    return {
      overdueDevices,
      damagedDevices: [],
      riskWarnings: [],
    };
  }

  generateReportId() {
    return `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSummaryId() {
    return `SUM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateReportTitle(summaryType, startDate, endDate) {
    const typeMap = {
      weekly: '周阶段性工作总结报告',
      monthly: '月阶段性工作总结报告',
      semester: '学期阶段性工作总结报告',
    };
    return typeMap[summaryType] || '阶段性工作总结报告';
  }

  async saveReport(report) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO work_reports
      (report_id, report_type, period_start, period_end,
       statistics_json, device_stats_json, borrower_stats_json,
       trends_json, issues_json, ai_analysis_json,
       generated_at, generated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      report.reportId,
      report.reportType,
      report.period.start,
      report.period.end,
      JSON.stringify(report.statistics),
      JSON.stringify(report.deviceStats),
      JSON.stringify(report.borrowerStats),
      JSON.stringify(report.trends),
      JSON.stringify(report.issues),
      JSON.stringify(report.aiAnalysis),
      report.metadata.generatedAt,
      report.metadata.generatedBy,
    );
  }

  async savePhaseSummary(summary) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO phase_work_summaries
      (summary_id, summary_type, period_start, period_end,
       report_title, basic_info_json, work_overview_json, achievements_json,
       data_analysis_json, challenges_json, improvements_json,
       work_plan_json, conclusion_json, ai_generated_text_json,
       generated_at, generated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      summary.summaryId,
      summary.summaryType,
      summary.period.start,
      summary.period.end,
      summary.reportTitle,
      JSON.stringify(summary.basicInfo),
      JSON.stringify(summary.workOverview),
      JSON.stringify(summary.achievements),
      JSON.stringify(summary.dataAnalysis),
      JSON.stringify(summary.challenges),
      JSON.stringify(summary.improvements),
      JSON.stringify(summary.workPlan),
      JSON.stringify(summary.conclusion),
      JSON.stringify(summary.aiGeneratedText),
      summary.metadata.generatedAt,
      summary.metadata.generatedBy,
    );
  }
}

module.exports = ReportGeneratorService;
```

#### 2.4.3 PDF 和 Word 导出服务

```typescript
// services/exportService.ts

import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

class ExportService {
  async exportToPDF(reportData: any, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // 添加标题
      doc.fontSize(20).text(reportData.title, { align: 'center' });
      doc.moveDown();

      // 添加内容
      doc.fontSize(12).text(reportData.content);

      doc.end();

      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }

  async exportToWord(reportData: any, outputPath: string): Promise<void> {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: reportData.title,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 },
            }),
            ...reportData.content.map(
              (paragraph: string) =>
                new Paragraph({
                  children: [new TextRun(paragraph)],
                  spacing: { after: 200 },
                }),
            ),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
  }

  async exportReportToPDF(report: WorkReport): Promise<string> {
    const outputPath = path.join(tempDir, `report_${report.reportId}.pdf`);
    const content = this.formatReportContent(report);

    await this.exportToPDF(
      {
        title: '设备借还管理工作报表',
        content,
      },
      outputPath,
    );

    return outputPath;
  }

  async exportReportToWord(report: WorkReport): Promise<string> {
    const outputPath = path.join(tempDir, `report_${report.reportId}.docx`);
    const content = this.formatReportContent(report);

    await this.exportToWord(
      {
        title: '设备借还管理工作报表',
        content,
      },
      outputPath,
    );

    return outputPath;
  }

  async exportPhaseSummaryToPDF(summary: PhaseWorkSummary): Promise<string> {
    const outputPath = path.join(tempDir, `summary_${summary.summaryId}.pdf`);
    const content = this.formatPhaseSummaryContent(summary);

    await this.exportToPDF(
      {
        title: summary.reportTitle,
        content,
      },
      outputPath,
    );

    return outputPath;
  }

  async exportPhaseSummaryToWord(summary: PhaseWorkSummary): Promise<string> {
    const outputPath = path.join(tempDir, `summary_${summary.summaryId}.docx`);
    const content = this.formatPhaseSummaryContent(summary);

    await this.exportToWord(
      {
        title: summary.reportTitle,
        content,
      },
      outputPath,
    );

    return outputPath;
  }

  private formatReportContent(report: WorkReport): string[] {
    const paragraphs: string[] = [];

    // 基本信息
    paragraphs.push(`报表类型：${report.reportType}`);
    paragraphs.push(`时间范围：${report.period.start} 至 ${report.period.end}`);
    paragraphs.push(`生成时间：${report.metadata.generatedAt}`);
    paragraphs.push('');

    // 统计数据
    paragraphs.push('一、统计概览');
    paragraphs.push(`总借出次数：${report.statistics.totalBorrows}次`);
    paragraphs.push(`总归还次数：${report.statistics.totalReturns}次`);
    paragraphs.push(`逾期设备：${report.statistics.totalOverdue}台`);
    paragraphs.push(`设备利用率：${report.statistics.deviceUtilization}%`);
    paragraphs.push('');

    // AI分析
    paragraphs.push('二、AI智能分析');
    paragraphs.push(report.aiAnalysis.summary);
    paragraphs.push('');

    paragraphs.push('洞察发现：');
    report.aiAnalysis.insights.forEach((insight) => {
      paragraphs.push(`• ${insight}`);
    });
    paragraphs.push('');

    paragraphs.push('改进建议：');
    report.aiAnalysis.recommendations.forEach((rec) => {
      paragraphs.push(`• ${rec}`);
    });

    return paragraphs;
  }

  private formatPhaseSummaryContent(summary: PhaseWorkSummary): string[] {
    const paragraphs: string[] = [];

    // 基本信息
    paragraphs.push(`报告类型：${summary.summaryType}`);
    paragraphs.push(
      `报告周期：${summary.period.start} 至 ${summary.period.end}`,
    );
    paragraphs.push(`生成时间：${summary.metadata.generatedAt}`);
    paragraphs.push('');

    // 工作概述
    paragraphs.push('一、工作概述');
    paragraphs.push(summary.workOverview.content);
    summary.workOverview.keyPoints.forEach((point) => {
      paragraphs.push(`• ${point}`);
    });
    paragraphs.push('');

    // 工作成果
    paragraphs.push('二、工作成果');
    summary.achievements.items.forEach((item) => {
      paragraphs.push(`${item.title}`);
      paragraphs.push(item.description);
    });
    paragraphs.push('');

    // 数据分析
    paragraphs.push('三、数据分析');
    summary.dataAnalysis.sections.forEach((section) => {
      paragraphs.push(section.title);
      paragraphs.push(section.content);
    });
    paragraphs.push('');

    // 问题与挑战
    paragraphs.push('四、问题与挑战');
    summary.challenges.issues.forEach((issue) => {
      paragraphs.push(issue.title);
      paragraphs.push(issue.description);
    });
    paragraphs.push('');

    // 改进措施
    paragraphs.push('五、改进措施');
    summary.improvements.measures.forEach((measure) => {
      paragraphs.push(measure.title);
      paragraphs.push(measure.description);
    });
    paragraphs.push('');

    // 工作计划
    paragraphs.push('六、工作计划');
    paragraphs.push('短期计划：');
    paragraphs.push(summary.workPlan.shortTermPlan);
    paragraphs.push('');
    paragraphs.push('长期计划：');
    paragraphs.push(summary.workPlan.longTermPlan);
    paragraphs.push('');

    // 总结与展望
    paragraphs.push('七、总结与展望');
    paragraphs.push(summary.conclusion.summary);
    paragraphs.push('');
    paragraphs.push('展望：');
    paragraphs.push(summary.conclusion.outlook);

    return paragraphs;
  }
}

export default ExportService;
```

---

## 三、实施计划

### 3.1 第一阶段：基础功能开发（2-3 周）

**借用风险评估系统**：

- [ ] 创建借用人信用档案表
- [ ] 实现信用评分计算算法
- [ ] 开发风险评估 API
- [ ] 在借出页面集成风险评估展示
- [ ] 实现风险预警机制

**智能报表生成系统**：

- [ ] 创建工作报表表和阶段性工作总结报告表
- [ ] 实现基础数据统计功能
- [ ] 开发报表生成 API
- [ ] 创建报表管理页面
- [ ] 实现报表预览功能
- [ ] 实现 PDF 和 Word 导出功能

### 3.2 第二阶段：AI 功能集成（1-2 周）

**借用风险评估系统**：

- [ ] 优化信用评分算法
- [ ] 实现风险标签自动生成
- [ ] 开发信用档案管理页面
- [ ] 实现黑名单功能

**智能报表生成系统**：

- [ ] 集成 AI 分析服务
- [ ] 实现阶段性工作总结报告生成
- [ ] 开发 AI 洞察和建议功能
- [ ] 实现趋势预测功能

### 3.3 第三阶段：优化和完善（1 周）

**借用风险评估系统**：

- [ ] 性能优化
- [ ] 用户体验优化
- [ ] 添加数据可视化
- [ ] 完善文档和测试

**智能报表生成系统**：

- [ ] 报表模板管理
- [ ] PDF 和 Word 导出优化
- [ ] AI 分析效果优化
- [ ] 完善文档和测试

### 3.4 第四阶段：测试和部署（1 周）

- [ ] 功能测试
- [ ] 性能测试
- [ ] 用户验收测试
- [ ] 文档完善
- [ ] 正式部署

---

## 四、技术选型建议

### 4.1 AI 服务选择

**推荐方案**：

1. **OpenAI GPT-4**（推荐）

   - 强大的语言理解和生成能力
   - 支持中文
   - API 稳定可靠

2. **百度文心一言**

   - 国内服务，访问稳定
   - 中文理解能力强
   - 价格相对较低

3. **阿里通义千问**
   - 阿里云生态
   - 中文支持好
   - 性价比高

### 4.2 报表生成库

**推荐方案**：

1. **PDF 生成**：`pdfkit`
2. **Word 生成**：`docx`
3. **图表库**：`echarts`、`recharts`

### 4.3 数据分析库

**推荐方案**：

1. **数据分析**：`simple-statistics`
2. **时间序列分析**：`ml-matrix`
3. **预测模型**：`brain.js`（神经网络）

---

## 五、预期效果

### 5.1 借用风险评估系统

1. **降低设备损坏风险**

   - 通过信用评分识别高风险借用人
   - 减少设备损坏和丢失

2. **提高归还准时率**

   - 风险预警促使借用人按时归还
   - 逾期率预计降低 30-50%

3. **优化管理决策**
   - 数据驱动的借出决策
   - 提高管理效率和准确性

### 5.2 智能报表生成系统

1. **节省管理时间**

   - 自动生成报表和阶段性报告，减少人工整理时间
   - 预计节省 70-80%的报表制作时间

2. **提升决策质量**

   - AI 分析提供深度洞察
   - 数据支持管理决策

3. **改善工作总结**
   - 专业、全面的阶段性工作总结报告
   - 便于向上级汇报和工作回顾

---

## 六、注意事项

### 6.1 数据安全

1. 借用人信用数据敏感，需要加密存储
2. AI 分析时避免泄露个人信息
3. 定期备份数据库

### 6.2 AI 服务成本

1. 合理使用 AI API，控制成本
2. 考虑缓存机制，减少重复调用
3. 监控 API 使用量

### 6.3 用户体验

1. AI 生成内容需要人工审核
2. 提供编辑和修改功能
3. 确保界面友好易用

---

## 七、总结

本方案详细阐述了借用风险评估系统和智能报表生成系统的设计方案，包括功能需求、技术实现、数据库设计、实施计划等内容。

通过这两个 AI 功能的接入，设备借还管理系统将实现：

1. **智能化管理**：基于数据的智能决策
2. **自动化报表**：减少人工工作量
3. **阶段性报告**：专业的文书汇报
4. **风险预警**：提前识别和防范风险
5. **深度分析**：AI 提供专业洞察和建议

这将显著提升系统的智能化水平，改善用户体验，提高管理效率，使系统更具竞争力和用户吸引力。

---

**文档版本**：v1.1.0 **最后更新**：2026-01-10 **文档状态**：待审阅
