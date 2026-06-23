# fscan-lab：内网渗透训练平台

基于Docker的五层网络架构渗透测试环境，用于学习和练习fscan工具在真实内网场景的应用。

## 快速开始

```bash
# 启动环境
docker-compose up -d

# 进入攻击者容器
docker exec -it lab-attacker /bin/bash

# 开始渗透（从DMZ区开始）
fscan -h 10.10.1.0/24
```

## 网络拓扑

```
外网(172.16.0.0/24) → DMZ(10.10.1.0/24) → 办公网(10.10.2.0/24) → 生产网(10.10.3.0/24) → 核心网(10.10.4.0/24)
```

## 目录说明

- `docker-compose.yml` - 完整环境配置（23个容器）
- `test-services/` - 单服务测试环境（28个服务）
- `docker/` - 网络服务配置
- `backend/` - API服务（Go）
- `frontend/` - Web UI（React）

## Web界面

- **训练平台**: http://localhost:3000
- **API服务**: http://localhost:8888

## 管理命令

```bash
# 查看状态
docker-compose ps

# 停止环境
docker-compose down

# 完全清理
docker-compose down -v
```
