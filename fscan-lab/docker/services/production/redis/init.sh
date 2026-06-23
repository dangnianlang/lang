#!/bin/bash
# 这个脚本在 Redis 启动后设置 flag
sleep 5
redis-cli -a redis123 SET flag5 "FSCAN_LAB{r3d1s_un4uth0r1z3d_4cc3ss}"
redis-cli -a redis123 SET hint "Check /root/.ssh for SSH keys to core network"
echo "Redis flag initialized"
