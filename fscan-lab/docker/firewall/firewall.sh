#!/bin/bash

set -e

echo "[*] Starting firewall configuration..."

# 启用 IP 转发 (如果Docker已设置则跳过)
if echo 1 > /proc/sys/net/ipv4/ip_forward 2>/dev/null; then
    echo "[+] IP forwarding enabled"
else
    echo "[!] IP forwarding already enabled by Docker"
fi

# 清空所有规则
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
echo "[+] Cleared existing rules"

# 默认策略：FORWARD 拒绝，INPUT/OUTPUT 允许
iptables -P FORWARD DROP
iptables -P INPUT ACCEPT
iptables -P OUTPUT ACCEPT
echo "[+] Set default policies"

# ============================================
# 网络定义
# ============================================
INTERNET="172.16.0.0/24"
DMZ="10.10.1.0/24"
OFFICE="10.10.2.0/24"
PRODUCTION="10.10.3.0/24"
CORE="10.10.4.0/24"

VPN_GATEWAY="10.10.1.13"  # VPN 网关（双网卡）

# ============================================
# 规则 1：外网 -> DMZ（允许）
# ============================================
iptables -A FORWARD -s $INTERNET -d $DMZ -m state --state NEW,ESTABLISHED,RELATED -j ACCEPT
iptables -A FORWARD -s $DMZ -d $INTERNET -m state --state ESTABLISHED,RELATED -j ACCEPT
echo "[+] Rule 1: Internet -> DMZ allowed"

# ============================================
# 规则 2：外网 -> 内网（拒绝）
# ============================================
iptables -A FORWARD -s $INTERNET -d $OFFICE -j DROP
iptables -A FORWARD -s $INTERNET -d $PRODUCTION -j DROP
iptables -A FORWARD -s $INTERNET -d $CORE -j DROP
echo "[+] Rule 2: Internet -> Internal networks blocked"

# ============================================
# 规则 3：DMZ -> 办公网（只允许 VPN 网关）
# ============================================
# VPN 网关本身有两个网卡，自动有路由，这里允许数据包转发
iptables -A FORWARD -s $DMZ -d $OFFICE -j ACCEPT
iptables -A FORWARD -s $OFFICE -d $DMZ -j ACCEPT
echo "[+] Rule 3: DMZ <-> Office (via VPN gateway)"

# ============================================
# 规则 4：办公网 -> 生产网（允许，但限制）
# ============================================
# 只允许特定端口（SSH, Redis, RabbitMQ, ActiveMQ, ES）
iptables -A FORWARD -s $OFFICE -d $PRODUCTION -p tcp -m multiport --dports 22,6379,5672,15672,61613,61614,9200,8080 -j ACCEPT
iptables -A FORWARD -s $PRODUCTION -d $OFFICE -m state --state ESTABLISHED,RELATED -j ACCEPT
echo "[+] Rule 4: Office -> Production (limited ports)"

# ============================================
# 规则 5：生产网 -> 核心网（允许）
# ============================================
iptables -A FORWARD -s $PRODUCTION -d $CORE -j ACCEPT
iptables -A FORWARD -s $CORE -d $PRODUCTION -m state --state ESTABLISHED,RELATED -j ACCEPT
echo "[+] Rule 5: Production <-> Core allowed"

# ============================================
# 规则 6：办公网 -> 核心网（拒绝，必须通过生产网）
# ============================================
iptables -A FORWARD -s $OFFICE -d $CORE -j DROP
echo "[+] Rule 6: Office -> Core blocked (must go through Production)"

# ============================================
# 规则 7：允许同网段内部通信
# ============================================
iptables -A FORWARD -s $DMZ -d $DMZ -j ACCEPT
iptables -A FORWARD -s $OFFICE -d $OFFICE -j ACCEPT
iptables -A FORWARD -s $PRODUCTION -d $PRODUCTION -j ACCEPT
iptables -A FORWARD -s $CORE -d $CORE -j ACCEPT
echo "[+] Rule 7: Intra-network communication allowed"

# ============================================
# 日志规则（调试用）
# ============================================
# iptables -A FORWARD -j LOG --log-prefix "FW-DROP: " --log-level 4

# ============================================
# 显示规则
# ============================================
echo ""
echo "============================================"
echo "Firewall Rules Summary:"
echo "============================================"
iptables -L FORWARD -n -v --line-numbers

echo ""
echo "[*] Firewall configured successfully!"
echo "[*] Network topology:"
echo "    Internet (172.16.0.0/24)"
echo "      └─> DMZ (10.10.1.0/24)"
echo "           └─> Office (10.10.2.0/24)"
echo "                └─> Production (10.10.3.0/24)"
echo "                     └─> Core (10.10.4.0/24)"
echo ""

# 保持容器运行
tail -f /dev/null
