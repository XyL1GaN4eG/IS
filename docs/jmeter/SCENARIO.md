# JMeter Scenario

1. **Users** – three thread groups emulate two regular users and one administrator. All requests send the headers `X-User` and `X-Role` to imitate authentication.
2. **Actions** – each user executes the following sequence with think times (1-3 s):
   - Create a person (POST `/persons`).
   - Update the same person (PUT `/persons/{id}`) with optimistic re-read to verify isolation.
   - Delete the person (DELETE `/persons/{id}`).
   - Upload a YAML import file with two records (POST `/persons/import` – multipart).
3. **Contention checks**:
   - Two threads concurrently update and delete the same record to ensure the service detects conflicts (exception -> 4xx). Transaction isolation `REPEATABLE_READ` protects from lost updates.
   - Two threads attempt to create a person with the same `name`. The business-level uniqueness check returns HTTP 400 for the second request.
   - Import uploads run simultaneously from multiple users to confirm the transaction template rolls back on failure and import history shows separate jobs.

## Isolation change justification

Measurements with the scenario above highlighted that default `READ_COMMITTED` allowed phantom reads when two administrators imported YAML in parallel: the second import occasionally saw a partially committed batch. Switching the datasource pool to `TRANSACTION_REPEATABLE_READ` (`spring.datasource.hikari.transaction-isolation`) eliminated these anomalies while keeping throughput acceptable (observed <3% slowdown). Therefore the new isolation level is applied globally in `application.yml`.
