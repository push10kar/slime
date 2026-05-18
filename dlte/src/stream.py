import os
from typing import Generator, Dict, Any
from .engine import CopybookEngine

class StreamProcessor:
    def __init__(self, engine: CopybookEngine, storage_path: str, dlq_path: str):
        self.engine = engine
        self.storage_path = storage_path
        self.dlq_path = dlq_path

    def stream_records(self) -> Generator[Dict[str, Any], None, None]:
        """Lazy generator reading lines sequentially without memory degradation."""
        if not os.path.exists(self.storage_path):
            return

        with open(self.storage_path, "rb") as f:
            line_num = 0
            for line in f:
                line_num += 1
                clean_line = line.rstrip(b"\r\n")
                if not clean_line:
                    continue
                try:
                    yield self.engine.bytes_to_json(clean_line)
                except Exception as err:
                    # Isolate corrupted line to the Dead Letter Queue
                    os.makedirs(os.path.dirname(self.dlq_path), exist_ok=True)
                    with open(self.dlq_path, "a") as dlq:
                        dlq.write(f"Line {line_num} Fault | Data: {line.hex()} | Reason: {str(err)}\n")
                    continue
