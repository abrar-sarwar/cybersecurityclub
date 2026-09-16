---
title: Broken access control
objective: Find and fix an insecure direct object reference in a small Express API by adding a server-side ownership check.
kind: exercise
estimatedMinutes: 40
prerequisites:
  - Complete "How a web request works"
  - Node.js installed, or Docker to run OWASP Juice Shop locally
completionChecks:
  - I can explain what an insecure direct object reference (IDOR) is.
  - I can spot an endpoint that is missing an authorization check.
  - I can add a server-side check that a user owns the object they request.
  - I can explain why access control must live on the server.
references:
  - title: "OWASP Top 10, A01:2021 Broken Access Control"
    url: https://owasp.org/Top10/A01_2021-Broken_Access_Control/
  - title: OWASP Access Control Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html
  - title: OWASP Juice Shop
    url: https://owasp.org/www-project-juice-shop/
status: published
lastReviewed: 2026-09-15
---

Broken access control is the most common serious weakness in web apps, and the easiest version to understand is the insecure direct object reference, or IDOR. It happens when an endpoint returns an object based on an id in the request without checking that the requester is actually allowed to see that object. Change the id, get someone else's data. In this exercise you will reproduce and fix an IDOR on your own machine.

## The vulnerable code

Save this as `server.js`. Assume a login step has already set `req.user` for authenticated requests.

```js
const express = require("express");
const app = express();

const orders = [
  { id: 1, ownerId: "alice", total: 40 },
  { id: 2, ownerId: "bob", total: 25 },
];

app.get("/api/orders/:id", requireLogin, (req, res) => {
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: "not found" });
  res.json(order);
});

app.listen(4000);
```

Read the handler closely. It looks up the order by id and returns it. It never asks whether the logged-in user owns that order. Alice is authenticated, so `requireLogin` is happy, but nothing stops her from requesting order 2, which belongs to Bob. Authentication (who are you) passed, but authorization (are you allowed) was never checked. That gap is the flaw.

## Guided practice

1. Set up a folder, run `npm init -y`, and `npm install express`.
2. Add a tiny `requireLogin` for testing that reads a user id from a header, so you can act as different people:

   ```js
   function requireLogin(req, res, next) {
     req.user = { id: req.header("x-user") || "alice" };
     next();
   }
   ```

3. Start it with `node server.js`.
4. As Alice, request her own order: `curl -H "x-user: alice" http://localhost:4000/api/orders/1`. You get her order back, as expected.
5. Now act as Alice but ask for Bob's order: `curl -H "x-user: alice" http://localhost:4000/api/orders/2`. You still get the data. That is the IDOR: Alice reached an object she does not own just by changing the id.
6. **Fix it** by checking ownership on the server before returning the object:

   ```js
   app.get("/api/orders/:id", requireLogin, (req, res) => {
     const order = orders.find((o) => o.id === Number(req.params.id));
     if (!order || order.ownerId !== req.user.id) {
       return res.status(404).json({ error: "not found" });
     }
     res.json(order);
   });
   ```

7. Restart and repeat step 5. Alice can still read order 1, but order 2 now returns "not found."

> **Tip:** Returning 404 rather than 403 for objects a user may not access avoids telling them the object exists at all. Either is far better than leaking the data, but hiding existence is a nice touch.

## Why the check must live on the server

It is tempting to fix this by hiding buttons or filtering in the front end, but the client is untrusted. An attacker does not use your interface; they send raw requests with any id they like. Every access decision has to be made on the server, close to the data, on every request. A good habit is **deny by default**: start from "no access" and grant it only when a check passes.

## Try it on Juice Shop (optional)

Run OWASP Juice Shop locally with `docker run --rm -p 3000:3000 bkimminich/juice-shop` and open `http://localhost:3000`. Look at how it handles baskets and user data, and watch the requests in your browser's Network tab. Because it runs on your own machine and is designed for practice, exploring it is safe and legal.

> **Careful:** Practice access-control testing only on apps you own or that exist for training. Probing ids on systems you do not control is not authorized.

## Check yourself

- **What is an IDOR?** An endpoint that returns an object from an id in the request without checking the requester is allowed to access it.
- **What is the difference between authentication and authorization here?** Authentication proves who the user is; authorization checks whether that user may perform this specific action on this object.
- **Why can't a front-end filter fix this?** Because attackers send raw requests directly, so the control must run on the server for every request.
