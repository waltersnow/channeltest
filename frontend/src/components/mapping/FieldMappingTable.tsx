import React, { useState, useEffect, useCallback } from 'react';
import { Table, Select, Input, Button, Popconfirm, Form, Tag, Tooltip, Space, message } from 'antd';
import { DeleteOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import TransformRuleModal from './TransformRuleModal';

const { Option } = Select;

interface FieldMappingTableProps {
  channelId: number;
  channelFields: any[];
  mappings: any[];
  onChange: (mappings: any[]) => void;
  onSave?: (mappings: any[]) => void;
}

// 内部字段列表（示例）
const INTERNAL_FIELDS = [
  { name: 'order_id', type: 'string', description: '订单号' },
  { name: 'amount', type: 'number', description: '金额' },
  { name: 'currency', type: 'string', description: '币种' },
  { name: 'status', type: 'string', description: '状态' },
  { name: 'created_time', type: 'datetime', description: '创建时间' },
];

const FieldMappingTable: React.FC<FieldMappingTableProps> = ({
  channelId,
  channelFields = [],
  mappings = [],
  onChange,
  onSave,
}) => {
  console.log('FieldMappingTable rendered with props:', {
    channelId,
    channelFieldsCount: channelFields.length,
    mappingsCount: mappings.length,
    hasOnChange: !!onChange,
    hasOnSave: !!onSave
  });

  const [form] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');
  const [transformModalVisible, setTransformModalVisible] = useState(false);
  const [currentMapping, setCurrentMapping] = useState<any>(null);
  const [tableData, setTableData] = useState<any[]>([]);

  useEffect(() => {
    console.log('Processing mappings in useEffect:', mappings);
    // 确保数据是数组并且每个项都有唯一的 key
    const processedData = (Array.isArray(mappings) ? mappings : []).map((mapping, index) => ({
      ...mapping,
      key: mapping.key || `mapping_${index}_${Date.now()}`
    }));
    // 不再过滤空的映射，因为我们需要显示新添加的空映射
    console.log('Setting table data with processed data:', processedData);
    setTableData(processedData);
  }, [mappings]);

  const isEditing = useCallback((record: any) => {
    const result = record.key === editingKey;
    console.log('Checking edit status for record:', { recordKey: record.key, editingKey, isEditing: result });
    return result;
  }, [editingKey]);

  const edit = useCallback((record: any) => {
    console.log('Editing mapping:', record);
    form.setFieldsValue({ ...record });
    setEditingKey(record.key);
  }, [form]);

  const cancel = useCallback(() => {
    console.log('Cancel editing');
    setEditingKey('');
  }, []);

  const handleAdd = useCallback(() => {
    console.log('Add button clicked');
    const newKey = `new_mapping_${Date.now()}`;
    const newMapping = {
      key: newKey,
      channel_id: channelId,
      channel_field: '',
      internal_field: '',
      transform_rule: null,
      description: '',
      field_type: 'string',
      is_required: false
    };
    console.log('Created new mapping:', newMapping);
    
    // 直接更新tableData和调用onChange
    const newData = [...tableData, newMapping];
    console.log('Setting new table data:', newData);
    setTableData(newData);
    onChange(newData);
    
    // 立即设置编辑状态
    console.log('Setting editing key:', newKey);
    setEditingKey(newKey);
    form.setFieldsValue(newMapping);
  }, [channelId, form, onChange, tableData]);

  const save = useCallback(async (key: string) => {
    try {
      console.log('Saving mapping with key:', key);
      const row = await form.validateFields();
      console.log('Validated form fields:', row);
      
      const newData = [...tableData];
      const index = newData.findIndex(item => key === item.key);
      console.log('Found index for key:', index);
      
      if (index > -1) {
        const item = newData[index];
        // 如果字段为空，不保存
        if (!row.channel_field || !row.internal_field) {
          console.log('Empty fields detected, showing error');
          message.error('渠道字段和内部字段都不能为空');
          return;
        }
        const updatedItem = {
          ...item,
          ...row,
        };
        console.log('Updated item:', updatedItem);
        newData.splice(index, 1, updatedItem);
        console.log('New data after update:', newData);
        setTableData(newData);
        setEditingKey('');
        onChange(newData);
        if (onSave) {
          console.log('Calling onSave');
          await onSave(newData);
        }
      }
    } catch (errInfo: any) {
      console.error('Save failed:', errInfo);
      message.error('保存失败：' + (errInfo.message || '未知错误'));
    }
  }, [form, tableData, onChange, onSave]);

  const handleDelete = useCallback((key: string) => {
    try {
      console.log('Deleting mapping with key:', key);
      const newData = tableData.filter(item => item.key !== key);
      console.log('New data after delete:', newData);
      setTableData(newData);
      onChange(newData);
      message.success('删除成功');
    } catch (error) {
      console.error('Delete failed:', error);
      message.error('删除失败');
    }
  }, [tableData, onChange]);

  const handleTransformRuleClick = useCallback((record: any) => {
    console.log('Transform rule clicked:', record);
    setCurrentMapping(record);
    setTransformModalVisible(true);
  }, []);

  const handleTransformRuleSave = useCallback((rule: any) => {
    if (!currentMapping) return;
    
    console.log('Saving transform rule:', rule);
    const newData = [...tableData];
    const index = newData.findIndex(item => item.key === currentMapping.key);
    if (index > -1) {
      newData[index] = {
        ...newData[index],
        transform_rule: rule
      };
      console.log('New data after transform rule update:', newData);
      setTableData(newData);
      onChange(newData);
    }
    setTransformModalVisible(false);
    setCurrentMapping(null);
  }, [currentMapping, tableData, onChange]);

  const renderTransformRuleCell = useCallback((rule: any) => {
    if (!rule) return <Tag>无</Tag>;
    
    try {
      if (typeof rule === 'string') {
        rule = JSON.parse(rule);
      }
      
      switch (rule.type) {
        case 'multiply':
          return <Tag color="blue">乘以 {rule.value}</Tag>;
        case 'jsonpath':
          return <Tag color="green">JSONPath: {rule.path}</Tag>;
        case 'regex':
          return <Tag color="orange">正则: {rule.pattern}</Tag>;
        case 'enum':
          return <Tag color="purple">枚举映射</Tag>;
        default:
          return <Tag>未知规则</Tag>;
      }
    } catch (e) {
      return <Tag color="red">规则格式错误</Tag>;
    }
  }, []);

  const columns = [
    {
      title: '渠道字段',
      dataIndex: 'channel_field',
      key: 'channel_field',
      render: (_: any, record: any) => {
        const isEditMode = isEditing(record);
        console.log('Rendering channel_field cell:', { recordKey: record.key, isEditMode });
        return isEditMode ? (
          <Form.Item
            name="channel_field"
            style={{ margin: 0 }}
            rules={[{ required: true, message: '请选择渠道字段' }]}
          >
            <Select>
              {channelFields.map((field: any, index: number) => (
                <Option key={`channel_${field.name}_${index}`} value={field.name}>
                  {field.name} ({field.description || field.type})
                </Option>
              ))}
            </Select>
          </Form.Item>
        ) : (
          record.channel_field
        );
      },
    },
    {
      title: '内部字段',
      dataIndex: 'internal_field',
      key: 'internal_field',
      render: (_: any, record: any) => {
        const isEditMode = isEditing(record);
        console.log('Rendering internal_field cell:', { recordKey: record.key, isEditMode });
        return isEditMode ? (
          <Form.Item
            name="internal_field"
            style={{ margin: 0 }}
            rules={[{ required: true, message: '请选择内部字段' }]}
          >
            <Select>
              {INTERNAL_FIELDS.map((field: any, index: number) => (
                <Option key={`internal_${field.name}_${index}`} value={field.name}>
                  {field.name} ({field.description})
                </Option>
              ))}
            </Select>
          </Form.Item>
        ) : (
          record.internal_field
        );
      },
    },
    {
      title: '转换规则',
      dataIndex: 'transform_rule',
      key: 'transform_rule',
      render: (rule: any, record: any) => {
        console.log('Rendering transform_rule cell:', { recordKey: record.key, rule });
        return (
          <Space>
            {renderTransformRuleCell(rule)}
            <Button
              type="link"
              icon={<SettingOutlined />}
              onClick={() => handleTransformRuleClick(record)}
            />
          </Space>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => {
        const isEditMode = isEditing(record);
        console.log('Rendering action cell:', { recordKey: record.key, isEditMode });
        return isEditMode ? (
          <Space>
            <Button type="link" onClick={() => save(record.key)}>
              保存
            </Button>
            <Button type="link" onClick={cancel}>
              取消
            </Button>
          </Space>
        ) : (
          <Space>
            <Button type="link" disabled={editingKey !== ''} onClick={() => edit(record)}>
              编辑
            </Button>
            <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.key)}>
              <Button type="link" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Form form={form}>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAdd}
        style={{ marginBottom: 16 }}
        disabled={editingKey !== ''}
      >
        添加映射
      </Button>
      <Table
        components={{
          body: {
            cell: (props: any) => (
              <td {...props} style={{ verticalAlign: 'top', ...props.style }} />
            ),
          },
        }}
        columns={columns}
        dataSource={tableData}
        pagination={false}
        rowClassName={(record) => {
          console.log('Row class for record:', { recordKey: record.key, editingKey, isEditing: record.key === editingKey });
          return record.key === editingKey ? 'editable-row editing' : 'editable-row';
        }}
        onRow={(record) => ({
          onClick: () => {
            console.log('Row clicked:', record);
          }
        })}
      />
      <TransformRuleModal
        visible={transformModalVisible}
        onClose={() => setTransformModalVisible(false)}
        onSave={handleTransformRuleSave}
        initialRule={currentMapping?.transform_rule}
        channelId={channelId}
      />
    </Form>
  );
};

export default FieldMappingTable;
