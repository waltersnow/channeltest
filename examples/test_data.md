# 支付渠道测试数据

## 1. 创建渠道
渠道信息：
```json
{
  "name": "支付宝",
  "code": "alipay",
  "base_url": "https://openapi.alipay.com/gateway.do",
  "description": "支付宝支付服务"
}
```

## 2. 字段映射测试数据

### 2.1 金额转换（乘法规则）
输入值：
```json
"9.99"
```
转换规则：
```json
{
  "type": "multiply",
  "params": {
    "value": 100
  }
}
```
预期结果：999（转换为分）

### 2.2 日期时间转换
输入值：
```
"2023-12-25 10:30:45"
```
转换规则：
```json
{
  "type": "datetime",
  "params": {
    "format": "%Y%m%d%H%M%S"
  }
}
```
预期结果：`"20231225103045"`

### 2.3 JSON提取（jsonpath）
输入值：
```json
{
  "alipay_trade_query_response": {
    "code": "10000",
    "msg": "Success",
    "trade_no": "2023122522001476751412345678",
    "out_trade_no": "TEST20231225001",
    "trade_status": "TRADE_SUCCESS",
    "total_amount": "9.99",
    "gmt_create": "2023-12-25 10:30:45",
    "gmt_payment": "2023-12-25 10:31:00"
  },
  "sign": "XXXXXXXX"
}
```
转换规则：
```json
{
  "type": "jsonpath",
  "params": {
    "path": "$.alipay_trade_query_response.trade_status"
  }
}
```
预期结果：`"TRADE_SUCCESS"`

### 2.4 状态码映射（enum_map）
输入值：
```
"TRADE_SUCCESS"
```
转换规则：
```json
{
  "type": "enum_map",
  "params": {
    "mapping": {
      "WAIT_BUYER_PAY": "PENDING",
      "TRADE_CLOSED": "CLOSED",
      "TRADE_SUCCESS": "SUCCESS",
      "TRADE_FINISHED": "FINISHED"
    }
  }
}
```
预期结果：`"SUCCESS"`

## 3. 完整的字段映射配置

### 支付请求映射
```json
[
  {
    "channel_field": "outTradeNo",
    "internal_field": "order_id",
    "description": "订单号"
  },
  {
    "channel_field": "totalAmount",
    "internal_field": "amount",
    "description": "订单金额",
    "transform_rule": {
      "type": "multiply",
      "params": {
        "value": 100
      }
    }
  },
  {
    "channel_field": "subject",
    "internal_field": "title",
    "description": "订单标题"
  },
  {
    "channel_field": "timestamp",
    "internal_field": "created_time",
    "description": "创建时间",
    "transform_rule": {
      "type": "datetime",
      "params": {
        "format": "%Y%m%d%H%M%S"
      }
    }
  }
]
```

### 查询响应映射
```json
[
  {
    "channel_field": "$.alipay_trade_query_response.trade_no",
    "internal_field": "channel_trade_id",
    "description": "渠道交易号",
    "transform_rule": {
      "type": "jsonpath",
      "params": {
        "path": "$.alipay_trade_query_response.trade_no"
      }
    }
  },
  {
    "channel_field": "$.alipay_trade_query_response.trade_status",
    "internal_field": "status",
    "description": "交易状态",
    "transform_rule": {
      "type": "enum_map",
      "params": {
        "mapping": {
          "WAIT_BUYER_PAY": "PENDING",
          "TRADE_CLOSED": "CLOSED",
          "TRADE_SUCCESS": "SUCCESS",
          "TRADE_FINISHED": "FINISHED"
        }
      }
    }
  }
]
```
