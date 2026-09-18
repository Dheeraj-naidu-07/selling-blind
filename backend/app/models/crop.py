from sqlalchemy import Column, Integer, String
from app.database.connection import Base

class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, nullable=True)
    aliases = Column(String, nullable=True)
