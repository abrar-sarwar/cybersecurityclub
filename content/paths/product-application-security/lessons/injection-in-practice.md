---
title: Injection in practice
objective: Find and fix a SQL injection flaw in a short Flask app, and learn why parameterized queries and output encoding stop injection.
kind: exercise
estimatedMinutes: 40
prerequisites:
  - Complete "A tour of the OWASP Top 10"
  - Python 3 installed, or Docker to run OWASP Juice Shop locally
completionChecks:
  - I can explain why building a query by joining strings is unsafe.
  - I can rewrite a vulnerable query using parameters.
  - I can explain how output encoding prevents cross-site scripting.
  - I can confirm my fix still returns the right results.
references:
  - title: OWASP SQL Injection Prevention Cheat Sheet
    url: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
  - title: "OWASP Top 10, A03:2021 Injection"
    url: https://owasp.org/Top10/A03_2021-Injection/
  - title: OWASP Juice Shop
    url: https://owasp.org/www-project-juice-shop/
status: published
lastReviewed: 2026-09-15
---

Injection happens when untrusted input is mixed into a command so that the input can change what the command does. SQL injection is the classic case: user text becomes part of a database query. In this exercise you will run a tiny vulnerable app on your own machine, see the flaw, and fix it the right way. Everything here runs locally, and you should only ever test software you own.

## The vulnerable code

Save this as `app.py`. It is a product search endpoint that builds its query by joining strings, which is the mistake.

```python
from flask import Flask, request
import sqlite3

app = Flask(__name__)

@app.route("/search")
def search():
    term = request.args.get("q", "")
    conn = sqlite3.connect("shop.db")
    cur = conn.cursor()
    query = "SELECT name, price FROM products WHERE name LIKE '%" + term + "%'"
    cur.execute(query)
    return {"results": cur.fetchall()}
```

The trouble is the line that adds `term` straight into the query text. If a user sends a search term that contains quotation marks and SQL keywords, the database reads that as part of the command, not as data. That is how attackers read tables they should never see or bypass a filter.

## Guided practice

1. Create a scratch folder and save the code above as `app.py`.
2. In a Python shell, create a small database so the app has data to return:

   ```python
   import sqlite3
   c = sqlite3.connect("shop.db")
   c.execute("CREATE TABLE products (name TEXT, price REAL)")
   c.execute("INSERT INTO products VALUES ('Keyboard', 40)")
   c.execute("INSERT INTO products VALUES ('Mouse', 25)")
   c.commit()
   ```

3. Install Flask if needed with `pip install flask`, then run `flask --app app run`.
4. Visit `http://localhost:5000/search?q=Key` and confirm you get the keyboard back.
5. Now send a crafted term. Try `q=' OR '1'='1` in the URL. Notice how the always-true condition changes which rows match. On a real login or filter, this class of input is how attackers slip past checks.
6. **Fix it.** Replace the query so the value is passed as a parameter, never joined into the text:

   ```python
   cur.execute(
       "SELECT name, price FROM products WHERE name LIKE ?",
       ("%" + term + "%",),
   )
   ```

   The `?` is a placeholder. The database driver keeps your input as data and never lets it become part of the command. This is called a parameterized query or a prepared statement.
7. Restart the app and repeat steps 4 and 5. The normal search still works, and the crafted term now matches nothing because it is treated as a literal string.

## Output encoding, the other half

Injection is not only about databases. Cross-site scripting (XSS) is injection into a web page: if an app takes user text and drops it into HTML without encoding, a browser may treat that text as markup and run it. The defense is **output encoding**, which converts special characters so the browser shows them as text instead of running them. For example, a comment containing script markup should be stored and echoed as `&lt;script&gt;...&lt;/script&gt;`, which displays as harmless characters. Use your framework's automatic escaping and avoid features that inject raw HTML.

> **Tip:** The rule for both cases is the same: keep code and data separate. Parameterized queries do it for databases; output encoding does it for pages.

## Try it on Juice Shop (optional)

Start OWASP Juice Shop locally with `docker run --rm -p 3000:3000 bkimminich/juice-shop` and open `http://localhost:3000`. It is built to be broken on purpose for learning. Explore its search feature and think about where user input reaches a query or the page. Because you are running it on your own machine, this practice is safe and legal.

> **Careful:** Only ever try these techniques against software you own or that is meant for practice. Sending crafted input to systems you do not control is not authorized testing.

## Check yourself

- **Why is joining user input into a query string dangerous?** Because the database cannot tell your intended data from injected commands, so input can change the query.
- **What does a parameterized query do differently?** It sends the query and the values separately, so the driver always treats input as data.
- **What stops cross-site scripting?** Output encoding, which turns special characters into text the browser will not run.
