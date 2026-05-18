import os

class OffsetIndexer:
    def __init__(self, storage_path: str):
        self.storage_path = storage_path
        self.index = {}  # Store maps as { id: byte_seek_index_position }

    def build_index(self):
        """Scans the storage footprint once to save target index offsets."""
        if not os.path.exists(self.storage_path):
            return
        with open(self.storage_path, "rb") as f:
            position = 0
            for line in f:
                if len(line) >= 4:
                    try:
                        record_id = int(line[0:4].decode("ascii"))
                        self.index[record_id] = position
                    except ValueError:
                        pass
                position += len(line)

    def seek_record(self, record_id: int) -> bytes:
        """Jumps directly to the physical record location instantly: O(1) time."""
        if record_id not in self.index:
            return b""
        with open(self.storage_path, "rb") as f:
            f.seek(self.index[record_id])
            return f.readline().rstrip(b"\r\n")
