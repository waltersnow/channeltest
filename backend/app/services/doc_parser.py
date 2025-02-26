from typing import Dict, List, Any
import json

class APIDocumentParser:
    def parse(self, doc_content: Dict) -> List[Dict[str, Any]]:
        """解析API文档，支持Swagger和OpenAPI格式"""
        if self._is_swagger(doc_content):
            return self._parse_swagger(doc_content)
        elif self._is_openapi(doc_content):
            return self._parse_openapi(doc_content)
        else:
            raise ValueError("Unsupported API document format")

    def _is_swagger(self, doc_content: Dict) -> bool:
        """检查是否为Swagger格式"""
        return 'swagger' in doc_content and doc_content['swagger'].startswith('2')

    def _is_openapi(self, doc_content: Dict) -> bool:
        """检查是否为OpenAPI格式"""
        return 'openapi' in doc_content and doc_content['openapi'].startswith('3')

    def _parse_swagger(self, doc_content: Dict) -> List[Dict[str, Any]]:
        """解析Swagger格式文档"""
        fields = []
        
        # 解析定义
        definitions = doc_content.get('definitions', {})
        for def_name, def_schema in definitions.items():
            if 'properties' in def_schema:
                for prop_name, prop_schema in def_schema['properties'].items():
                    fields.append({
                        'name': prop_name,
                        'type': prop_schema.get('type', 'string'),
                        'required': prop_name in def_schema.get('required', []),
                        'description': prop_schema.get('description', ''),
                        'source': f'definitions.{def_name}'
                    })
        
        return fields

    def _parse_openapi(self, doc_content: Dict) -> List[Dict[str, Any]]:
        """解析OpenAPI格式文档"""
        fields = []
        
        # 解析组件
        components = doc_content.get('components', {})
        schemas = components.get('schemas', {})
        
        for schema_name, schema in schemas.items():
            if 'properties' in schema:
                for prop_name, prop_schema in schema['properties'].items():
                    fields.append({
                        'name': prop_name,
                        'type': prop_schema.get('type', 'string'),
                        'required': prop_name in schema.get('required', []),
                        'description': prop_schema.get('description', ''),
                        'source': f'components.schemas.{schema_name}'
                    })
        
        return fields

    def extract_endpoints(self, doc_content: Dict) -> List[Dict[str, Any]]:
        """提取API端点信息"""
        endpoints = []
        
        # 处理路径
        paths = doc_content.get('paths', {})
        for path, methods in paths.items():
            for method, operation in methods.items():
                endpoints.append({
                    'path': path,
                    'method': method.upper(),
                    'summary': operation.get('summary', ''),
                    'description': operation.get('description', ''),
                    'parameters': operation.get('parameters', []),
                    'responses': operation.get('responses', {})
                })
        
        return endpoints
