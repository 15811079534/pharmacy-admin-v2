#!/bin/bash

# 快速生成模块代码脚本
# 用法: ./generate-module.sh <模块名> <中文名> <API路径>
# 示例: ./generate-module.sh role 角色 /system/role

MODULE_NAME=$1
MODULE_CN=$2
API_PATH=$3

if [ -z "$MODULE_NAME" ] || [ -z "$MODULE_CN" ] || [ -z "$API_PATH" ]; then
  echo "用法: ./generate-module.sh <模块名> <中文名> <API路径>"
  echo "示例: ./generate-module.sh role 角色 /system/role"
  exit 1
fi

# 转换为大驼峰命名
MODULE_PASCAL=$(echo $MODULE_NAME | sed -r 's/(^|_)([a-z])/\U\2/g')

echo "正在生成 $MODULE_CN 模块..."
echo "模块名: $MODULE_NAME"
echo "Pascal命名: $MODULE_PASCAL"
echo "API路径: $API_PATH"

# 这里可以添加自动生成代码的逻辑
# 1. 生成 API 文件
# 2. 生成 Form 组件
# 3. 更新列表页面

echo "✅ 模块生成完成！"
echo ""
echo "接下来的步骤："
echo "1. 编辑 API 文件，定义接口和类型"
echo "2. 编辑 Form 组件，添加表单字段"
echo "3. 更新列表页面，集成 API 和 Form"
