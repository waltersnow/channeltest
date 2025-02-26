from datetime import datetime
import json
import re
from typing import Any, Dict, Optional, List
from jsonpath_ng import parse as parse_jsonpath
from pydantic import BaseModel, Field

class TransformRule(BaseModel):
    type: str
    params: Dict[str, Any]

class TransformResult(BaseModel):
    success: bool
    value: Optional[Any] = None
    error: Optional[str] = None

class TransformService:
    @staticmethod
    def transform(value: Any, rule: TransformRule) -> TransformResult:
        try:
            if rule.type == "multiply":
                try:
                    num_value = float(value)
                    multiplier = float(rule.params.get("value", 1))
                    return TransformResult(
                        success=True,
                        value=round(num_value * multiplier, 2)  # 保留两位小数
                    )
                except (TypeError, ValueError) as e:
                    return TransformResult(
                        success=False,
                        error=f"输入值必须是数字类型: {str(e)}"
                    )

            elif rule.type == "datetime":
                try:
                    if isinstance(value, (int, float)):
                        # 处理时间戳
                        dt = datetime.fromtimestamp(value)
                    else:
                        # 尝试解析字符串日期
                        dt = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
                    
                    format_str = rule.params.get("format", "%Y-%m-%d %H:%M:%S")
                    return TransformResult(
                        success=True,
                        value=dt.strftime(format_str)
                    )
                except Exception as e:
                    return TransformResult(
                        success=False,
                        error=f"日期转换失败: {str(e)}"
                    )

            elif rule.type == "jsonpath":
                try:
                    path = rule.params.get("path")
                    if not path:
                        return TransformResult(
                            success=False,
                            error="未指定JSONPath表达式"
                        )

                    jsonpath_expr = parse_jsonpath(path)
                    matches = jsonpath_expr.find(value)
                    
                    if not matches:
                        return TransformResult(
                            success=False,
                            error=f"未找到匹配的值: {path}"
                        )
                    
                    # 返回第一个匹配的值
                    return TransformResult(
                        success=True,
                        value=matches[0].value
                    )
                except Exception as e:
                    return TransformResult(
                        success=False,
                        error=f"JSONPath提取失败: {str(e)}"
                    )

            elif rule.type == "regex":
                try:
                    pattern = rule.params.get("pattern")
                    if not pattern:
                        return TransformResult(
                            success=False,
                            error="未指定正则表达式"
                        )
                    
                    group = rule.params.get("group", 0)
                    matches = re.search(pattern, str(value))
                    
                    if not matches:
                        return TransformResult(
                            success=False,
                            error="未找到匹配的值"
                        )
                    
                    return TransformResult(
                        success=True,
                        value=matches.group(group)
                    )
                except Exception as e:
                    return TransformResult(
                        success=False,
                        error=f"正则表达式提取失败: {str(e)}"
                    )

            elif rule.type == "enum_map":
                mapping = rule.params.get("mapping", {})
                case_sensitive = rule.params.get("case_sensitive", True)
                
                if not mapping:
                    return TransformResult(
                        success=False,
                        error="未指定枚举值映射"
                    )
                
                str_value = str(value)
                if not case_sensitive:
                    str_value = str_value.lower()
                    mapping = {k.lower(): v for k, v in mapping.items()}
                
                if str_value in mapping:
                    return TransformResult(
                        success=True,
                        value=mapping[str_value]
                    )
                else:
                    return TransformResult(
                        success=False,
                        error=f"未找到匹配的枚举值: {value}"
                    )

            else:
                return TransformResult(
                    success=False,
                    error=f"不支持的转换规则类型: {rule.type}"
                )

        except Exception as e:
            return TransformResult(
                success=False,
                error=f"转换失败: {str(e)}"
            )

    @staticmethod
    def validate_value(value: Any, rule_type: str, params: Dict[str, Any]) -> bool:
        """验证值是否可以被转换规则处理"""
        try:
            if rule_type == "multiply":
                # 检查值是否可以转换为数字
                try:
                    float(value) if value is not None else 0
                    return True
                except (TypeError, ValueError):
                    return False
                    
            elif rule_type == "datetime":
                # 检查值是否可以转换为日期时间
                try:
                    if isinstance(value, (int, float)):
                        datetime.fromtimestamp(value)
                    else:
                        datetime.fromisoformat(str(value).replace('Z', '+00:00'))
                    return True
                except (TypeError, ValueError):
                    return False
                    
            elif rule_type == "jsonpath":
                # 检查值是否是有效的JSON对象
                try:
                    if not isinstance(value, (dict, list)):
                        return False
                    if not isinstance(params.get('path'), str):
                        return False
                    return True
                except:
                    return False
                    
            elif rule_type == "enum_map":
                # 检查映射配置是否有效
                mapping = params.get('mapping', {})
                return isinstance(mapping, dict) and len(mapping) > 0
                
            return False
        except:
            return False

    @staticmethod
    def test_transform(value: Any, rule: TransformRule) -> TransformResult:
        """
        测试转换规则
        """
        return TransformService.transform(value, rule)

    @staticmethod
    def batch_transform(data: Dict[str, Any], mappings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """批量转换数据"""
        result = {}
        errors = []

        for mapping in mappings:
            try:
                # 获取字段映射信息
                internal_field = mapping.get('internal_field')
                channel_field = mapping.get('channel_field')
                transform_rule = mapping.get('transform_rule')

                if not internal_field or not channel_field:
                    continue

                # 获取输入值
                value = data.get(internal_field)
                if value is None and '$.alipay_trade_query_response' in channel_field:
                    # 如果是查询响应映射，直接使用整个输入数据
                    value = data

                if value is None:
                    if mapping.get('is_required', False):
                        errors.append(f"Missing required field: {internal_field}")
                    continue

                # 应用转换规则
                if transform_rule and transform_rule != 'None':
                    try:
                        rule_dict = json.loads(transform_rule.replace("'", '"')) if isinstance(transform_rule, str) else transform_rule
                        
                        # 如果是查询响应映射，先应用jsonpath转换
                        if '$.alipay_trade_query_response' in channel_field:
                            jsonpath_rule = TransformRule(
                                type="jsonpath",
                                params={"path": channel_field}
                            )
                            transform_result = TransformService.transform(value, jsonpath_rule)
                            if not transform_result.success:
                                errors.append(f"JSONPath transform failed for {internal_field}: {transform_result.error}")
                                continue
                            value = transform_result.value

                        # 应用其他转换规则（如enum_map）
                        if rule_dict['type'] != 'jsonpath':
                            transform_result = TransformService.transform(value, TransformRule(**rule_dict))
                            if not transform_result.success:
                                errors.append(f"Transform failed for {internal_field}: {transform_result.error}")
                                continue
                            value = transform_result.value
                    except Exception as e:
                        errors.append(f"Transform error for {internal_field}: {str(e)}")
                        continue

                # 获取实际的渠道字段名（去掉jsonpath前缀）
                actual_channel_field = channel_field.split('.')[-1] if '$.alipay_trade_query_response' in channel_field else channel_field
                result[actual_channel_field] = value

            except Exception as e:
                errors.append(f"Error processing mapping: {str(e)}")

        if errors:
            raise ValueError({"errors": errors})

        return result
