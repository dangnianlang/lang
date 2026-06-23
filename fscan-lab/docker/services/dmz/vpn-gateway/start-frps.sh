#!/bin/bash
# FRP 服务端启动脚本
# 在后台启动 frps 服务

echo "[+] 启动 FRP 服务端..."
nohup /usr/local/bin/frps -c /etc/frp/frps.ini > /var/log/frps.log 2>&1 &

if [ $? -eq 0 ]; then
    echo "[+] FRP 服务端已启动"
    echo "[+] 监听端口: 7000"
    echo "[+] Dashboard: http://10.10.1.13:7500 (admin/fscan_lab_frp)"
    echo "[+] 日志文件: /var/log/frps.log"
else
    echo "[-] FRP 服务端启动失败"
    exit 1
fi
