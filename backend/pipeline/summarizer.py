from .models import EnrichedMetrics
from pydantic_settings import BaseSettings
import os


class _SummarizerSettings(BaseSettings):
    anthropic_api_key: str = ""

    @property
    def llm_mock_mode(self) -> bool:
        return not self.anthropic_api_key

    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "../.env")
        case_sensitive = False
        extra = "ignore"

settings = _SummarizerSettings()

def generate_summary(metrics: EnrichedMetrics) -> dict:
    if settings.llm_mock_mode:
        return _mock_summary(metrics)
    return _llm_summary(metrics)


def _mock_summary(metrics: EnrichedMetrics) -> dict:
    parsed = metrics.parsed
    risk = metrics.risk_score.upper()

    executive_summary = (
        f"Validation cycle for platform {parsed.platform} (Build {parsed.build_id}) "
        f"completed with a pass rate of {metrics.pass_rate}% across {parsed.total_tests} test cases. "
        f"{parsed.total_failed} test(s) failed, resulting in a {risk} risk classification. "
        f"Total execution time was {metrics.total_duration_minutes} minutes. "
        f"Immediate attention is recommended for the {len(metrics.top_failures)} highest-priority failures "
        f"identified in this report."
    )

    if metrics.risk_score == "low":
        risk_assessment = (
            f"Risk assessment: LOW. The platform demonstrates strong stability with "
            f"{metrics.pass_rate}% of tests passing. No blocking issues identified. "
            f"This build is a candidate for promotion to the next validation stage."
        )
    elif metrics.risk_score == "medium":
        risk_assessment = (
            f"Risk assessment: MEDIUM. {metrics.fail_rate}% failure rate warrants investigation "
            f"before proceeding. Failures are concentrated in "
            f"{', '.join(list(metrics.failure_by_category.keys())[:3])} categories. "
            f"Root cause analysis recommended prior to next build cycle."
        )
    elif metrics.risk_score == "high":
        risk_assessment = (
            f"Risk assessment: HIGH. {parsed.total_failed} failures detected with a "
            f"{metrics.fail_rate}% failure rate. This build should NOT be promoted. "
            f"Critical failures require immediate triage by the validation team."
        )
    else:
        risk_assessment = (
            f"Risk assessment: CRITICAL. Failure rate of {metrics.fail_rate}% exceeds "
            f"acceptable thresholds. Build {parsed.build_id} is blocked. "
            f"All active development should pause until root cause is identified and resolved."
        )

    return {
        "executive_summary": executive_summary,
        "risk_assessment": risk_assessment,
        "ai_generated": True,
        "mock_mode": True,
    }


def _llm_summary(metrics: EnrichedMetrics) -> dict:
    import anthropic

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    parsed = metrics.parsed

    prompt = f"""You are a senior firmware validation engineer writing an executive summary for an Intel platform validation report.

Platform: {parsed.platform}
Build ID: {parsed.build_id}
Total Tests: {parsed.total_tests}
Passed: {parsed.total_passed}
Failed: {parsed.total_failed}
Skipped: {parsed.total_skipped}
Pass Rate: {metrics.pass_rate}%
Risk Score: {metrics.risk_score}
Duration: {metrics.total_duration_minutes} minutes
Top Failure Categories: {list(metrics.failure_by_category.keys())[:5]}
Top Failures: {[f.name for f in metrics.top_failures[:5]]}

Write two sections:
1. EXECUTIVE_SUMMARY: 3-4 sentences. Professional, factual, suitable for Intel program managers.
2. RISK_ASSESSMENT: 2-3 sentences. Clear risk level, what it means, recommended action.

Respond in this exact format:
EXECUTIVE_SUMMARY: <text>
RISK_ASSESSMENT: <text>"""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text
    lines = response_text.strip().split("\n")

    executive_summary = ""
    risk_assessment = ""

    for line in lines:
        if line.startswith("EXECUTIVE_SUMMARY:"):
            executive_summary = line.replace("EXECUTIVE_SUMMARY:", "").strip()
        elif line.startswith("RISK_ASSESSMENT:"):
            risk_assessment = line.replace("RISK_ASSESSMENT:", "").strip()

    return {
        "executive_summary": executive_summary or "Summary generation failed.",
        "risk_assessment": risk_assessment or "Risk assessment generation failed.",
        "ai_generated": True,
        "mock_mode": False,
    }