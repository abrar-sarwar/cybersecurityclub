---
title: Authentication and session mistakes
objective: Recognize the common ways login, sessions, cookies, and tokens go wrong, and know the standard defense for each.
kind: lesson
estimatedMinutes: 30
prerequisites:
  - Complete "How a web request works"
completionChecks:
  - I can explain how passwords should be stored and why.
  - I can describe session fixation and how to prevent it.
  - I can list the cookie flags that protect a session.
  - I can name common JWT pitfalls and how to avoid them.
  - I can explain what CSRF is and one way to stop it.
references:
  - title: OWASP Authentication Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
  - title: OWASP Session Management Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
  - title: OWASP Cross-Site Request Forgery Prevention Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
  - title: MDN Web Docs, Set-Cookie header
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
status: published
lastReviewed: 2026-09-15
---

Logging a user in and keeping them logged in sound simple, but this area has a long history of subtle mistakes. Because authentication guards everything behind it, small errors here have large consequences. This lesson tours the mistakes you will meet most often and pairs each with its standard fix, so you can spot them in a review and suggest the right change.

## Storing passwords

Never store passwords as plain text, and never with fast or reversible schemes. If the database leaks, plain-text passwords hand attackers every account immediately. Store a **salted hash** made with a slow, purpose-built password hashing function such as bcrypt, scrypt, or Argon2. The salt is unique per user so identical passwords do not produce identical hashes, and the slowness makes large-scale guessing expensive. Let a maintained library handle this; do not invent your own scheme. Encourage long passphrases, check new passwords against known-breached lists, and support multi-factor authentication where you can.

> **Careful:** A plain hash like SHA-256 on its own is not enough for passwords. It is designed to be fast, which is exactly the wrong property here. Use a function built for passwords.

## Managing sessions

After login the server issues a **session identifier**, usually in a cookie, that stands in for the user on later requests. Two rules keep this safe. First, the identifier must be long and random so it cannot be guessed. Second, you must **regenerate the session id at login**. If you keep the same id a user had before signing in, you are open to **session fixation**: an attacker sets a known id in the victim's browser beforehand, the victim logs in, and the attacker now shares an authenticated session. Regenerating the id at the moment privileges change closes that door. Also expire sessions after a reasonable time and give users a real logout that invalidates the session on the server.

## Protecting the cookie

The session cookie needs the right flags:

- **HttpOnly** stops JavaScript from reading the cookie, which limits the damage of a cross-site scripting bug.
- **Secure** tells the browser to send the cookie only over HTTPS.
- **SameSite** controls whether the cookie is sent on cross-site requests. `Lax` or `Strict` reduces the risk of cross-site request forgery.

## Cross-site request forgery

Cross-site request forgery (CSRF) tricks a logged-in user's browser into sending a state-changing request they did not intend. Because the browser attaches the session cookie automatically, the request looks legitimate. The common defenses are a per-request **anti-CSRF token** that a forged page cannot know, the **SameSite** cookie attribute, and checking that sensitive requests actually came from your own site. Many frameworks include CSRF protection; make sure it is turned on rather than rebuilding it.

## Tokens and JWT pitfalls

Some apps use JSON Web Tokens (JWTs) instead of server-side sessions. A JWT is a signed set of claims the client carries. They are useful but easy to misuse:

- **Accepting the "none" algorithm.** Some libraries once honored a token that claimed it needed no signature. Always require a specific, strong algorithm and reject `alg: none`.
- **Not verifying the signature.** Reading the claims without checking the signature lets anyone forge a token. Always verify.
- **No expiry.** Give tokens a short lifetime with an `exp` claim so a stolen token does not last forever.
- **Storing tokens carelessly.** A token in a place JavaScript can read is exposed to cross-site scripting. Understand the trade-offs before choosing where it lives.
- **Trying to revoke the unrevocable.** A plain JWT stays valid until it expires, so you cannot easily log someone out. If you need instant revocation, keep server-side state or short lifetimes with refresh.

> **Note:** Server-side sessions are a perfectly good default for most web apps. Reach for JWTs when you have a specific reason, and read the OWASP guidance before you do.

## Guided practice

1. Pick a small app or framework you know and find where it stores passwords. Confirm it uses bcrypt, scrypt, or Argon2, not a plain hash.
2. Inspect the session cookie in your browser's developer tools. Which of HttpOnly, Secure, and SameSite are set?
3. Read how the framework handles login. Does it regenerate the session id after authentication?
4. Find the framework's CSRF protection in its docs and confirm it is enabled for state-changing routes.
5. If the app uses JWTs, check that it verifies signatures, pins the algorithm, and sets an expiry.

## Check yourself

- **How should passwords be stored?** As salted hashes using a slow password-hashing function such as bcrypt, scrypt, or Argon2.
- **What is session fixation and how do you prevent it?** Reusing a pre-login session id after authentication; prevent it by regenerating the id at login.
- **Name two JWT pitfalls.** Accepting the "none" algorithm and not verifying the signature (also: no expiry, unsafe storage).
- **What does the SameSite cookie attribute help with?** Reducing cross-site request forgery by limiting when the cookie is sent on cross-site requests.
