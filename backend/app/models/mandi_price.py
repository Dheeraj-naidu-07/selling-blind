from sqlalchemy import Column, Integer, Float, Date, String, ForeignKey, Index
from app.database.connection import Base

class MandiPrice(Base):
    __tablename__ = "mandi_prices"

    id = Column(Integer, primary_key=True, index=True)
    mandi_id = Column(Integer, ForeignKey("mandis.id"), index=True, nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.id"), index=True, nullable=False)
    date = Column(Date, index=True, nullable=False)
    min_price = Column(Float, nullable=False)
    max_price = Column(Float, nullable=False)
    modal_price = Column(Float, nullable=False)
    arrival_quantity = Column(Float, nullable=True)
    source = Column(String, default="AgMarkNet")

Index("idx_crop_mandi_date", MandiPrice.crop_id, MandiPrice.mandi_id, MandiPrice.date)
