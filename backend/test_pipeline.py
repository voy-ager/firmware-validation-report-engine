import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pipeline.parser import parse
from pipeline.enricher import enrich
from pipeline.summarizer import generate_summary
from pipeline.charter import generate_charts
from pipeline.renderer import render

with open("tests/sample_data/intel_uefi_sample.xml", "r") as f:
    content = f.read()

print("Step 1: Parsing...")
parsed = parse(content, "intel_uefi_sample.xml", "SPR-HBM", "2024.47.1")
print(f"  Total tests: {parsed.total_tests} | Passed: {parsed.total_passed} | Failed: {parsed.total_failed}")

print("Step 2: Enriching...")
metrics = enrich(parsed)
print(f"  Risk: {metrics.risk_score} | Pass rate: {metrics.pass_rate}%")

print("Step 3: Summarizing...")
summary = generate_summary(metrics)
print(f"  Mock mode: {summary['mock_mode']}")

print("Step 4: Charting...")
charts = generate_charts(metrics)
print(f"  Charts: {list(charts.keys())}")

print("Step 5: Rendering PDF + Word...")
result = render(
    metrics=metrics,
    summary=summary,
    charts=charts,
    report_meta={
        "report_type": "weekly",
        "engineer_notes": "Reviewed by validation team. PCIe slot 3 issue escalated to FW team.",
        "approved_by": "",
        "approved_at": "",
    }
)
print(f"  PDF: {result['pdf_path']}")
print(f"  Word: {result['docx_path']}")
print("\nFull pipeline complete!")