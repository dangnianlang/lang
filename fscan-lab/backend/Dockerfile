FROM golang:1.20-alpine AS builder

WORKDIR /build

COPY go.mod go.sum* ./
RUN go mod download || true

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o api .

FROM alpine:latest

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /build/api /app/api

RUN mkdir -p /app/data /app/flags

EXPOSE 8888

CMD ["/app/api"]
