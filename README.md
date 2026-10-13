# jwt-auth-hardened

JWT auth API with bcrypt and rate limiting. Single file: `server.js`.

```
npm install
npm start
```

Port 4000.

## Parts

**bcrypt cost 12** — password hashing, slow enough to make brute force painful

**Password rules** — min 8 chars, needs upper, lower, and a digit

**JWT, 15 min** — short-lived access token, refresh token to get a new one

**Refresh in cookie** — `httpOnly` + `sameSite strict`, unreachable from JS

**Single-use refresh** — deleted and reissued on every use, so a stolen token gets invalidated by the real one

**Rate limit** — 5 login attempts per 15 min, 429 after that. Everything else 60/min

**Matching errors** — wrong username and wrong password return the same message, and bcrypt still runs when the user doesn't exist so the timing lines up

**Body limit 10kb** — caps payload size

**helmet** — security headers

## Test

```bash
curl -X POST http://localhost:4000/daftar -H "Content-Type: application/json" -d "{\"username\":\"budi\",\"password\":\"Rahasia123\"}"
```

```bash
curl -X POST http://localhost:4000/masuk -H "Content-Type: application/json" -d "{\"username\":\"budi\",\"password\":\"Rahasia123\"}"
```

```bash
curl http://localhost:4000/aku -H "Authorization: Bearer <token>"
```

Fail login 5 times, the 6th returns 429.

## Todo

- users in a plain array, lost on restart
- refresh tokens in memory too
- no email verification
- no 2FA
- no dependency scanning in CI
