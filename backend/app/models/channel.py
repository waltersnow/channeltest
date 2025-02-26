from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Channel(Base):
    __tablename__ = "channels"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    api_base_url = Column(String(200))
    status = Column(String(20), default="inactive")
    config = Column(JSON)
    description = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    mappings = relationship("FieldMapping", back_populates="channel")

class FieldMapping(Base):
    __tablename__ = "field_mappings"
    
    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("channels.id"))
    internal_field = Column(String(100))
    channel_field = Column(String(100))
    field_type = Column(String(50))
    is_required = Column(Boolean, default=False)
    transform_rule = Column(String(200))
    description = Column(String(500))
    
    channel = relationship("Channel", back_populates="mappings")
