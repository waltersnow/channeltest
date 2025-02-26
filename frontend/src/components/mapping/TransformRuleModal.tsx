import React from 'react';
import { Modal, message, Divider } from 'antd';
import TransformRuleConfig from './TransformRuleConfig';
import TransformRuleTester from './TransformRuleTester';

interface TransformRuleModalProps {
  visible: boolean;
  initialRule?: any;
  channelId: number;
  onClose: () => void;
  onSave: (rule: any) => void;
}

const TransformRuleModal: React.FC<TransformRuleModalProps> = ({
  visible,
  initialRule,
  channelId,
  onClose,
  onSave,
}) => {
  const [rule, setRule] = React.useState<any>(initialRule);

  const handleSave = () => {
    if (!rule?.type) {
      message.error('请选择转换规则类型');
      return;
    }

    // 验证必要的参数
    const ruleType = rule.type;
    const params = rule.params || {};

    switch (ruleType) {
      case 'multiply':
        if (!params.value) {
          message.error('请输入倍数值');
          return;
        }
        break;

      case 'jsonpath':
        if (!params.path) {
          message.error('请输入JSON路径');
          return;
        }
        break;

      case 'regex':
        if (!params.pattern) {
          message.error('请输入正则表达式');
          return;
        }
        break;

      case 'enum_map':
        if (!params.mapping || typeof params.mapping !== 'object') {
          message.error('请输入有效的枚举值映射');
          return;
        }
        break;
    }

    onSave(rule);
    onClose();
  };

  return (
    <Modal
      title="配置转换规则"
      open={visible}
      onOk={handleSave}
      onCancel={onClose}
      width={800}
    >
      <TransformRuleConfig
        value={rule}
        onChange={setRule}
      />
      
      {rule?.type && (
        <>
          <Divider />
          <TransformRuleTester 
            channelId={channelId} 
            rule={rule} 
          />
        </>
      )}
    </Modal>
  );
};

export default TransformRuleModal;
