import type { Guide } from "../types";

export const webSecurity: Guide = {
  slug: "web-security",
  group: "hands-on",
  title: "Web application security basics",
  eyebrow: "Skills guide",
  summary:
    "How web apps break, and how to find the flaws safely, using free labs from the company that makes Burp Suite and a vulnerable app that runs on your own machine.",
  card: "How web apps break, with free labs to practice on.",
  facts: [
    { label: "Cost", value: "Free" },
    { label: "Labs", value: "Web Security Academy" },
    { label: "Reference", value: "OWASP Top 10 (2025)" },
    { label: "Tool", value: "Burp Suite Community" },
  ],
  notice: {
    title: "Only test what invites testing",
    body: "The labs below and an app running on your own computer are fair game. A real website is not, unless its owner has given you written permission. That includes university systems.",
  },
  sections: [
    {
      id: "request",
      title: "Learn how a request works first",
      intro: "Every web flaw is a request the application handled badly. Before any attack technique, be able to read one.",
      bullets: [
        { label: "The parts.", body: "The URL, the method such as GET or POST, the headers, the cookies and the body." },
        { label: "The reply.", body: "The status code, such as 200, 302, 403 or 500, and what each family means." },
        { label: "Sessions.", body: "How a cookie tells the server who you are after you log in." },
        { label: "Where to look.", body: "Open your browser's developer tools, choose the Network tab and reload any page." },
      ],
    },
    {
      id: "watch",
      title: "See how the Academy works",
      intro: "PortSwigger's Web Security Academy is free and teaches each flaw with a short lesson and a lab to break.",
      video: {
        id: "GdMTzcn5F0c",
        title: "Introduction to the Web Security Academy Series",
        channel: "Rana Khalil",
        length: "12:11",
        caption: "A tour of the Academy and how to work through it, from someone who has recorded a walkthrough for many of its labs.",
      },
    },
    {
      id: "path",
      title: "A path through the labs",
      steps: [
        { label: "Make a free account.", body: "It tracks which labs you have solved." },
        { label: "Start with SQL injection.", body: "It is the clearest example of untrusted input being treated as code." },
        { label: "Then authentication and access control.", body: "Broken access control is first on the current OWASP Top 10." },
        { label: "Then cross-site scripting.", body: "The same idea as injection, aimed at the browser." },
        { label: "Finish the Apprentice labs before the harder ones.", body: "Each lab has a solution. Read it only after a real attempt." },
      ],
    },
    {
      id: "top-ten",
      title: "Know the OWASP Top 10",
      intro:
        "The OWASP Top 10 is the community's list of the most serious web application risks, and interviewers ask about it by name. The current version was released in 2025. For each entry, be able to say what it is, give one example and name the fix.",
    },
    {
      id: "juice-shop",
      title: "Practice on Juice Shop",
      intro: "OWASP Juice Shop is a deliberately vulnerable online store that keeps score as you find its flaws.",
      steps: [
        { label: "Run it locally.", body: "With Docker installed, run `docker run --rm -p 127.0.0.1:3000:3000 bkimminich/juice-shop`." },
        { label: "Open it.", body: "Visit `localhost:3000` in your browser. It is reachable from your machine only." },
        { label: "Find the score board.", body: "That is the first challenge, and it lists all the others." },
        { label: "Proxy it through Burp.", body: "Read each request the shop makes, then change one." },
      ],
    },
  ],
  links: [
    {
      group: "Free labs",
      items: [
        {
          label: "PortSwigger Web Security Academy",
          href: "https://portswigger.net/web-security",
          note: "Free lessons and labs on every common web flaw.",
        },
        {
          label: "Web Security Academy learning paths",
          href: "https://portswigger.net/web-security/learning-paths",
          note: "The same material arranged in order, one topic at a time.",
        },
        {
          label: "OWASP Juice Shop",
          href: "https://owasp.org/www-project-juice-shop/",
          note: "The vulnerable practice app from the last section.",
        },
        {
          label: "Hacker101",
          href: "https://www.hacker101.com/",
          note: "Free video lessons and practice challenges from HackerOne.",
        },
      ],
    },
    {
      group: "Reference",
      items: [
        {
          label: "OWASP Top 10 (2025)",
          href: "https://owasp.org/Top10/2025/",
          note: "The current list, with a page explaining each risk.",
        },
        {
          label: "OWASP Cheat Sheet Series",
          href: "https://cheatsheetseries.owasp.org/",
          note: "Short, practical guidance on how to fix each kind of flaw.",
        },
      ],
    },
    {
      group: "Tools",
      items: [
        {
          label: "Burp Suite Community Edition",
          href: "https://portswigger.net/burp/communitydownload",
          note: "The free edition of the standard web testing proxy.",
        },
        {
          label: "ZAP: getting started",
          href: "https://www.zaproxy.org/getting-started/",
          note: "A free, open-source alternative to Burp.",
        },
      ],
    },
  ],
  checked: "2026-09-30",
};
