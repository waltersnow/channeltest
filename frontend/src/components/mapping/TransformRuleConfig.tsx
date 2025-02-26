import React, { useState, useEffect } from 'react';
import { Form, Select, Input, InputNumber, Switch, Card } from 'antd';

const { Option } = Select;

interface TransformRuleConfigProps {
  value?: any;
  onChange?: (value: any) => void;
}

const RULE_TYPES = [
  {
    value: 'multiply',
    label: '数值乘法',
    description: '将数值乘以指定的倍数',
    params: ['value']
  },
  {
    value: 'datetime',
    label: '日期时间转换',
    description: '转换日期时间格式',
    params: ['format']
  },
  {
    value: 'jsonpath',
    label: 'JSON路径提取',
    description: '从JSON对象中提取指定路径的值',
    params: ['path']
  },
  {
    value: 'regex',
    label: '正则表达式提取',
    description: '使用正则表达式提取匹配的值',
    params: ['pattern', 'group']
  },
  {
    value: 'enum_map',
    label: '枚举值映射',
    description: '将输入值映射到指定的枚举值',
    params: ['mapping', 'case_sensitive']
  }
];

const TransformRuleConfig: React.FC<TransformRuleConfigProps> = ({
  value,
  onChange
}) => {
  const [ruleType, setRuleType] = useState<string>(value?.type || '');
  const [params, setParams] = useState<any>(value?.params || {});

  // 初始化时同步外部值
  useEffect(() => {
    if (value) {
      setRuleType(value.type || '');
      setParams(value.params || {});
    }
  }, [value]);

  const handleRuleTypeChange = (type: string) => {
    setRuleType(type);
    setParams({});
    if (onChange) {
      onChange({
        type,
        params: {}
      });
    }
  };

  const handleParamChange = (paramName: string, paramValue: any) => {
    const newParams = {
      ...params,
      [paramName]: paramValue
    };
    setParams(newParams);
    if (onChange) {
      onChange({
        type: ruleType,
        params: newParams
      });
    }
  };

  const renderParamInput = (paramName: string, ruleType: string) => {
    switch (ruleType) {
      case 'multiply':
        if (paramName === 'value') {
          return (
            <InputNumber
              placeholder="请输入倍数"
              value={params[paramName]}
              onChange={(value) => handleParamChange(paramName, value)}
            />
          );
        }
        break;

      case 'datetime':
        if (paramName === 'format') {
          return (
            <Input
              placeholder="例如: YYYY-MM-DD HH:mm:ss"
              value={params[paramName]}
              onChange={(e) => handleParamChange(paramName, e.target.value)}
            />
          );
        }
        break;

      case 'jsonpath':
        if (paramName === 'path') {
          return (
            <Input
              placeholder="例如: data.items[0].id"
              value={params[paramName]}
              onChange={(e) => handleParamChange(paramName, e.target.value)}
            />
          );
        }
        break;

      case 'regex':
        if (paramName === 'pattern') {
          return (
            <Input
              placeholder="请输入正则表达式"
              value={params[paramName]}
              onChange={(e) => handleParamChange(paramName, e.target.value)}
            />
          );
        } else if (paramName === 'group') {
          return (
            <InputNumber
              min={0}
              placeholder="匹配组索引"
              value={params[paramName]}
              onChange={(value) => handleParamChange(paramName, value)}
            />
          );
        }
        break;

      case 'enum_map':
        if (paramName === 'mapping') {
          return (
            <Input.TextArea
              placeholder="请输入JSON格式的映射关系，例如：&#x0a;{&#x0a;  &quot;SUCCESS&quot;: &quot;支付成功&quot;,&#x0a;  &quot;FAIL&quot;: &quot;支付失败&quot;&#x0a;}"
              value={typeof params[paramName] === 'object' ? 
                JSON.stringify(params[paramName], null, 2) : 
                params[paramName]
              }
              onChange={(e) => {
                try {
                  const mapping = JSON.parse(e.target.value);
                  handleParamChange(paramName, mapping);
                } catch {
                  handleParamChange(paramName, e.target.value);
                }
              }}
              rows={4}
            />
          );
        } else if (paramName === 'case_sensitive') {
          return (
            <Switch
              checked={params[paramName]}
              onChange={(checked) => handleParamChange(paramName, checked)}
            />
          );
        }
        break;
    }
    return null;
  };

  const selectedRule = RULE_TYPES.find(rule => rule.value === ruleType);

  return (
    <Card size="small" title="转换规则配置">
      <Form layout="vertical">
        <Form.Item label="规则类型">
          <Select
            value={ruleType}
            onChange={handleRuleTypeChange}
            placeholder="请选择转换规则类型"
            style={{ width: '100%' }}
          >
            {RULE_TYPES.map(rule => (
              <Option key={rule.value} value={rule.value}>
                {rule.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedRule && (
          <Form.Item label="规则说明">
            {selectedRule.description}
          </Form.Item>
        )}

        {selectedRule?.params.map(paramName => (
          <Form.Item key={paramName} label={paramName}>
            {renderParamInput(paramName, ruleType)}
          </Form.Item>
        ))}
      </Form>
    </Card>
  );
};

export default TransformRuleConfig;
