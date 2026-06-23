FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# 安装基本工具（分批安装避免超时）
RUN apt-get update && \
    apt-get install -y curl wget vim iputils-ping net-tools && \
    apt-get install -y openssh-client ftp rsync telnet && \
    apt-get install -y redis-tools mysql-client postgresql-client && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 创建工作目录
WORKDIR /root

# 复制 fscan 二进制（需要用户提前编译）
COPY fscan /usr/local/bin/fscan
RUN chmod +x /usr/local/bin/fscan

# 下载并安装 frp 客户端 (v0.65.0)
RUN wget -q https://github.com/fatedier/frp/releases/download/v0.65.0/frp_0.65.0_linux_amd64.tar.gz && \
    tar -xzf frp_0.65.0_linux_amd64.tar.gz && \
    mv frp_0.65.0_linux_amd64/frpc /usr/local/bin/frpc && \
    chmod +x /usr/local/bin/frpc && \
    rm -rf frp_0.65.0_linux_amd64*

# 创建工具目录
RUN mkdir -p /root/tools /root/loot /root/scripts /etc/frp

# 复制 frp 客户端配置
COPY frpc.ini /etc/frp/frpc.ini

# 欢迎信息
COPY welcome.sh /root/.bashrc
RUN echo 'export PS1="\[\033[01;31m\]attacker\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]# "' >> /root/.bashrc

CMD ["/bin/bash"]
