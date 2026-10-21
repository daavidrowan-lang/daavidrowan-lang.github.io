# Booking portal - synthetic source pack

**Illustrative material, not a customer project.** Version 1.0, October 21, 2026. All people, organizations, data and expected behaviors below are invented to explain the service. No application has been tested against this document.

## Part 1: brief received before quotation

The quote-risk sample reviews only this part. Paragraph IDs are stable references, not a claim that the brief is complete.

### S01 - Purpose and users
Build a small booking portal for a business with multiple branches. Customers book sessions; branch managers manage sessions and bookings. Customers and branch managers are the two user roles.

### S02 - Booking capacity
Customers choose a session and number of places. A session has a maximum capacity. A booking must not exceed the places remaining.

### S03 - Booking confirmation
Confirm successful bookings on screen and by email. Customers should see their bookings in their account.

### S04 - Cancellations
Customers can cancel bookings until 24 hours before the session. Cancellation should release the places promptly.

### S05 - Commercial promise
The sales page will say: "Cancel any time before your session." Payment and refunds are not included in the first release.

### S06 - Branch manager access
Managers can see and manage bookings for their own branch. Customer information should remain private.

### S07 - Changes and exceptions
Managers can change a session's capacity. It should be easy to handle exceptional cases.

### S08 - Delivery expectation
The first release should work on desktop browsers. A fixed-price quote is requested for the portal, notifications and setup. The estimate must state exclusions.

## Part 2: synthetic clarification baseline for the acceptance example

The acceptance sample uses this separately agreed baseline. These statements resolve selected uncertainties for illustration; they are not automatic interpretations of the original brief. A real customer would approve them before testing. The earlier quote-risk review must not treat them as information already present in Part 1.

### A01 - Capacity and duplicate submissions
A confirmed booking consumes its requested places atomically. With one remaining place, two simultaneous requests for one place must yield exactly one confirmation and one capacity rejection. Repeating a request with the same booking-request ID must not create a second booking.

### A02 - Cancellation boundary
Use the session's named time zone for display and compare stored UTC instants. Cancellation is allowed when the session start is at least 24 hours after the server's current time, including exactly 24 hours. It is refused when less than 24 hours remain. The sales-page wording in S05 is replaced before release with this rule. Cancellation is idempotent and restores places immediately after its successful transaction.

### A03 - Manager scope
A branch manager may read and change session/booking records only for the branch assigned to that account. The application must reject direct navigation to another branch's record, not merely hide links. This is a functional role-scope check in the authorized staging fixture, not a penetration test or security certification.

### A04 - Fixture and three workflows
Use only disposable staging data. Workflows are: create a booking, cancel a booking, and review/manage branch bookings. Roles are Customer and Branch manager. Create separate manager fixture accounts for North and South branches; these are instances of the same role.

### A05 - Email boundary
A booking confirmation email is required. Email-delivery testing needs an authorized staging mail sink. If no mail sink is supplied, mark email delivery blocked, not passed. No real email recipients are contacted.

### A06 - Exclusions and release decision
One agreed desktop browser/viewport only. Payments, refunds, production data, load testing, mobile browser coverage, accessibility certification, infrastructure review and penetration testing are outside this example. The customer decides whether to accept a release. An issue-free sample does not establish that an entire application is correct.

## Synthetic fixtures

- Session `NORTH-101`: North branch; starts November 20, 2026 at 12:00 UTC; capacity 2; one confirmed one-place booking; one place remains.
- Session `NORTH-102`: North branch; same start; capacity 5; booking `B-CANCEL-1` holds two places.
- Booking `SOUTH-SECRET-1`: South branch; fictional customer `Sample Customer South`; no real personal data.
- Customer account `customer-demo`; manager accounts `manager-north-demo` and `manager-south-demo`.
- Clock fixture can be set to November 19, 2026, 12:00 UTC (exact boundary) or 12:00:01 UTC (inside cutoff).

These fixture names are examples, not working login credentials or a reachable environment.
