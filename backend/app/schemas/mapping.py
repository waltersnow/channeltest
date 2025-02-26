from typing import Optional, Dict, Any, List
from pydantic import BaseModel

class MappingBase(BaseModel):
    channel_id: int
    name: str
    description: Optional[str] = None
    mapping_rules: Dict[str, Any]

class MappingCreate(MappingBase):
    pass

class MappingUpdate(MappingBase):
    pass

class FieldMappingResponse(BaseModel):
    id: int
    channel_id: int
    internal_field: str
    channel_field: str
    field_type: Optional[str] = None
    is_required: bool = False
    transform_rule: Optional[str] = None
    description: Optional[str] = None

    class Config:
        orm_mode = True

class MappingResponse(BaseModel):
    mappings: List[FieldMappingResponse]

    class Config:
        orm_mode = True

class TestRequest(BaseModel):
    input_data: Dict[str, Any]
