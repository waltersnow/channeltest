import React from 'react';
import { Modal, Form, Input, message } from 'antd';
import { createChannel } from '../../services/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateChannelModal: React.FC<Props> = ({ visible, onClose, onSuccess }) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await createChannel(values);
      message.success('渠道创建成功');
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      message.error('渠道创建失败');
    }
  };

  return (
    <Modal
      title="新增渠道"
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="name"
          label="渠道名称"
          rules={[{ required: true, message: '请输入渠道名称' }]}
        >
          <Input placeholder="请输入渠道名称" />
        </Form.Item>
        
        <Form.Item
          name="code"
          label="渠道代码"
          rules={[{ required: true, message: '请输入渠道代码' }]}
        >
          <Input placeholder="请输入渠道代码" />
        </Form.Item>

        <Form.Item
          name="api_base_url"
          label="接口地址"
          rules={[{ required: true, message: '请输入接口地址' }]}
        >
          <Input placeholder="请输入接口地址" />
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
        >
          <Input.TextArea placeholder="请输入渠道描述" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateChannelModal;
