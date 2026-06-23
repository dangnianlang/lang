#!/bin/bash
# Elasticsearch 初始化脚本
# 等待 ES 启动后插入 flag8 数据

sleep 30  # 等待 Elasticsearch 完全启动

# 创建包含 flag8 的索引
curl -X PUT "localhost:9200/secrets" -H 'Content-Type: application/json' -d'
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  }
}'

# 插入 flag8 文档
curl -X POST "localhost:9200/secrets/_doc/1" -H 'Content-Type: application/json' -d'
{
  "flag": "FSCAN_LAB{3l4st1cs34rch_un4uth0r1z3d}",
  "description": "Elasticsearch Unauthorized Access Flag",
  "network": "production",
  "service": "elasticsearch",
  "timestamp": "2024-12-17T00:00:00Z"
}'

# 插入其他敏感数据
curl -X POST "localhost:9200/secrets/_doc/2" -H 'Content-Type: application/json' -d'
{
  "db_host": "10.10.4.40",
  "db_type": "MySQL",
  "db_user": "root",
  "db_hint": "Check backup server for password"
}'

curl -X POST "localhost:9200/secrets/_doc/3" -H 'Content-Type: application/json' -d'
{
  "redis_host": "10.10.3.31",
  "redis_password": "redis123",
  "cache_type": "production"
}'

echo "Elasticsearch initialized with flag8"
