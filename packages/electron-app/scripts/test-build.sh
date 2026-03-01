#!/bin/bash

# Electron 构建测试脚本

set -e

echo "🚀 开始测试 Electron 构建..."

# 清理旧构建
echo "🧹 清理旧构建文件..."
rm -rf dist dist-electron

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 构建主进程
echo "🔨 构建主进程..."
npm run build:main

# 构建 preload
echo "🔨 构建 preload..."
npm run build:preload

# 运行 Electron Builder（仅生成目录，不打包）
echo "📁 测试 Electron Builder..."
npm run test:build

echo "✅ 构建测试完成！"
echo ""
echo "检查 dist-electron 目录："
ls -la dist-electron/
