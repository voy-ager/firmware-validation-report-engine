from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime


@dataclass
class TestCase:
    name: str
    classname: str
    status: str  # "passed", "failed", "skipped", "error"
    duration: float
    failure_message: Optional[str] = None
    failure_type: Optional[str] = None
    platform: Optional[str] = None
    category: Optional[str] = None


@dataclass
class TestSuite:
    name: str
    total: int
    passed: int
    failed: int
    skipped: int
    errors: int
    duration: float
    timestamp: Optional[str] = None
    test_cases: List[TestCase] = field(default_factory=list)


@dataclass
class ParsedTestData:
    source_format: str  # "junit_xml", "pytest_json", "csv"
    platform: str
    build_id: str
    suites: List[TestSuite] = field(default_factory=list)

    @property
    def total_tests(self) -> int:
        return sum(s.total for s in self.suites)

    @property
    def total_passed(self) -> int:
        return sum(s.passed for s in self.suites)

    @property
    def total_failed(self) -> int:
        return sum(s.failed for s in self.suites)

    @property
    def total_skipped(self) -> int:
        return sum(s.skipped for s in self.suites)

    @property
    def pass_rate(self) -> float:
        if self.total_tests == 0:
            return 0.0
        return round((self.total_passed / self.total_tests) * 100, 2)

    @property
    def all_test_cases(self) -> List[TestCase]:
        return [tc for suite in self.suites for tc in suite.test_cases]

    @property
    def failed_tests(self) -> List[TestCase]:
        return [tc for tc in self.all_test_cases if tc.status in ("failed", "error")]


@dataclass
class EnrichedMetrics:
    parsed: ParsedTestData
    pass_rate: float
    fail_rate: float
    risk_score: str  # "low", "medium", "high", "critical"
    risk_color: str  # "green", "yellow", "orange", "red"
    top_failures: List[TestCase]
    failure_by_category: dict
    failure_by_platform: dict
    total_duration_minutes: float
    generated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())