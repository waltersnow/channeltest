from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from ..schemas.channel import ChannelCreate, ChannelUpdate, ChannelResponse
from ..services.channel_service import ChannelService
from ..core.deps import get_db

router = APIRouter(
    prefix="/channels",
    tags=["channels"]
)

@router.post("/", response_model=ChannelResponse)
async def create_channel(
    channel: ChannelCreate,
    db: Session = Depends(get_db)
):
    """创建新的支付渠道"""
    channel_service = ChannelService(db)
    return channel_service.create_channel(channel)

@router.get("/", response_model=List[ChannelResponse])
async def list_channels(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """获取渠道列表"""
    channel_service = ChannelService(db)
    return channel_service.get_channels(skip=skip, limit=limit)

@router.get("/{channel_id}", response_model=ChannelResponse)
async def get_channel(
    channel_id: int,
    db: Session = Depends(get_db)
):
    """获取单个渠道详情"""
    channel_service = ChannelService(db)
    channel = channel_service.get_channel(channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    return channel

@router.post("/{channel_id}/doc")
async def upload_api_doc(
    channel_id: int,
    doc_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """上传并解析渠道API文档"""
    channel_service = ChannelService(db)
    try:
        fields = await channel_service.parse_api_doc(channel_id, doc_file)
        return {"status": "success", "fields": fields}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{channel_id}/mappings")
async def get_channel_mappings(
    channel_id: int,
    db: Session = Depends(get_db)
):
    """获取渠道字段映射"""
    channel_service = ChannelService(db)
    channel = channel_service.get_channel(channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    # 暂时返回空映射，后续实现从数据库获取
    return {"mappings": []}
