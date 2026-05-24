import xml.etree.ElementTree as ET
import json
import csv
import io
from typing import Union
from .models import TestCase, TestSuite, ParsedTestData


def parse(content: Union[str, bytes], filename: str, platform: str, build_id: str) -> ParsedTestData:
    if isinstance(content, bytes):
        content = content.decode("utf-8", errors="replace")

    filename_lower = filename.lower()

    if filename_lower.endswith(".xml"):
        return _parse_junit_xml(content, platform, build_id)
    elif filename_lower.endswith(".json"):
        return _parse_pytest_json(content, platform, build_id)
    elif filename_lower.endswith(".csv"):
        return _parse_csv(content, platform, build_id)
    else:
        raise ValueError(f"Unsupported file format: {filename}")


def _parse_junit_xml(content: str, platform: str, build_id: str) -> ParsedTestData:
    root = ET.fromstring(content)
    suites = []

    suite_elements = []
    if root.tag == "testsuites":
        suite_elements = list(root)
    elif root.tag == "testsuite":
        suite_elements = [root]

    for suite_el in suite_elements:
        if suite_el.tag != "testsuite":
            continue

        test_cases = []
        for tc_el in suite_el.findall("testcase"):
            failure = tc_el.find("failure")
            error = tc_el.find("error")
            skipped = tc_el.find("skipped")

            if failure is not None:
                status = "failed"
                failure_message = failure.get("message", failure.text or "")
                failure_type = failure.get("type", "AssertionError")
            elif error is not None:
                status = "error"
                failure_message = error.get("message", error.text or "")
                failure_type = error.get("type", "Error")
            elif skipped is not None:
                status = "skipped"
                failure_message = None
                failure_type = None
            else:
                status = "passed"
                failure_message = None
                failure_type = None

            name = tc_el.get("name", "unknown")
            classname = tc_el.get("classname", "")
            category = classname.split(".")[-2] if "." in classname else classname

            test_cases.append(TestCase(
                name=name,
                classname=classname,
                status=status,
                duration=float(tc_el.get("time", 0)),
                failure_message=failure_message,
                failure_type=failure_type,
                platform=platform,
                category=category,
            ))

        suite = TestSuite(
            name=suite_el.get("name", "TestSuite"),
            total=int(suite_el.get("tests", len(test_cases))),
            passed=sum(1 for tc in test_cases if tc.status == "passed"),
            failed=sum(1 for tc in test_cases if tc.status == "failed"),
            skipped=sum(1 for tc in test_cases if tc.status == "skipped"),
            errors=sum(1 for tc in test_cases if tc.status == "error"),
            duration=float(suite_el.get("time", 0)),
            timestamp=suite_el.get("timestamp"),
            test_cases=test_cases,
        )
        suites.append(suite)

    return ParsedTestData(
        source_format="junit_xml",
        platform=platform,
        build_id=build_id,
        suites=suites,
    )


def _parse_pytest_json(content: str, platform: str, build_id: str) -> ParsedTestData:
    data = json.loads(content)
    summary = data.get("summary", {})
    test_cases = []

    for test in data.get("tests", []):
        outcome = test.get("outcome", "passed")
        status = outcome if outcome in ("passed", "failed", "skipped", "error") else "passed"
        call = test.get("call", {})
        failure_message = None
        failure_type = None

        if status in ("failed", "error") and call:
            longrepr = call.get("longrepr", "")
            failure_message = longrepr[:500] if longrepr else None
            failure_type = "AssertionError"

        node_id = test.get("nodeid", "")
        parts = node_id.split("::")
        classname = parts[0].replace("/", ".").replace("\\", ".")
        name = parts[-1] if len(parts) > 1 else node_id
        category = parts[1] if len(parts) > 2 else classname.split(".")[-1]

        test_cases.append(TestCase(
            name=name,
            classname=classname,
            status=status,
            duration=float(test.get("duration", 0)),
            failure_message=failure_message,
            failure_type=failure_type,
            platform=platform,
            category=category,
        ))

    suite = TestSuite(
        name="pytest",
        total=summary.get("total", len(test_cases)),
        passed=summary.get("passed", sum(1 for tc in test_cases if tc.status == "passed")),
        failed=summary.get("failed", sum(1 for tc in test_cases if tc.status == "failed")),
        skipped=summary.get("skipped", sum(1 for tc in test_cases if tc.status == "skipped")),
        errors=summary.get("error", sum(1 for tc in test_cases if tc.status == "error")),
        duration=data.get("duration", 0),
        test_cases=test_cases,
    )

    return ParsedTestData(
        source_format="pytest_json",
        platform=platform,
        build_id=build_id,
        suites=[suite],
    )


def _parse_csv(content: str, platform: str, build_id: str) -> ParsedTestData:
    reader = csv.DictReader(io.StringIO(content))
    test_cases = []

    for row in reader:
        name = row.get("test_name") or row.get("name") or row.get("Test") or "unknown"
        status_raw = (row.get("status") or row.get("result") or row.get("Status") or "passed").lower()
        status = status_raw if status_raw in ("passed", "failed", "skipped", "error") else "passed"
        duration = float(row.get("duration") or row.get("time") or 0)
        category = row.get("category") or row.get("suite") or "general"
        failure_message = row.get("message") or row.get("error") or None

        test_cases.append(TestCase(
            name=name,
            classname=category,
            status=status,
            duration=duration,
            failure_message=failure_message,
            platform=platform,
            category=category,
        ))

    suite = TestSuite(
        name="csv_import",
        total=len(test_cases),
        passed=sum(1 for tc in test_cases if tc.status == "passed"),
        failed=sum(1 for tc in test_cases if tc.status == "failed"),
        skipped=sum(1 for tc in test_cases if tc.status == "skipped"),
        errors=sum(1 for tc in test_cases if tc.status == "error"),
        duration=sum(tc.duration for tc in test_cases),
        test_cases=test_cases,
    )

    return ParsedTestData(
        source_format="csv",
        platform=platform,
        build_id=build_id,
        suites=[suite],
    )