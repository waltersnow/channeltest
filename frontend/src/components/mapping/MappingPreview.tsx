import React, { useState } from 'react';
import { Card, Input, Button, Typography, message } from 'antd';
import { testChannelConfig } from '../../services/api';

const { TextArea } = Input;
const { Title } = Typography;

interface MappingPreviewProps {
  channelId: number;
  channelFields: any[];
  mappings: any[];
}

const MappingPreview: React.FC<MappingPreviewProps> = ({
  channelId,
  channelFields,
  mappings,
}) => {
  const [inputData, setInputData] = useState<string>('');
  const [previewResult, setPreviewResult] = useState<any>(null);

  // 示例数据生成
  const generateSampleData = () => {
    const sampleData = {
      input_data: {
        test_data: 8.88,
        transform_rule: {
          type: "multiply",
          params: {
            value: 100
          }
        }
      }
    };
    const jsonStr = JSON.stringify(sampleData, null, 2);
    console.log('==================');
    console.log('生成的示例数据:');
    console.log(jsonStr);
    console.log('==================');
    setInputData(jsonStr);
  };

  // 预览转换结果
  const previewTransformation = async () => {
    console.log('==================');
    console.log('开始预览转换');
    try {
      let testData;
      try {
        testData = JSON.parse(inputData);
        console.log('解析后的输入数据:');
        console.log(JSON.stringify(testData, null, 2));
      } catch (e) {
        console.error('JSON 解析错误:', e);
        message.error('输入数据不是有效的 JSON 格式');
        return;
      }

      if (!testData.input_data) {
        console.log('数据不包含 input_data，进行包装');
        testData = { input_data: testData };
      }

      console.log('发送的请求数据:');
      console.log(JSON.stringify(testData, null, 2));
      const response = await testChannelConfig(Number(channelId), testData);
      console.log('测试结果:');
      console.log(JSON.stringify(response, null, 2));
      setPreviewResult(response.result || response);
    } catch (error: any) {
      console.error('预览错误:', error);
      if (error.response?.status === 422) {
        const detail = error.response?.data?.detail;
        console.error('422错误详情:');
        console.error(JSON.stringify(detail, null, 2));
        if (Array.isArray(detail) && detail.length > 0) {
          message.error(`请求数据格式错误: ${detail[0].msg}`);
        } else {
          message.error('请求数据格式错误，请检查输入数据是否为有效的 JSON 格式');
        }
      } else {
        message.error(error.response?.data?.detail || '预览失败');
      }
    }
    console.log('==================');
  };

  return (
    <Card title="字段映射预览" style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <Button onClick={generateSampleData} style={{ marginRight: 8 }}>
          生成示例数据
        </Button>
        <Button type="primary" onClick={previewTransformation}>
          预览转换结果
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <Title level={5}>输入数据</Title>
          <TextArea
            value={inputData}
            onChange={(e) => {
              console.log('输入数据变更:', e.target.value);
              setInputData(e.target.value);
            }}
            rows={10}
            placeholder="请输入要测试的JSON数据"
          />
        </div>
        <div style={{ flex: 1 }}>
          <Title level={5}>转换结果</Title>
          <TextArea
            value={previewResult ? JSON.stringify(previewResult, null, 2) : ''}
            rows={10}
            readOnly
          />
        </div>
      </div>
    </Card>
  );
};

export default MappingPreview;
