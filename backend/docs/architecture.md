# SAT-SA architecture

```text
Periodic CSE submission
        |
        v
+-------------------+
| HTTP ingestion    |  JSON or multipart CSV
+---------+---------+
          |
          v
+-------------------+
| Schema validation | errors/warnings
+---------+---------+
          |
          +--------------------> validation report
          |
          v
+-------------------+
| SQLite            | raw envelope + normalized entity rows
+---------+---------+
          |
          v
+-------------------+
| Metrics engine    | OSEC CAMG TTCP ICS ER PRR CEMR KECG
+---------+---------+
          |
          v
+-------------------+
| Baseline engine   | historical + peer context
+---------+---------+
          |
          v
+-------------------+
| Signal engine     | configurable rules + persistence/context
+---------+---------+
          |
          v
+-------------------+
| CEGS/worklist     | configurable prioritization aid
+---------+---------+
          |
          v
+-------------------+
| Human review      | evidence -> decision -> audit
+---------+---------+
          |
          v
+-------------------+
| Assessment report|
+-------------------+
```

## Offline properties

- No outbound HTTP client exists in the runtime.
- No DNS/network API is called by analytics.
- No cloud or hosted AI model is used.
- SQLite is local.
- The API binds to loopback by default.
- Runtime dependencies are Python standard library only.
- Configuration is stored and versioned in SQLite so signal output can be traced to
  the configuration active at generation time.

## Security posture for production

This prototype intentionally keeps authentication outside the analytics core. The supplied
frontend has a demo login only. A production deployment should place the service behind the
approved offline identity/access-control boundary and use the organization’s required
authentication, TLS, host hardening, backup, retention, and audit controls.
