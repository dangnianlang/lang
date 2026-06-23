FROM ubuntu:20.04

# 安装 Samba 服务
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
    samba \
    samba-common-bin \
    && rm -rf /var/lib/apt/lists/*

# 创建共享目录
RUN mkdir -p /shared/documents /shared/backups

# 创建 Samba 用户 (弱密码账户用于渗透测试)
RUN useradd -M -s /sbin/nologin printer && \
    (echo 'printer123'; echo 'printer123') | smbpasswd -s -a printer && \
    useradd -M -s /sbin/nologin administrator && \
    (echo 'admin123'; echo 'admin123') | smbpasswd -s -a administrator && \
    useradd -M -s /sbin/nologin admin && \
    (echo 'admin'; echo 'admin') | smbpasswd -s -a admin && \
    useradd -M -s /sbin/nologin guest && \
    (echo 'guest'; echo 'guest') | smbpasswd -s -a guest

# 配置 Samba
RUN printf '[global]\n\
   workgroup = WORKGROUP\n\
   server string = Office Printer Server\n\
   security = user\n\
   map to guest = Never\n\
   dns proxy = no\n\
   passdb backend = tdbsam\n\
\n\
[print$]\n\
   comment = Printer Drivers Share\n\
   path = /shared/documents\n\
   browseable = yes\n\
   read only = no\n\
   guest ok = no\n\
   valid users = printer administrator admin guest\n\
\n\
[backup]\n\
   comment = Printer Backup Files\n\
   path = /shared/backups\n\
   browseable = yes\n\
   read only = no\n\
   guest ok = no\n\
   valid users = printer administrator admin guest\n' > /etc/samba/smb.conf

# 开放 SMB 端口
EXPOSE 139 445

# 启动 Samba 服务
CMD ["smbd", "--foreground", "--no-process-group"]
