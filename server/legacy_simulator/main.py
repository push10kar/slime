"""
Legacy Simulator – intentionally ugly, corrupted, unreliable endpoints.

Simulates:
  GET /legacy/csv/customers     → CSV dump with inconsistent headers
  GET /legacy/xml/customers     → XML with weird tags
  GET /legacy/soap              → POST SOAP service (naive)
  GET /legacy/fixed/customers   → Fixed-width mainframe-style text
  GET /health                   → Health check
"""
import random, csv, io, os
from datetime import datetime, timedelta
from fastapi import FastAPI, Request, Response
from fastapi.responses import PlainTextResponse

FAILURE_RATE = float(os.getenv("FAILURE_RATE", "0.2"))

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Legacy Simulator", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _maybe_fail():
    if random.random() < FAILURE_RATE:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Legacy system unavailable (simulated failure)")


def _corrupt_date(offset_days: int = 0) -> str:
    """Return a weirdly formatted date – simulates legacy date quirks."""
    dt = datetime(1985, 3, 15) + timedelta(days=offset_days * 137)
    formats = ["%d/%m/%y", "%m-%d-%Y", "%Y%m%d", "%d %b %Y"]
    return dt.strftime(random.choice(formats))


CUSTOMER_DATA = [
    {"CUST_ID": f"C{1000+i:04d}", "CUST_NM": name, "ACT_FLG": flag, "BAL": bal, "DOB": _corrupt_date(i)}
    for i, (name, flag, bal) in enumerate([
        ("JOHN SMITH",      "Y", "12500.50"),
        ("JANE DOE",        "N", "0.00"),
        ("BOB JOHNSON",     "Y", "88430.12"),
        ("ALICE BROWN",     "Y", "3300.75"),
        ("CHARLIE WILSON",  "N", "999999.99"),
    ])
]


# ── CSV endpoint ──────────────────────────────────────────────────────────────
@app.get("/legacy/csv/{endpoint}")
def get_csv(endpoint: str):
    _maybe_fail()
    output = io.StringIO()
    # Intentionally inconsistent headers on random calls
    headers = list(CUSTOMER_DATA[0].keys())
    if random.random() < 0.3:
        headers = [h.lower() for h in headers]  # randomly lowercase
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()
    for row in CUSTOMER_DATA:
        # Randomly corrupt a balance value
        corrupted = dict(row)
        if random.random() < 0.15:
            corrupted["BAL"] = "N/A"
        writer.writerow({h: corrupted.get(h.upper(), corrupted.get(h, "")) for h in headers})
    return PlainTextResponse(output.getvalue(), media_type="text/csv")


# ── XML endpoint ──────────────────────────────────────────────────────────────
@app.get("/legacy/xml/{endpoint}")
def get_xml(endpoint: str):
    _maybe_fail()
    rows = "\n".join(
        f"""  <record>
    <CUST_ID>{r['CUST_ID']}</CUST_ID>
    <CUST_NM>{r['CUST_NM']}</CUST_NM>
    <ACT_FLG>{r['ACT_FLG']}</ACT_FLG>
    <BAL>{r['BAL']}</BAL>
    <DOB>{r['DOB']}</DOB>
  </record>"""
        for r in CUSTOMER_DATA
    )
    xml = f"<?xml version='1.0'?>\n<dataset>\n{rows}\n</dataset>"
    return Response(content=xml, media_type="application/xml")


# ── SOAP endpoint ─────────────────────────────────────────────────────────────
@app.post("/legacy/soap")
async def get_soap(request: Request):
    _maybe_fail()
    r = random.choice(CUSTOMER_DATA)
    body = f"""<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetDataResponse>
      <CUST_ID>{r['CUST_ID']}</CUST_ID>
      <CUST_NM>{r['CUST_NM']}</CUST_NM>
      <ACT_FLG>{r['ACT_FLG']}</ACT_FLG>
      <BAL>{r['BAL']}</BAL>
    </GetDataResponse>
  </soap:Body>
</soap:Envelope>"""
    return Response(content=body, media_type="text/xml")


# ── Fixed-width endpoint ──────────────────────────────────────────────────────
@app.get("/legacy/fixed/{endpoint}")
def get_fixed(endpoint: str):
    _maybe_fail()
    lines = []
    for r in CUSTOMER_DATA:
        line = (
            f"{r['CUST_ID']:<10}"
            f"{r['CUST_NM'].split()[0]:<15}"
            f"{r['CUST_NM'].split()[-1]:<15}"
            f"{r['DOB'][:8]:<8}"
            f"{r['BAL']:>12}"
            f"{r['ACT_FLG']:<1}"
        )
        lines.append(line)
    return PlainTextResponse("\n".join(lines), media_type="text/plain")


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "legacy_simulator"}
