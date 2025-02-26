from typing import Any, Dict, List, Optional
from datetime import datetime
import re
from .transform_service import TransformService

class FieldValidator:
    """字段验证器"""
    def __init__(self):
        self.transform_service = TransformService()

    def validate_type(self, value: Any, expected_type: str) -> bool:
        """验证字段类型"""
        if value is None:
            return True

        type_validators = {
            'string': lambda v: isinstance(v, str),
            'number': lambda v: isinstance(v, (int, float)),
            'integer': lambda v: isinstance(v, int),
            'boolean': lambda v: isinstance(v, bool),
            'array': lambda v: isinstance(v, list),
            'object': lambda v: isinstance(v, dict),
        }

        validator = type_validators.get(expected_type)
        return validator and validator(value)

    def validate_format(self, value: str, format_type: str) -> bool:
        """验证字段格式"""
        if not value:
            return True

        format_validators = {
            'email': lambda v: re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v),
            'date': lambda v: re.match(r'^\d{4}-\d{2}-\d{2}$', v),
            'datetime': lambda v: re.match(r'^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}', v),
            'url': lambda v: re.match(r'^https?://[\w\-\.]+(:\d+)?(/[\w\-\./]*)?$', v),
            'phone': lambda v: re.match(r'^\+?[\d\-]{10,}$', v),
        }

        validator = format_validators.get(format_type)
        return validator and bool(validator(value))

    def validate_length(self, value: Any, min_length: Optional[int] = None, max_length: Optional[int] = None) -> bool:
        """验证字段长度"""
        if value is None:
            return True

        if isinstance(value, (str, list, dict)):
            length = len(value)
            if min_length is not None and length < min_length:
                return False
            if max_length is not None and length > max_length:
                return False
            return True
        return False

    def validate_range(self, value: Any, minimum: Optional[float] = None, maximum: Optional[float] = None) -> bool:
        """验证数值范围"""
        if value is None:
            return True

        try:
            num_value = float(value)
            if minimum is not None and num_value < minimum:
                return False
            if maximum is not None and num_value > maximum:
                return False
            return True
        except (TypeError, ValueError):
            return False

class ValidationService:
    """验证服务"""
    def __init__(self):
        self.field_validator = FieldValidator()
        self.transform_service = TransformService()

    def validate_mapping(self, mapping: Dict[str, Any], channel_field: Dict[str, Any]) -> List[str]:
        """验证单个字段映射"""
        errors = []

        # 验证必填字段
        required_fields = ['mapping_rules']
        for field in required_fields:
            if not mapping.get(field):
                errors.append(f"Missing required field: {field}")

        # 验证映射规则中的必填字段
        if mapping.get('mapping_rules'):
            rules = mapping['mapping_rules']
            required_rule_fields = ['channel_field', 'internal_field']
            for field in required_rule_fields:
                if not rules.get(field):
                    errors.append(f"Missing required field in mapping_rules: {field}")

        # 验证字段类型匹配
        if channel_field and 'type' in channel_field:
            if not self.field_validator.validate_type(
                mapping.get('test_value'),
                channel_field['type']
            ):
                errors.append(f"Invalid field type: expected {channel_field['type']}")

        # 验证转换规则
        if mapping.get('mapping_rules') and mapping['mapping_rules'].get('transform_rule'):
            try:
                rule_config = mapping['mapping_rules']['transform_rule']
                # 只验证规则配置的结构，不验证测试值
                if not isinstance(rule_config, dict) or 'type' not in rule_config or 'params' not in rule_config:
                    errors.append("Invalid transform rule configuration structure")
            except Exception as e:
                errors.append(f"Transform rule error: {str(e)}")

        return errors

    def validate_mappings(self, mappings: List[Any], channel_fields: List[Dict[str, Any]]) -> Dict[str, Any]:
        """验证所有字段映射"""
        validation_results = {
            'valid': True,
            'errors': []
        }

        channel_fields_dict = {field['name']: field for field in channel_fields}

        for mapping in mappings:
            # 将 Pydantic 模型转换为字典
            mapping_dict = mapping.dict() if hasattr(mapping, 'dict') else mapping
            channel_field = channel_fields_dict.get(mapping_dict.get('mapping_rules', {}).get('channel_field', ''))
            errors = self.validate_mapping(mapping_dict, channel_field)
            
            if errors:
                validation_results['valid'] = False
                validation_results['errors'].append({
                    'mapping': mapping_dict,
                    'errors': errors
                })

        return validation_results

    def validate_required_fields(self, data: Dict[str, Any], mappings: List[Dict[str, Any]]) -> List[str]:
        """验证必填字段"""
        missing_fields = []
        
        for mapping in mappings:
            if mapping.get('required') and not data.get(mapping['channel_field']):
                missing_fields.append(mapping['channel_field'])
                
        return missing_fields

    def validate_data_types(self, data: Dict[str, Any], mappings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """验证数据类型"""
        type_errors = []
        
        for mapping in mappings:
            value = data.get(mapping['channel_field'])
            if value is not None and mapping.get('field_type'):
                if not self.field_validator.validate_type(value, mapping['field_type']):
                    type_errors.append({
                        'field': mapping['channel_field'],
                        'expected_type': mapping['field_type'],
                        'actual_value': value
                    })
                    
        return type_errors
