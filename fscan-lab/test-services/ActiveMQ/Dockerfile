FROM rmohr/activemq:5.15.9

# 复制STOMP专用配置文件
COPY activemq.xml /opt/activemq/conf/activemq.xml

# 仅暴露STOMP协议端口
EXPOSE 61613 61614

# 设置环境变量
ENV ACTIVEMQ_OPTS_MEMORY="-Xms64M -Xmx512M"
ENV ACTIVEMQ_OPTS="-Djava.util.logging.config.file=logging.properties -Djava.security.auth.login.config=/opt/activemq/conf/login.config"

# 启动ActiveMQ
CMD ["/opt/activemq/bin/activemq", "console"]