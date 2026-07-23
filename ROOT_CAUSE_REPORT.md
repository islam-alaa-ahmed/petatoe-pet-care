# PETATOE Commissions — Phase 2B.2 Root Cause Report

## Baseline

`petatoe-pet-care-main (8).zip` plus the previously delivered Phase 2B.1 commission eligibility file.

## Confirmed Root Cause

The commission engine used mutable display names as operational keys:

- vehicle sales grouping used the displayed vehicle name;
- groomer and driver assignments matched `employee.car` to the displayed vehicle name;
- commission result rows stored only `person` and `car` names;
- new commission employee assignments did not persist employee or vehicle IDs;
- snapshots did not declare an identity schema or guarantee identity fields.

Changing a name, inconsistent spacing, or two employees with the same display name could therefore change or ambiguously map a live commission calculation.

## Implemented Scope

A canonical compatibility identity layer was added inside the commission engine. It resolves:

- vehicles from explicit row IDs, Setup/Reference/Fleet master records, persisted aliases, then deterministic legacy IDs;
- employees from explicit IDs, application users, payroll employees, persisted aliases, then deterministic legacy IDs.

Existing commission employee configuration is normalized and migrated to include stable `employeeId` and `vehicleId` fields. Newly added assignments store those IDs immediately.

Live result rows and new snapshots include both stable IDs and frozen display names.

## Deliberately Not Changed

- commission tiers or formulas;
- invoice eligibility rules from Phase 2B.1;
- payroll formulas;
- the current business rule that selects one active global sales employee;
- Supabase schema;
- Operations or UI layout.

The global salesperson assignment remains a separate business-mapping issue and was not silently redesigned in this identity-only phase.
