from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # csv, xml, soap, fixed
    connection_type = Column(String(50), nullable=False)  # api, file
    endpoint = Column(String(255), nullable=True)
    mapping_mode = Column(String(50), default="ai")  # ai, manual
    manual_mapping = Column(Text, nullable=True)  # JSON rules string
    latency = Column(String(50), default="Calculating...")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TransformedRecord(Base):
    __tablename__ = "transformed_records"

    id = Column(Integer, primary_key=True, index=True)
    adapter_type = Column(String(50), nullable=False)
    payload_preview = Column(Text, nullable=False)  # JSON string
    latency_ms = Column(Float, nullable=False)
    cached = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
