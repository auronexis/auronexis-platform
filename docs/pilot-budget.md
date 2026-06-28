# Pilot Budget — v0.99

**Date:** 2025-06-23  
**Program:** Founding pilot customers (3 slots target)

---

## Per-pilot infrastructure cost

Marginal cost to support one pilot workspace on shared staging/production:

| Resource | Incremental cost (€/mo) |
|----------|---------------------------|
| Supabase (shared DB row storage) | ~€0.50 |
| Vercel (negligible compute) | ~€0.20 |
| Storage (reports + assets) | ~€0.50–2 |
| AI usage (capped per plan) | ~€2–5 |
| Email (report delivery) | ~€0.10 |
| **Total per pilot** | **~€3–8/mo** |

---

## 3-pilot program budget

| Item | Monthly (€) |
|------|-------------|
| 3 × marginal pilot cost | 9–24 |
| Shared platform (bootstrap) | 15–35 |
| Stripe fees (if discounted billing) | 0 until paid |
| **Program total** | **~€25–60/mo** |

Fits within **€100/mo bootstrap cap** with headroom for founder tooling.

---

## Pilot pricing allowance

Recommended offer (see [pilot-program.md](./pilot-program.md)):

| Item | Value |
|------|-------|
| Discount | 50% off Professional for 6 months |
| List price | €249/mo |
| Pilot pays | ~€125/mo |
| Net after Stripe (~3%) | ~€121/mo |

**3 pilots @ €121 net ≈ €363/mo** — covers full bootstrap infra with margin.

---

## Budget guardrails

| Guardrail | Limit |
|-----------|-------|
| Max pilots on free AI tier | Unlimited (within token caps) |
| Max storage per pilot org | 500 MB (soft limit) |
| Max connector OAuth apps | Shared staging apps (no per-pilot app) |
| Support time | 2 hrs/pilot/month (founder time, not infra) |

---

## Approval checklist

- [ ] Pilot infra budget ≤ €60/mo confirmed
- [ ] Stripe coupon `PILOT50` created (test → live)
- [ ] Demo workspace (`aurora-demo`) presentable
- [ ] E2E suite green on staging with pilot test account

---

## Related

- [cost-analysis.md](./cost-analysis.md)
- [pricing-assumptions.md](./pricing-assumptions.md)
- [pilot-playbook.md](./pilot-playbook.md)
