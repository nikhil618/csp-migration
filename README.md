# Getting Started With Schematics

This repository is a basic Schematic implementation for enabling CSP within an angular project, it will transform your html templates to be more strict CSP compliant.

```bash
ng add csp-migration
```

## What is CSP?

CSP stands for Content-Security-Policy, it is a browser implementation for detecting and mitigating attacks such as XSS and data-injection.

## What csp-migration does?

This package adds a module for managing CSP implementation using nonce.
It will also update your html to be in sync with the CSP policies by removing inline styles and creating dynamic classes to be appended to your corresponding SCSS sheets.
Removes any invalid anchor tag to be compliant with CSP headers.
Please note this will only enable CSP on client end, you also can provide CSP headers for

## How do we achieve CSP compliance?

Before the application initializes we generate a random nonce value and create a meta tag with our CSP policies.
As CSP can block certain things from loading/working we will incorporate a stricter policy in report-only mode, once you have addressed all the issues resulting from CSP report log you can turn reporting off and turn on CSP blocking.
