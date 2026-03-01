# GitHub Actions CI/CD 工作流

本项目包含完整的 CI/CD 工作流配置，支持自动化构建、测试和部署。

## 工作流概览

### 1. CI (ci.yml)

**触发条件:**

- Push 到 `main` 或 `develop` 分支
- Pull Request 到 `main` 或 `develop` 分支

**任务:**

- **lint**: 代码风格检查
- **build-electron**: 在 Ubuntu、Windows、macOS 上构建 Electron 应用
- **build-web**: 构建 Next.js Web 应用

**使用:**

```bash
# 查看工作流状态
gh run list

# 查看最新日志
gh run view --web
```

### 2. Release Electron (release-electron.yml)

**触发条件:**

- 推送标签 `v*` (如 `v1.0.0`)
- 手动触发 (workflow_dispatch)

**功能:**

- 在 macOS、Linux、Windows 上构建 Electron 应用
- 代码签名 (macOS 和 Windows)
- 自动创建 GitHub Release
- 上传构建产物

**需要配置的 Secrets:**

```yaml
# macOS 代码签名
CSC_LINK: Base64 编码的证书文件
CSC_KEY_PASSWORD: 证书密码
APPLE_ID: Apple ID
APPLE_ID_PASSWORD: Apple 应用专用密码
APPLE_TEAM_ID: Apple Team ID

# Windows 代码签名
CSC_LINK_WINDOWS: Windows 证书
CSC_KEY_PASSWORD_WINDOWS: Windows 证书密码

# GitHub Token (自动生成)
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**使用方法:**

```bash
# 创建新标签触发发布
git tag v1.0.0
git push origin v1.0.0
```

### 3. Deploy Web (deploy-web.yml)

**触发条件:**

- Push 到 `main` 分支 (修改 web 或 shared 包时)
- 手动触发

**功能:**

- 构建 Docker 镜像并推送到 Docker Hub
- 部署到 Vercel (可选)

**需要配置的 Secrets:**

```yaml
# Docker Hub
DOCKER_USERNAME: Docker Hub 用户名
DOCKER_PASSWORD: Docker Hub 密码或访问令牌

# Vercel (可选)
VERCEL_TOKEN: Vercel 访问令牌
VERCEL_ORG_ID: Vercel 组织 ID
VERCEL_PROJECT_ID: Vercel 项目 ID
```

## 本地测试工作流

使用 [act](https://github.com/nektos/act) 工具本地测试工作流:

```bash
# 安装 act
brew install act

# 运行 CI 工作流
act -j lint
act -j build-web

# 运行特定事件
act push
act pull_request
```

## 手动触发工作流

1. 进入 GitHub 仓库页面
2. 点击 "Actions" 标签
3. 选择工作流 (如 "Release Electron")
4. 点击 "Run workflow" 按钮
5. 选择分支，填写参数 (如有)

## 故障排查

### Electron 构建失败

1. 检查代码签名证书是否配置正确
2. 确认 macOS 构建在 macOS runner 上运行
3. 检查 better-sqlite3 原生模块是否正确编译

### Web 构建失败

1. 检查 DATABASE_URL 环境变量是否设置
2. 确认所有依赖已正确安装
3. 检查 TypeScript 类型错误

### Docker 推送失败

1. 确认 DOCKER_USERNAME 和 DOCKER_PASSWORD 已设置
2. 检查 Docker Hub 仓库是否存在
3. 确认令牌有推送权限

## 最佳实践

1. **版本号管理**: 使用语义化版本 (Semantic Versioning)

   - 主版本号: 破坏性变更
   - 次版本号: 新功能
   - 修订号: Bug 修复

2. **分支策略**:

   - `main`: 生产环境代码
   - `develop`: 开发分支
   - `feature/*`: 功能分支
   - `hotfix/*`: 紧急修复

3. **提交信息规范**:

   ```
   feat: 新增功能
   fix: 修复问题
   docs: 文档更新
   style: 代码格式
   refactor: 重构
   test: 测试相关
   chore: 构建/工具
   ```

4. **安全建议**:
   - 定期轮换 Secrets
   - 使用 GitHub Environments 保护生产部署
   - 启用分支保护规则
   - 要求 Code Review
