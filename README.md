# 支付渠道管理系统

## 项目简介
这是一个支付渠道管理系统，用于简化支付渠道的接入和配置过程。系统提供可视化的配置界面，支持自动解析渠道接口文档，智能匹配字段映射关系。

## 主要功能
- 渠道基础信息管理
- 接口文档自动解析（支持Swagger/OpenAPI）
- 智能字段映射推荐
- 可视化配置界面
- 配置测试与验证
- 版本管理与审计日志

## 技术栈
- 后端：Python FastAPI
- 前端：React + TypeScript
- 数据库：PostgreSQL
- 文档解析：OpenAPI Parser

## 项目结构
```
xtchannel/
├── backend/          # 后端服务
├── frontend/         # 前端应用
├── docs/            # 项目文档
└── docker/          # Docker配置
```

## 开发环境搭建
1. 后端服务启动
```bash
cd backend
source venv/bin/activate  # 激活Python虚拟环境
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2. 前端服务启动
```bash
cd frontend
npm install --legacy-peer-deps  # 首次安装或依赖有更新时运行
npm start
```

## 贡献指南
欢迎提交Issue和Pull Request
