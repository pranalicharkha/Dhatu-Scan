from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from database import Base

def generate_uuid():
    return uuid.uuid4().hex

class Parent(Base):
    __tablename__ = "parents"
    id = Column(String(32), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    
    children = relationship("Child", back_populates="parent")
    streak = relationship("Streak", back_populates="parent", uselist=False)

class Child(Base):
    __tablename__ = "children"
    child_id = Column(String(32), primary_key=True, default=generate_uuid)
    parent_email = Column(String(255), ForeignKey("parents.email"), nullable=False)
    child_name = Column(String(255), nullable=False)
    dob = Column(String(50), nullable=False) # Store YYYY-MM-DD
    gender = Column(String(20), nullable=False)
    
    parent = relationship("Parent", back_populates="children")
    growth_entries = relationship("GrowthEntry", back_populates="child")
    assessments = relationship("Assessment", back_populates="child")

class GrowthEntry(Base):
    __tablename__ = "growth_entries"
    id = Column(String(32), primary_key=True, default=generate_uuid)
    child_id = Column(String(32), ForeignKey("children.child_id"), nullable=False)
    height = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    z_score = Column(Float, nullable=False)
    who_status = Column(String(50), nullable=False)
    muac_estimate = Column(Float, nullable=True) # Optional visual muac
    fusion_score = Column(Float, nullable=True)
    wasting_score = Column(Float, nullable=True)
    dietary_score = Column(Float, nullable=True)
    risk_level = Column(String(50), nullable=True)
    image_url = Column(String(500), nullable=True) # Cloud linked image URL
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    child = relationship("Child", back_populates="growth_entries")

class Assessment(Base):
    __tablename__ = "assessments"
    id = Column(String(32), primary_key=True, default=generate_uuid)
    child_id = Column(String(32), ForeignKey("children.child_id"), nullable=False)
    water_source = Column(String(50), nullable=False)
    dietary_risk_preview = Column(String(100), nullable=True)
    lifestyle_details = Column(String(1000), nullable=True) # JSON ideally, storing as str for sqlite ease
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    child = relationship("Child", back_populates="assessments")

class Streak(Base):
    __tablename__ = "streaks"
    id = Column(String(32), primary_key=True, default=generate_uuid)
    parent_email = Column(String(255), ForeignKey("parents.email"), nullable=False, unique=True)
    streak_count = Column(Integer, default=0)
    last_login = Column(DateTime, nullable=True)
    total_scans = Column(Integer, default=0)
    
    parent = relationship("Parent", back_populates="streak")
