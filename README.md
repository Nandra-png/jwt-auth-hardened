# jwt-auth-hardened

auth api pake jwt, bcrypt, rate limit. 1 file `server.js`

```
npm install
npm start
```

port 4000

## bagiannya

**bcrypt cost 12** — hash password, lama banget kalo dibrute force

**password rule** — min 8 karakter, ada huruf besar, kecil, angka

**jwt 15 menit** — token cepet expired, ada refresh buat minta baru

**refresh di cookie** — `httpOnly` + `sameSite strict`, javascript gak bisa baca

**refresh sekali pake** — abis dipake langsung dihapus, diganti yang baru

**rate limit** — login 5x per 15 menit, sisanya 429

**pesan error disamain** — username salah sama password salah pesannya sama, plus bcrypt tetep jalan walaupun usernya gak ada biar waktunya mirip

**body limit 10kb** — biar gak ada yang kirim data gede

**helmet** — security header otomatis

## tes

```bash
curl -X POST http://localhost:4000/daftar -H "Content-Type: application/json" -d "{\"username\":\"budi\",\"password\":\"Rahasia123\"}"
```

```bash
curl -X POST http://localhost:4000/masuk -H "Content-Type: application/json" -d "{\"username\":\"budi\",\"password\":\"Rahasia123\"}"
```

```bash
curl http://localhost:4000/aku -H "Authorization: Bearer <token>"
```

login gagal 5x, coba ke-6 langsung 429

## todo

- data di array, restart hilang
- refresh token juga di memori
- belum ada verifikasi email
- belum ada 2fa
- belum ada scan dependency
