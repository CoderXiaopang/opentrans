#!/bin/bash
# OpenTrans Gatekeeper Fix Script for macOS

echo "----------------------------------------------------"
echo "OpenTrans macOS 权限修复工具"
echo "----------------------------------------------------"
echo "正在为 /Applications/OpenTrans.app 解除 Gatekeeper 隔离..."
echo "由于 macOS 安全机制，此操作需要管理员权限。"
echo "请输入你的开机密码（输入时屏幕不显示，输完按回车）:"
echo ""

# 尝试对应用程序文件夹中的应用进行脱隔离处理
if [ -d "/Applications/OpenTrans.app" ]; then
    sudo xattr -r -d com.apple.quarantine /Applications/OpenTrans.app
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ 成功！隔离位已清除。"
        echo "现在你可以去“应用程序”文件夹双击打开 OpenTrans 了。"
    else
        echo ""
        echo "❌ 执行出错，请检查是否输入了正确的密码。"
    fi
else
    echo ""
    echo "❌ 未在“应用程序”文件夹中找到 OpenTrans.app。"
    echo "请先将应用拖入 Applications 文件夹，然后再运行此脚本。"
fi

echo ""
echo "----------------------------------------------------"
echo "按任意键退出..."
read -n 1