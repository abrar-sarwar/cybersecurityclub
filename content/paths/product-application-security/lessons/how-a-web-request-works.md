---
title: How a web request works
objective: Trace what happens from a browser request to a server response, and name the places where application security controls belong.
kind: lesson
estimatedMinutes: 25
prerequisites:
  - Comfort using a web browser and opening its developer tools
  - Basic programming in any language helps but is not required
diagram: http-request-cycle
completionChecks:
  - I can describe the steps a request takes from the browser to the server and back.
  - I can name the main parts of an HTTP request and response.
  - I can explain why the server must never trust input from the client.
  - I can find a request in browser developer tools and read its method, status, and headers.
references:
  - title: MDN Web Docs, An overview of HTTP
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP
  - title: OWASP Top 10
    url: https://owasp.org/www-project-top-ten/
  - title: MDN Web Docs, Set-Cookie header
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
status: published
lastReviewed: 2026-09-15
---

Almost everything in application security starts with one simple event: a browser or an app asks a server for something, and the server answers. That round trip takes a fraction of a second, but a lot happens along the way. If you can picture each step, you can also see where a defect might let an attacker in, and where a control can stop them. This lesson gives you that mental map.

## The request and response cycle

When you type an address and press enter, your device first turns the human-readable name into an IP address using DNS. It then opens a network connection to that address. For any modern site this connection is wrapped in TLS, which encrypts the traffic so people between you and the server cannot read or change it. TLS protects data while it moves; it does not protect data once it arrives, and it does not make the application itself safe.

Over that secure connection your browser sends an HTTP request. The server receives it, routes it to some code, and that code may read a database, call another service, or check who you are. The server then builds an HTTP response and sends it back. Your browser reads the response and renders a page or hands the data to the app. The diagram on this page shows the same journey as a series of hops.

## Anatomy of a request

An HTTP request has a few clear parts:

- A **method** that says what you want to do. `GET` reads, `POST` creates, `PUT` and `PATCH` update, and `DELETE` removes.
- A **path and query string**, such as `/orders?id=42`, that names the resource.
- **Headers**, which carry extra information such as `Cookie` (your session), `Authorization` (a token), and `Content-Type` (the format of the body).
- An optional **body** that holds submitted data, for example the fields of a form or a JSON payload.

A raw request looks roughly like this:

```text
POST /login HTTP/1.1
Host: example.test
Content-Type: application/json
Cookie: session=abc123

{"username": "sam", "password": "hunter2"}
```

## Anatomy of a response

The response mirrors that shape. It starts with a **status code**: 2xx means success, 3xx a redirect, 4xx a client error such as 401 (not authenticated) or 403 (not allowed), and 5xx a server error. It carries **headers** of its own, including `Set-Cookie` to start a session and security headers such as `Content-Security-Policy` and `Strict-Transport-Security`. Finally it carries a **body**, usually HTML or JSON.

> **Tip:** Security response headers are cheap wins. `Strict-Transport-Security` keeps browsers on HTTPS, and a good `Content-Security-Policy` limits what scripts a page may run. You will meet both again later in the path.

## Where trust boundaries live

The single most important idea here is the trust boundary. Everything on the client side, the browser, the mobile app, and the network request itself, is under the user's control and can be changed. A hidden form field, a cookie value, a price sent from the browser, or a check written only in JavaScript can all be edited before the request reaches the server. So the server must treat every incoming value as untrusted and validate it again on its own.

This is why "we hide the button" or "the app won't send that" are never real defenses. The attacker does not use your app the way you expect; they send raw requests. The server is the place where authentication, authorization, and input validation must actually happen.

## Guided practice

Do this against a site you own or a local app. A good local target is OWASP Juice Shop, which you can start with `docker run --rm -p 3000:3000 bkimminich/juice-shop` and then open at `http://localhost:3000`.

1. Open your browser's developer tools and select the Network tab.
2. Reload the page and click one request in the list.
3. Read its method and path. Is it a `GET` or a `POST`? What resource does it name?
4. Open the response and note the status code. What does that code mean?
5. Find the request and response headers. Look for `Cookie`, `Authorization`, `Set-Cookie`, and any security headers.
6. Log in (Juice Shop lets you register a test account) and watch which request sets a session cookie.

## Check yourself

- **What does TLS protect, and what does it not protect?** It encrypts traffic in transit so it cannot be read or altered on the wire. It does not secure data at rest or fix flaws in the application logic.
- **Why must the server re-check input the client already validated?** Because anything from the client can be modified before it arrives, so client-side checks are for convenience, not security.
- **What is the difference between a 401 and a 403 status?** 401 means you are not authenticated; 403 means you are authenticated but not allowed to do this action.
