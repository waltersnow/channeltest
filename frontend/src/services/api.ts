import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 渠道相关API
export const getChannelList = async (): Promise<any> => {
  const response = await api.get('channels/');
  return response.data;
};

export const createChannel = async (channelData: any): Promise<any> => {
  const response = await api.post('channels/', channelData);
  return response.data;
};

export const getChannelDetail = async (channelId: number): Promise<any> => {
  const response = await api.get(`channels/${channelId}/`);
  return response.data;
};

export const uploadApiDoc = async (channelId: number, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('doc_file', file);
  const response = await api.post(`channels/${channelId}/doc/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 字段映射相关API
export interface FieldMapping {
  key: string;
  channel_field: string;
  internal_field: string;
  transform_rule: any;
  description: string;
  field_type: string;
  is_required: boolean;
}

export const getFieldMappings = async (channelId: number): Promise<FieldMapping[]> => {
  const response = await api.get(`mappings/${channelId}`);
  // 从响应中提取映射数组
  const mappingsData = response.data.mappings || [];
  return mappingsData.map((mapping: any) => {
    let transformRule = null;
    if (mapping.transform_rule) {
      try {
        transformRule = JSON.parse(mapping.transform_rule);
      } catch (error) {
        console.error('Failed to parse transform rule:', mapping.transform_rule, error);
      }
    }

    return {
      key: `mapping_${mapping.id}`,
      channel_field: mapping.channel_field,
      internal_field: mapping.internal_field,
      transform_rule: transformRule,
      description: mapping.description || '',
      field_type: mapping.field_type || 'string',
      is_required: !!mapping.is_required
    };
  });
};

export const updateFieldMappings = async (channelId: number, mappings: FieldMapping[]): Promise<FieldMapping[]> => {
  // 转换数据格式以匹配后端期望的格式
  const formattedMappings = mappings.map(mapping => ({
    channel_id: channelId,
    name: `${mapping.channel_field}_to_${mapping.internal_field}`,
    description: mapping.description || '',
    mapping_rules: {
      channel_field: mapping.channel_field,
      internal_field: mapping.internal_field,
      transform_rule: mapping.transform_rule,
      field_type: mapping.field_type || 'string',
      is_required: mapping.is_required || false
    }
  }));

  await api.post(`mappings/${channelId}`, formattedMappings);
  return getFieldMappings(channelId);  // 重新获取映射以确保数据一致性
};

export const deleteFieldMappings = async (channelId: number): Promise<void> => {
  await api.delete(`mappings/${channelId}/`);
};

// 测试相关API
export interface TestRequest {
  input_data: Record<string, any>;
}

export const testChannelConfig = async (channelId: number, request: TestRequest): Promise<any> => {
  const response = await api.post(`mappings/${channelId}/test/`, request);
  return response.data;
};
