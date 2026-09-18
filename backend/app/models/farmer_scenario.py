from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database.connection import Base

class FarmerScenario(Base):
    __tablename__ = "farmer_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    current_offered_price = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
