#!/bin/bash
# 修复SSH密钥权限（Docker volume在Windows上挂载时默认777）
if [ -f /root/.ssh/authorized_keys ]; then
    chmod 600 /root/.ssh/authorized_keys
    chown root:root /root/.ssh/authorized_keys
fi

# 确保.ssh目录权限正确
chmod 700 /root/.ssh

# 启动SSH服务
exec /usr/sbin/sshd -D
