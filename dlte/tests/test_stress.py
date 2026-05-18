import pytest
import psutil
import os
from src.engine import CopybookEngine
from src.stream import StreamProcessor

def test_memory_profile():
    process = psutil.Process(os.getpid())
    initial_memory = process.memory_info().rss
    
    engine = CopybookEngine("config/copybook_v1.yaml")
    processor = StreamProcessor(engine, "storage/legacy_db.dat", "storage/quarantine.log")
    
    # Enforce streaming exhaustion test
    records = list(processor.stream_records())
    
    final_memory = process.memory_info().rss
    memory_growth_mb = (final_memory - initial_memory) / (1024 * 1024)
    
    # Assert system scaling memory overhead constraints remain flat
    assert memory_growth_mb < 50.0
