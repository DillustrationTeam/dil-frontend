# Profile and commission regression fixes

- Personal profile renders the avatar and cover saved in the auth user data.
- Public creator reviews render the saved reviewerReply from the marketplace API.
- Workroom looks up its participant dispute independently of commission status, so resolved disputes remain accessible after cancellation. The dispute action is available on mobile too.
- Final delivery can be downloaded in Delivered and Completed states. Acceptance and review remain separate actions; only Completed commissions expose the review action.
- Resolved arbitration shows saved refund and net creator payout rather than recomputing these amounts from the remaining (zero) escrow.
- Creator profile setup shares the validated HTTP(S) URL schema with the profile regression checks and sends empty optional fields when editing to clear saved values.

Verification: `node scripts/check-profile-regressions.cjs`, frontend production build, and backend CommissionWorkflowChecks. Email/password OTP flows still need a mailbox-backed end-to-end test.

Login services translate the form's email field to the API's emailOrUsername property. Sending email directly fails backend model binding with HTTP 400.
