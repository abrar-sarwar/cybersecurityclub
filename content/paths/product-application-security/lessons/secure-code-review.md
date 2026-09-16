---
title: Secure code review
objective: Practice reviewing a short piece of code for security problems, mapping each to a category and a fix.
kind: exercise
estimatedMinutes: 40
prerequisites:
  - Complete "Injection in practice"
  - Complete "Broken access control"
completionChecks:
  - I can read a small handler and list its security problems.
  - I can map each problem to an OWASP Top 10 category.
  - I can propose a concrete fix for each problem.
  - I can explain what a secure default is and give an example.
references:
  - title: OWASP Code Review Guide
    url: https://owasp.org/www-project-code-review-guide/
  - title: OWASP Proactive Controls
    url: https://owasp.org/www-project-proactive-controls/
  - title: OWASP Cheat Sheet Series
    url: https://cheatsheetseries.owasp.org/
status: published
lastReviewed: 2026-09-15
---

Security code review is one of the highest-value skills in application security, because a careful human reader catches logic and authorization mistakes that automated tools miss. The goal is not to read every line with equal attention, but to focus on the risky places: where input enters, where data is queried, where users are authenticated, and where access is decided. In this exercise you will review a small login service that has several planted problems.

## The code to review

Read this Express service slowly before reading on. Assume `db.query` runs the SQL string you give it and `sign` creates a token.

```js
const express = require("express");
const app = express();
const db = require("./db");

const JWT_SECRET = "s3cret-key-123";

app.post("/login", (req, res) => {
  const { user, pass } = req.body;
  const row = db.query("SELECT * FROM users WHERE name = '" + user + "'");
  if (row && row.password === pass) {
    res.json({ token: sign({ user }, JWT_SECRET) });
  } else {
    res.status(401).json({ error: "no account named " + user });
  }
});

app.get("/admin/report", (req, res) => {
  res.json(db.query("SELECT * FROM revenue"));
});

app.listen(3000);
```

## Guided practice

Work through these steps and write your answers down before checking them against the notes that follow.

1. **Find where untrusted input is used.** The `user` value goes straight into the SQL string. Mark it.
2. **Find how the password is checked.** Note how `row.password` is compared to `pass`.
3. **Find any secrets in the code.** Look at how `JWT_SECRET` is defined.
4. **Find what each response tells the caller.** Read the error message carefully.
5. **Find any route that skips a check.** Compare the two routes and ask what protects each.
6. For every problem you found, write down the category it fits and a one-line fix.

## The problems, and their fixes

- **SQL injection (A03 Injection).** The query joins `user` into the string, so crafted input changes the query. Fix: use a parameterized query with a placeholder instead of string concatenation.
- **Passwords stored and compared as plain text (A02 Cryptographic Failures).** Comparing `row.password === pass` means passwords are stored unhashed. Fix: store a salted hash with bcrypt, scrypt, or Argon2, and verify with the library's constant-time compare.
- **Hardcoded secret (A05 Security Misconfiguration).** `JWT_SECRET` is committed in the source, so anyone with the code can forge tokens. Fix: load it from an environment variable or a secrets manager, and rotate the exposed value.
- **User enumeration through error messages (A07 Identification and Authentication Failures).** "no account named ..." tells an attacker which usernames exist. Fix: return the same generic "invalid credentials" message whether the user exists or not.
- **Missing authorization on the admin route (A01 Broken Access Control).** `/admin/report` returns revenue to anyone who asks, with no login or role check. Fix: require authentication and verify an admin role before returning data.
- **No brute-force protection (bonus).** The login has no rate limiting, so an attacker can guess passwords quickly. Fix: add rate limiting and consider account lockout or a delay after repeated failures.

## Secure defaults

Notice a theme: several fixes are about the default state being wrong. A **secure default** is a setting where the safe behavior is what you get without doing anything extra. Deny access unless a check passes, keep errors generic unless you deliberately add detail, and require configuration of secrets rather than shipping one. When the easy path is also the safe path, whole categories of bug stop happening.

> **Tip:** Keep a short personal review checklist: input handling, queries, authentication, authorization, secrets, error messages, and configuration. Running the same list every time is how reviewers stay consistent.

> **Careful:** Review complements automated scanning; it does not replace it, and scanning does not replace review. Tools are great at known patterns, humans are better at "should this user be allowed to do this?"

## Check yourself

- **Which line is the injection risk and how do you fix it?** The query that joins `user` into the SQL string; fix with a parameterized query.
- **Why is "no account named ..." a problem?** It reveals which usernames exist, helping an attacker enumerate accounts; return a generic error instead.
- **What makes the admin route insecure?** It has no authentication or authorization check, so anyone can read the data. Require login and an admin role.
