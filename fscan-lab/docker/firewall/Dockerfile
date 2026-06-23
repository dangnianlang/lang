FROM alpine:latest

RUN apk add --no-cache \
    iptables \
    ip6tables \
    bash \
    iproute2

COPY firewall.sh /firewall.sh
RUN chmod +x /firewall.sh

CMD ["/firewall.sh"]
