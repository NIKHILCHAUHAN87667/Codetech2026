# Metric lineage

| Metric | Primary records | Output evidence |
|---|---|---|
| OSEC | assets + evidence | asset/evidence IDs |
| CAMG | critical assets + evidence | affected asset IDs |
| TTCP | cases + alerts | case IDs and comparable population |
| ICS | cases + investigation actions + evidence | action/evidence IDs |
| ER | cases + escalations | escalation IDs |
| PRR | cases + alerts + assets + remediations | remediation + recurrence case IDs |
| CEMR | cases + evidence + remediation claims | affected case IDs |
| KECG | reported KPI + independently derived metric | KPI IDs + reported/observed/difference components |
| CEGS | supervisory signals + config | signal category + configured weight |

All metric objects carry sample-sufficiency information. Signal generation skips metrics that
cannot meet the configured minimum sample unless the signal is case-level and has a
sufficient comparable population. Data-quality warnings remain separate from performance
signals.
