from typing import Any, Dict, Optional
from pydantic import BaseModel

class TransformRule(BaseModel):
    type: str
    params: Optional[Dict[str, Any]] = None

class TransformRequest(BaseModel):
    value: Any
    rule: TransformRule

class TransformResponse(BaseModel):
    original_value: Any
    transformed_value: Any
    rule: TransformRule

    class Config:
        orm_mode = True
