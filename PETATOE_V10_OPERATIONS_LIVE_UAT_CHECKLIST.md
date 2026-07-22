# PETATOE v10 Operations — Mandatory Live UAT Checklist

Mark each item with PASS/FAIL and attach screenshots or console/Supabase evidence.

## A. Appointment persistence and concurrency

- [ ] User A and User B open the same appointment.
- [ ] User A saves a change.
- [ ] User B attempts to save a conflicting change and receives conflict protection instead of silent overwrite.
- [ ] A new appointment created by User B remains present when User A saves another appointment.
- [ ] Delete-versus-update conflict does not silently remove newer data.

## B. Network resilience

- [ ] Disconnect network during a new appointment insert.
- [ ] Disconnect network during an appointment update.
- [ ] Disconnect network during deletion.
- [ ] Reconnect and confirm no duplicate, partial, or lost records.

## C. Workflow and permissions

- [ ] Appointment Management cannot skip workflow stages.
- [ ] Unauthorized role cannot change vehicle-operation status.
- [ ] Backward transition requires and records a reason.
- [ ] Confirmed session remains locked for unauthorized roles.
- [ ] Collection cannot exceed total amount.

## D. Historical snapshots

- [ ] Change a service name and price; old appointment remains unchanged.
- [ ] Rename vehicle, driver, and groomer; old appointment retains historical names and still groups under stable IDs.
- [ ] Delete/deactivate a referenced master item; historical appointment remains readable.
- [ ] Open and save an old multi-animal appointment; total does not multiply or change unexpectedly.

## E. Customer synchronization and Customer 360

- [ ] Saving an old appointment without changing customer fields does not overwrite newer master data.
- [ ] Empty appointment fields do not erase phone/address/Google Maps values.
- [ ] Phone-format variants resolve to the same customer.
- [ ] Customer 360 shows current customer data separately from appointment snapshots.
- [ ] Last visit/service/vehicle/driver/groomer derive from the latest actual appointment date/time.

## F. Reports and exports

- [ ] Cancelled appointments do not enter executed revenue or outstanding balance.
- [ ] Postponed appointments remain booked but not executed.
- [ ] Partial, unpaid, and fully paid classifications match across Dashboard and Operations reports.
- [ ] Vehicle/driver/groomer/customer totals match the source appointment dataset.
- [ ] Daily print output uses the selected report period and contains only the report document.
- [ ] PDF/print visual layout is correct in Chrome desktop and mobile-supported flow.

## G. Deployment parity

- [ ] GitHub repository contains all cumulative modified files.
- [ ] Localization Lockdown workflow is green.
- [ ] Native iOS Certification workflow is green.
- [ ] Deployed GitHub Pages assets match repository hashes/version.
- [ ] Browser cache/PWA update serves the current build after refresh/relaunch.
