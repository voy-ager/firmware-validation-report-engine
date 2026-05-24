from collections import defaultdict
from .models import ParsedTestData, EnrichedMetrics


def enrich(parsed: ParsedTestData) -> EnrichedMetrics:
    total = parsed.total_tests
    failed = parsed.total_failed
    passed = parsed.total_passed

    pass_rate = parsed.pass_rate
    fail_rate = round(100 - pass_rate, 2)

    # Risk scoring
    if fail_rate == 0:
        risk_score, risk_color = "low", "green"
    elif fail_rate <= 5:
        risk_score, risk_color = "low", "green"
    elif fail_rate <= 15:
        risk_score, risk_color = "medium", "yellow"
    elif fail_rate <= 30:
        risk_score, risk_color = "high", "orange"
    else:
        risk_score, risk_color = "critical", "red"

    # Top failures — up to 10 most impactful
    failed_tests = parsed.failed_tests
    top_failures = sorted(
        failed_tests,
        key=lambda tc: (tc.failure_type or "", tc.category or ""),
    )[:10]

    # Failure breakdown by category
    failure_by_category = defaultdict(int)
    for tc in failed_tests:
        category = tc.category or "uncategorized"
        failure_by_category[category] += 1

    # Failure breakdown by platform
    failure_by_platform = defaultdict(int)
    for tc in failed_tests:
        plat = tc.platform or "unknown"
        failure_by_platform[plat] += 1

    # Total duration
    total_duration_minutes = round(
        sum(s.duration for s in parsed.suites) / 60, 2
    )

    return EnrichedMetrics(
        parsed=parsed,
        pass_rate=pass_rate,
        fail_rate=fail_rate,
        risk_score=risk_score,
        risk_color=risk_color,
        top_failures=top_failures,
        failure_by_category=dict(failure_by_category),
        failure_by_platform=dict(failure_by_platform),
        total_duration_minutes=total_duration_minutes,
    )