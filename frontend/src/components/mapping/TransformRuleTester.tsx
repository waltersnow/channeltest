import React, { useState } from 'react';
import { Card, Input, Button, Alert, Space, Typography, Form } from 'antd';
import { testChannelConfig } from '../../services/api';

const { TextArea } = Input;
const { Text } = Typography;

interface TransformRuleTesterProps {
  channelId: number;
  rule: any;
}

const TransformRuleTester: React.FC<TransformRuleTesterProps> = ({ channelId, rule }) => {
  const [form] = Form.useForm();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    try {
      setLoading(true);
      const { testValue } = await form.validateFields();

      let testInput;
      try {
        // 尝试解析JSON
        testInput = JSON.parse(testValue);
      } catch {
        // 如果不是有效的JSON，使用原始值
        testInput = testValue;
      }

      // 包装测试数据
      const testData = {
        input_data: {
          value: testInput,
          transform_rule: rule,
        },
      };

      console.log('发送测试数据:', JSON.stringify(testData, null, 2));
      const response = await testChannelConfig(channelId, testData);
      console.log('测试结果:', JSON.stringify(response, null, 2));

      setResult(response);
    } catch (error: any) {
      console.error('测试错误:', error);
      setResult({
        success: false,
        error: error.response?.data?.detail || (error instanceof Error ? error.message : '测试失败'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card size="small" title="测试转换规则" style={{ marginTop: 16 }}>
      <Form form={form} layout="vertical">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item
            name="testValue"
            label="输入测试值"
            rules={[{ required: true, message: '请输入测试值' }]}
          >
            <TextArea
              placeholder="输入要测试的值，如果是JSON格式请确保格式正确"
              rows={4}
            />
          </Form.Item>
          <Button type="primary" onClick={handleTest} loading={loading}>
            测试
          </Button>
          {result && (
            <Alert
              type={result.success ? 'success' : 'error'}
              message={result.success ? '测试成功' : '测试失败'}
              description={
                <pre>
                  {JSON.stringify(result.success ? result.result : result.error, null, 2)}
                </pre>
              }
            />
          )}
        </Space>
      </Form>
    </Card>
  );
};

export default TransformRuleTester;
