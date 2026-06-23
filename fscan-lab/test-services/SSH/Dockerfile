# 使用Ubuntu最新版本作为基础镜像
FROM ubuntu:latest

# 安装必要的软件包（SSH服务 + 常用渗透工具）
RUN apt-get update && apt-get install -y \
    openssh-server \
    telnet \
    curl \
    wget \
    netcat-traditional \
    net-tools \
    iputils-ping \
    dnsutils \
    vim \
    && rm -rf /var/lib/apt/lists/*

# 创建SSH所需的目录
RUN mkdir /var/run/sshd

# 允许root用户SSH登录并设置密码
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN echo 'root:Aa123456789' | chpasswd

# 创建多个弱密码用户（匹配fscan默认字典）
RUN useradd -m admin && echo 'admin:admin' | chpasswd && \
    useradd -m test && echo 'test:123456' | chpasswd && \
    useradd -m user && echo 'user:password' | chpasswd && \
    echo 'root:root' | chpasswd

# 配置密钥认证用户（ubuntu用户已存在于Ubuntu镜像中）
RUN mkdir -p /home/ubuntu/.ssh && \
    chmod 700 /home/ubuntu/.ssh

# 复制SSH测试密钥
COPY test_key.pub /home/ubuntu/.ssh/authorized_keys
COPY test_key_root.pub /root/.ssh/authorized_keys

# 设置密钥权限
RUN chmod 600 /home/ubuntu/.ssh/authorized_keys && \
    chown -R ubuntu:ubuntu /home/ubuntu/.ssh && \
    mkdir -p /root/.ssh && chmod 700 /root/.ssh && \
    chmod 600 /root/.ssh/authorized_keys

# 下载并安装 frp 服务端 (v0.65.0)
RUN wget -q https://github.com/fatedier/frp/releases/download/v0.65.0/frp_0.65.0_linux_amd64.tar.gz && \
    tar -xzf frp_0.65.0_linux_amd64.tar.gz && \
    mv frp_0.65.0_linux_amd64/frps /usr/local/bin/frps && \
    chmod +x /usr/local/bin/frps && \
    rm -rf frp_0.65.0_linux_amd64*

# 创建 frp 配置目录
RUN mkdir -p /etc/frp

# 开放22端口（SSH）和7000端口（FRP）
EXPOSE 22 7000

# 复制并设置启动脚本
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# 使用启动脚本（自动修复SSH密钥权限）
ENTRYPOINT ["/entrypoint.sh"]