CREATE SCHEMA dast_control;
CREATE TABLE dast_control.environment (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  purpose text NOT NULL CHECK (purpose = 'cnm-local-dast'),
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO dast_control.environment (purpose) VALUES ('cnm-local-dast');
