"""Tests for the field normalizer."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../server/api_gateway"))

from app.middleware.transformers.normalizer import normalize_record, normalize_key, normalize_value


def test_known_legacy_key_mapping():
    assert normalize_key("CUST_NM") == "customerName"
    assert normalize_key("ACT_FLG") == "isActive"
    assert normalize_key("BAL") == "balance"


def test_unknown_key_camel_case():
    assert normalize_key("some_field") == "someField"
    assert normalize_key("UNKNOWN_KEY") == "unknownKey"


def test_value_coercion_boolean():
    assert normalize_value("Y") is True
    assert normalize_value("N") is False
    assert normalize_value("1") is True
    assert normalize_value("0") is False


def test_value_coercion_numeric():
    assert normalize_value("42") == 42
    assert normalize_value("3.14") == 3.14


def test_normalize_record():
    raw = {"CUST_NM": "JOHN SMITH", "ACT_FLG": "Y", "BAL": "12500.50"}
    result = normalize_record(raw)
    assert result["customerName"] == "JOHN SMITH"
    assert result["isActive"] is True
    assert result["balance"] == 12500.50
