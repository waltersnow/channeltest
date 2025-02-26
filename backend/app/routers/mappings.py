from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..services.transform_service import TransformService, TransformRule
from ..services.validation_service import ValidationService
from ..core.deps import get_db
from ..models.channel import Channel, FieldMapping
from ..schemas.mapping import (
    MappingCreate,
    MappingUpdate,
    FieldMappingResponse,
    TestRequest,
    MappingResponse
)
import json

router = APIRouter(
    prefix="/mappings",
    tags=["mappings"]
)

@router.get("/{channel_id}")
async def get_mappings(
    channel_id: int,
    db: Session = Depends(get_db)
):
    """获取渠道的字段映射配置"""
    try:
        print(f"Received mapping retrieval request for channel {channel_id}")
        mappings = db.query(FieldMapping).filter(
            FieldMapping.channel_id == channel_id
        ).all()
        print(f"Retrieved {len(mappings)} mappings")
        return {"mappings": mappings}
    except Exception as e:
        print(f"Error retrieving mappings: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{channel_id}")
async def create_mappings(
    channel_id: int,
    mappings: List[MappingCreate],
    db: Session = Depends(get_db)
):
    """创建字段映射配置"""
    print(f"Received mapping creation request for channel {channel_id}")
    print(f"Received mappings data: {mappings}")
    
    validation_service = ValidationService()
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        print(f"Channel {channel_id} not found")
        raise HTTPException(status_code=404, detail="Channel not found")

    # 验证映射配置
    validation_result = validation_service.validate_mappings(
        mappings,
        channel.config.get('parsed_fields', [])
    )
    print(f"Validation result: {validation_result}")
    if not validation_result['valid']:
        print(f"Validation failed: {validation_result['errors']}")
        raise HTTPException(
            status_code=400,
            detail={"validation_errors": validation_result['errors']}
        )

    try:
        # 删除现有的映射
        db.query(FieldMapping).filter(FieldMapping.channel_id == channel_id).delete()
        
        # 创建新的映射
        new_mappings = []
        for mapping in mappings:
            rules = mapping.mapping_rules
            # 将转换规则转换为JSON字符串
            transform_rule = json.dumps(rules.get('transform_rule')) if rules.get('transform_rule') else None
            
            new_mapping = FieldMapping(
                channel_id=channel_id,
                channel_field=rules['channel_field'],
                internal_field=rules['internal_field'],
                transform_rule=transform_rule,
                field_type=rules.get('field_type', 'string'),
                is_required=rules.get('is_required', False),
                description=mapping.description or ''
            )
            new_mappings.append(new_mapping)
            
        db.add_all(new_mappings)
        db.commit()
        
        # 刷新以获取新的ID
        for mapping in new_mappings:
            db.refresh(mapping)
            
        return {"mappings": new_mappings}
        
    except Exception as e:
        db.rollback()
        print(f"Error creating mappings: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{channel_id}/test")
async def test_mappings(
    channel_id: int,
    test_request: TestRequest,
    db: Session = Depends(get_db)
):
    """测试字段映射转换"""
    try:
        print(f"Received mapping test request for channel {channel_id}")
        print(f"Received test request data: {test_request}")
        # 转换单个值
        transform_service = TransformService()
        transform_result = transform_service.transform(
            test_request.input_data["value"],
            TransformRule(**test_request.input_data["transform_rule"])
        )
        print(f"Transformation result: {transform_result}")
        return {
            "success": True,
            "result": transform_result.dict()
        }
    except ValueError as e:
        print(f"Transformation error: {str(e)}")
        return {
            "success": False,
            "errors": e.args[0].get('errors', [])
        }
    except Exception as e:
        print(f"Error testing mapping: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{channel_id}/validate")
async def validate_mappings(
    channel_id: int,
    db: Session = Depends(get_db)
):
    """验证字段映射配置"""
    print(f"Received mapping validation request for channel {channel_id}")
    validation_service = ValidationService()
    
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        print(f"Channel {channel_id} not found")
        raise HTTPException(status_code=404, detail="Channel not found")

    mappings = db.query(FieldMapping).filter(
        FieldMapping.channel_id == channel_id
    ).all()

    validation_result = validation_service.validate_mappings(
        [mapping.__dict__ for mapping in mappings],
        channel.config.get('parsed_fields', [])
    )

    print(f"Validation result: {validation_result}")
    return validation_result

@router.delete("/{channel_id}")
async def delete_mappings(
    channel_id: int,
    db: Session = Depends(get_db)
):
    """删除渠道的所有字段映射配置"""
    try:
        print(f"Deleting all mappings for channel {channel_id}")
        db.query(FieldMapping).filter(
            FieldMapping.channel_id == channel_id
        ).delete()
        db.commit()
        print(f"Successfully deleted all mappings for channel {channel_id}")
        return {"message": "所有映射已删除"}
    except Exception as e:
        print(f"Error deleting mappings: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
