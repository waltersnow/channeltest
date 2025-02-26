from sqlalchemy.orm import Session
from fastapi import UploadFile
from ..models.channel import Channel, FieldMapping
from ..schemas.channel import ChannelCreate
from ..services.doc_parser import APIDocumentParser
import json

class ChannelService:
    def __init__(self, db: Session):
        self.db = db
        self.doc_parser = APIDocumentParser()

    def create_channel(self, channel: ChannelCreate) -> Channel:
        """创建新的支付渠道"""
        db_channel = Channel(
            name=channel.name,
            code=channel.code,
            api_base_url=channel.api_base_url,
            description=channel.description,
            status=channel.status,
            config=channel.config
        )
        self.db.add(db_channel)
        self.db.commit()
        self.db.refresh(db_channel)
        return db_channel

    def get_channels(self, skip: int = 0, limit: int = 100):
        """获取渠道列表"""
        return self.db.query(Channel).offset(skip).limit(limit).all()

    def get_channel(self, channel_id: int) -> Channel:
        """获取单个渠道"""
        return self.db.query(Channel).filter(Channel.id == channel_id).first()

    async def parse_api_doc(self, channel_id: int, doc_file: UploadFile):
        """解析API文档"""
        # 确保渠道存在
        channel = self.get_channel(channel_id)
        if not channel:
            raise ValueError("Channel not found")

        # 读取文件内容
        content = await doc_file.read()
        try:
            doc_content = json.loads(content)
        except json.JSONDecodeError:
            raise ValueError("Invalid API document format")
        
        # 解析文档
        fields = self.doc_parser.parse(doc_content)
        
        # 保存解析结果
        channel.config = {
            "parsed_fields": fields,
            "doc_type": doc_file.content_type
        }
        
        self.db.commit()
        return fields
