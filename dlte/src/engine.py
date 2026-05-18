import yaml
from typing import Dict, Any

class CopybookEngine:
    def __init__(self, config_path: str):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)
        self.fields = self.config["fields"]
        self.total_bytes = self.config["meta"]["record_total_bytes"]

    def bytes_to_json(self, raw_bytes: bytes) -> Dict[str, Any]:
        """Slices a raw legacy byte block into a typed python dictionary."""
        record = {}
        decoded_line = raw_bytes.decode("ascii")
        
        for field_name, rules in self.fields.items():
            start = rules["start"]
            end = start + rules["length"]
            raw_val = decoded_line[start:end]

            if rules["type"] == "int":
                record[field_name] = int(raw_val)
            elif rules["type"] == "decimal":
                scale = rules.get("scale", 0)
                record[field_name] = float(raw_val) / (10 ** scale)
            else:
                record[field_name] = raw_val.strip()
                
        return record

    def json_to_bytes(self, json_data: Dict[str, Any]) -> bytes:
        """Serializes clean application payloads back to mainframe fixed-width text rows."""
        output_buffer = [""] * self.total_bytes
        
        for field_name, rules in self.fields.items():
            start = rules["start"]
            length = rules["length"]
            pad_char = rules["pad_char"]
            
            val = json_data.get(field_name)
            if rules["type"] == "decimal":
                scale = rules.get("scale", 0)
                val_str = str(int(round(val * (10 ** scale))))
            else:
                val_str = str(val)

            if len(val_str) > length:
                if rules["type"] == "string":
                    val_str = val_str[:length]  # Safe truncation boundary
                else:
                    raise ValueError(f"Numeric overflow on field: {field_name}")
            
            if rules["padding"] == "left":
                val_str = val_str.rjust(length, pad_char)
            else:
                val_str = val_str.ljust(length, pad_char)
                
            for i, char in enumerate(val_str):
                output_buffer[start + i] = char
                
        return "".join(output_buffer).encode("ascii")
