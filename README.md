# Local JWT Decoder

**[Open the app → https://minweny.github.io/local-jwt-decoder/](https://minweny.github.io/local-jwt-decoder/)**

**Local JWT Decoder** is a pure static HTML/CSS/JS JWT decoder. All decoding happens locally in your browser. No network requests.

---

## Why trust this decoder?

**Most online JWT tools send your token to their servers.** This one does not. Security is the point of the app, not an afterthought.

| Guarantee | What it means |
|-----------|---------------|
| **100% on your device** | All decoding runs in your browser. No server, no upload, no logging. |
| **Zero network requests** | No API calls, analytics, or CDN fetches. Open DevTools → Network and confirm. |
| **No third-party code** | Plain HTML, CSS, and JavaScript only — no frameworks, npm packages, or external libraries. |
| **Fully auditable** | A few hundred lines of readable source. Inspect `app.js` before you paste a production token. |

Use this when debugging auth flows and you need to read a header or payload, but cannot risk leaking a real token to jwt.io or similar tools.

---

## Features

- **Live decoding** — header and payload update as you type or paste
- **Pretty-printed JSON** — readable output with indentation
- **Clear error feedback** — invalid format or decode failures are highlighted
- **Copy to clipboard** — one-click copy for header, payload, or signature
- **Responsive layout** — works on desktop and mobile

## Project structure

```
local-jwt-decoder/
├── index.html   # Page layout and UI
├── styles.css   # Styling (dark theme, responsive grid)
├── app.js       # JWT parsing and Base64URL decoding logic
└── README.md    # This file
```

## How it works

A JWT has three dot-separated parts:

```
header.payload.signature
```

1. **Header** and **payload** are Base64URL-encoded JSON. The app decodes them and displays the JSON.
2. **Signature** is shown as the raw Base64URL string. Verifying a signature requires the secret or public key; this tool does not verify signatures.

Base64URL decoding is implemented manually in `app.js` — no `atob()`, no external libraries.

## How to use

### Open the app

Go to **[https://minweny.github.io/local-jwt-decoder/](https://minweny.github.io/local-jwt-decoder/)** in any modern browser (Chrome, Edge, Firefox, Safari).

No install, sign-in, or download required. After the page loads, decoding runs entirely in your browser with no further network requests.
### Decode a token

1. Paste your JWT into the **Encoded JWT** textarea.
2. The **Header** and **Payload** panels update automatically.
3. Check the status bar below the input:
   - Green — decoded successfully
   - Red — invalid format or decode error (with a short message)
4. Click **Copy** next to any section to copy its content to the clipboard.
5. Click **Clear** to reset the input and output.

### Example token

You can test with this sample JWT (from [jwt.io](https://jwt.io)):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

Expected header:

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

Expected payload:

```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022
}
```

## Requirements

- A modern browser with JavaScript enabled
- Clipboard API support for copy buttons (standard in current browsers)

## Limitations

- **Decode only** — does not verify signatures or check expiry (`exp` / `nbf` are shown as values only)
- **No JWE support** — encrypted tokens (five segments) are not supported
## Verify it yourself

1. Open [https://minweny.github.io/local-jwt-decoder/](https://minweny.github.io/local-jwt-decoder/) and paste a JWT.
2. Open browser DevTools → **Network** tab.
3. Filter by **Fetch/XHR** — you should see **zero requests** while decoding.
4. Read `index.html`, `styles.css`, and `app.js` in this repo — the entire app is there, with no hidden imports.
