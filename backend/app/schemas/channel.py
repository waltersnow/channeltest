from typing import Optional, Dict, Any
from pydantic import BaseModel

class ChannelBase(BaseModel):
    name: str
    code: str
    api_base_url: str
    description: Optional[str] = None
    status: Optional[str] = "inactive"
    config: Optional[Dict[str, Any]] = None

class ChannelCreate(ChannelBase):
    pass

class ChannelUpdate(ChannelBase):
    name: Optional[str] = None
    code: Optional[str] = None
    api_base_url: Optional[str] = None

class ChannelResponse(ChannelBase):
    id: int

    class Config:
        orm_mode = True
