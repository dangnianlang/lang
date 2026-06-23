#!/bin/bash
# 构建 fscan-lite 并准备发布产物

set -e

VERSION="${1:-dev}"
LITE_DIR="fscan-lite"
OUTPUT_DIR="dist-lite"

echo "==> 构建 fscan-lite (版本: $VERSION)"

# 清理旧产物
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# 进入 lite 目录
cd "$LITE_DIR"

# 源文件
SOURCES="src/main.c src/scanner.c src/platform.c"
INCLUDE="-Iinclude"
CFLAGS_BASE="-std=c89 -Wall -O2"

# 构建 Linux 版本
echo "==> 构建 Linux 版本..."

# Linux x64
echo "  - Linux x64"
mkdir -p bin
gcc $CFLAGS_BASE $INCLUDE -o bin/fscan-lite $SOURCES -lpthread
cp bin/fscan-lite "../$OUTPUT_DIR/fscan-lite_${VERSION}_linux_x64"
rm -rf bin

# Linux x32
echo "  - Linux x32"
mkdir -p bin
gcc $CFLAGS_BASE -m32 $INCLUDE -o bin/fscan-lite $SOURCES -lpthread 2>/dev/null || echo "    (跳过: 缺少 32-bit 支持)"
if [ -f bin/fscan-lite ]; then
    cp bin/fscan-lite "../$OUTPUT_DIR/fscan-lite_${VERSION}_linux_x32"
fi
rm -rf bin

# 构建 Windows 版本
echo "==> 构建 Windows 版本..."

# Windows x64
echo "  - Windows x64"
mkdir -p bin
x86_64-w64-mingw32-gcc $CFLAGS_BASE $INCLUDE -o bin/fscan-lite.exe $SOURCES -lws2_32 -static
if [ -f bin/fscan-lite.exe ]; then
    cp bin/fscan-lite.exe "../$OUTPUT_DIR/fscan-lite_${VERSION}_windows_x64.exe"
    echo "    ✓ 编译成功"
else
    echo "    ✗ 编译失败"
fi
rm -rf bin

# Windows x32
echo "  - Windows x32"
mkdir -p bin
i686-w64-mingw32-gcc $CFLAGS_BASE $INCLUDE -o bin/fscan-lite.exe $SOURCES -lws2_32 -static
if [ -f bin/fscan-lite.exe ]; then
    cp bin/fscan-lite.exe "../$OUTPUT_DIR/fscan-lite_${VERSION}_windows_x32.exe"
    echo "    ✓ 编译成功"
else
    echo "    ✗ 编译失败"
fi
rm -rf bin

cd ..

# 统计产物
echo ""
echo "==> 构建完成！"
echo "产物列表："
if [ -d "$OUTPUT_DIR" ]; then
    ls -lh "$OUTPUT_DIR" 2>/dev/null || echo "  (无产物)"
    echo ""
    FILECOUNT=$(ls "$OUTPUT_DIR" 2>/dev/null | wc -l)
    echo "总计: $FILECOUNT 个文件"
fi
