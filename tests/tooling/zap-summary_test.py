import importlib.util
from pathlib import Path
import json
import sys
import unittest

sys.dont_write_bytecode = True
source = Path(__file__).resolve().parents[2] / 'tools/dast/zap/run-zap.py'
spec = importlib.util.spec_from_file_location('zap_runner', source)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


def report(risk=2):
    return {'site': [{'@name': runner.API_BASE, 'alerts': [
        {'pluginid': 'fixture-rule', 'riskcode': str(risk), 'name': 'Fixture alert',
         'instances': [{'uri': 'http://api:3000/?token=fixture-secret', 'attack': 'fixture-secret'}],
         'evidence': 'fixture-secret'}]}]}


class SummaryTests(unittest.TestCase):
    def test_diagnostic_contains_only_known_categories_not_log_content(self):
        log = ('Authorization: Bearer fixture-secret\nJob activeScan started\n'
               'Permission denied /private/fixture-secret\nJob report finished\n')
        diagnostic = runner.console_diagnostic(log)
        self.assertEqual(diagnostic['startedJobs'], ['activeScan'])
        self.assertEqual(diagnostic['finishedJobs'], ['report'])
        self.assertEqual(diagnostic['errorKinds'], ['Permission denied'])
        self.assertNotIn('fixture-secret', json.dumps(diagnostic))

    def test_keeps_high_findings(self):
        counts, alerts = runner.alert_summary(report(3))
        self.assertEqual(counts['high'], 1)
        self.assertEqual(alerts[0]['risk'], 'high')

    def test_medium_is_not_reclassified_as_high(self):
        counts, _ = runner.alert_summary(report(2))
        self.assertEqual(counts['medium'], 1)
        self.assertEqual(counts['high'], 0)

    def test_does_not_copy_sensitive_payloads_into_summary(self):
        counts, alerts = runner.alert_summary(report())
        self.assertNotIn('fixture-secret', json.dumps([counts, alerts]))
        self.assertEqual(alerts[0]['instances'], 1)

    def test_rejects_outside_target(self):
        data = report()
        data['site'][0]['@name'] = 'https://outside.example.test'
        with self.assertRaises(RuntimeError):
            runner.alert_summary(data)

    def test_rejects_empty_and_unknown_risk_reports(self):
        for data in [{}, {'site': []}, report(7)]:
            with self.subTest(data=data), self.assertRaises(RuntimeError):
                runner.alert_summary(data)

    def test_valid_zero_findings_still_requires_a_site(self):
        counts, alerts = runner.alert_summary({'site': [{'@name': runner.API_BASE, 'alerts': []}]})
        self.assertEqual(sum(counts.values()), 0)
        self.assertEqual(alerts, [])


if __name__ == '__main__':
    unittest.main()
