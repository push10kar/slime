# 📊 Slime AI — Demo Datasets

These test datasets are designed to showcase the power of the **Slime AI Modernization Gateway** during your live demo. They contain real-world legacy mainframe "data chaos" (messy formatting, inconsistent booleans, and cryptic headers).

---

## Dataset 1: Messy Customer Records (CSV)

* **File**: `demo_customers_legacy.csv`
* **Legacy Chaos Elements**:
  * Space-padded keys and values (e.g. `"100234 "`, `"Alice M. Smith  "`).
  * Cryptic column headers: `CUST_ID`, `FULL_NAME_VAL`, `IS_ACTIVE_YN`, `CURRENT_BAL`, `BIRTH_DT`.
  * Mixed booleans: `"Y"`, `"N"`, `"1"`, `"0"`.
  * Legacy date format: `19880523` (instead of standard ISO-8601).

### How to use in the Demo:
1. Navigate to the **Transformation Pipeline** tab.
2. Toggle **AI Schema Mapping** to **ON** (active purple glow).
3. Click **Upload File** and select `demo_data/demo_customers_legacy.csv`.
4. **The "Wow" Moment**: Watch the raw chaos on the left instantly transformed on the right into a beautiful, standardized JSON structure:
   * Keys are auto-camelCased (e.g., `customerId`, `customerName`, `isActive`, `balance`, `dateOfBirth`).
   * Spacing is trimmed.
   * Dates are converted to standard format.
   * Booleans are unified into true/false!

---

## Dataset 2: Mainframe Batch Transactions (XML)

* **File**: `demo_transactions_legacy.xml`
* **Legacy Chaos Elements**:
  * Capitalized tag nodes: `<TXN_REC>`, `<TX_ID>`, `<AMT_VAL>`, `<STATUS_CD>`.
  * Encoded status keys: `CMP` (Completed), `PEN` (Pending), `ERR` (Error).
  * Unix timestamp formats.

### How to use in the Demo:
1. Navigate to the **Legacy Adapters** tab.
2. Click **Add Source**.
3. Set **Source Type** to **XML**.
4. Set **Ingestion Method** to **File Ingest**.
5. Upload `demo_data/demo_transactions_legacy.xml` and click **Validate Payload**.
6. Select **AI Handles It** and click **Activate Source** to onboard it into the active running adapter list!

---

## Dataset 3: Bank Fixed-Width Core Dump (Plain Text)

* **File**: `demo_mainframe_fixed_width.txt`
* **Legacy Chaos Elements**:
  * Un-delimited columns (strictly positional layout).
  * Mainframe padded numbers (e.g., `0001540075` → `$15,400.75`).
