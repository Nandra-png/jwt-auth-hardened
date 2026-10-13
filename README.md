# jwt-auth-hardened

ini projek kedua saya, awalnya saya bikin api login biasa terus kepikiran gimana caranya bikin yang agak beneran, jadi saya coba pake jwt sama saya tambahin beberapa lapis pengamanan

saya masih belajar jadi mungkin masih ada yang kurang, tapi setidaknya saya tau kenapa setiap bagiannya ada disitu, bukan asal copas

## kenapa saya bikin ini

waktu bikin projek pertama (vulnerable-api) saya sadar kalo bikin login yang aman itu banyak pertimbangannya, gak cuma simpen password terus cek doang, jadi saya pengen nyobain bikin yang lebih lengkap dan ngerti alesannya

## isinya

cuma 1 file `server.js` soalnya saya pengen liat semuanya dalam satu layar

yang dipake:

- **express** buat server
- **bcryptjs** buat hash password
- **jsonwebtoken** buat token
- **express-rate-limit** biar gak bisa dibrute force
- **helmet** buat security header
- **cookie-parser** buat refresh token di cookie

## cara jalanin

```
npm install
npm start
```

jalan di port 4000

## apa aja yang saya tambahin

### password di hash pake bcrypt

bukan cuma hash biasa sih, saya pake cost 12, jadi lama banget kalo mau dibrute force, saya sempet iseng ganti jadi 3 terus liat bedanya waktu prosesnya, lumayan jauh

### password harus agak ribet

saya cek minimal 8 karakter, harus ada huruf besar, huruf kecil, sama angka, jadi orang gak bisa pake `123456`

### token cuma 15 menit

jadi kalo ketangkep pun gak bisa dipake lama, terus ada refresh token buat minta yang baru

refresh token saya taro di cookie, bukan di storage, dan saya set httpOnly jadi javascript gak bisa baca, ini nyegah XSS nyolong token

### refresh token sekali pake

tiap kali dipake saya hapus yang lama terus bikin yang baru, jadi kalo ada orang nyolong terus dipake, yang aslinya jadi gak bisa dipake lagi

### rate limit

login cuma boleh 5x per 15 menit, saya udah tes sampe ke-6 langsung kena 429

semua endpoint lain 60x per menit

### pesan error disamain

username salah sama password salah saya kasih pesan yang sama, soalnya kalo dibedain orang bisa nebak nebak username mana yang ada

saya juga sengaja tetep jalanin bcrypt walopun usernya gak ada, biar waktunya sama, jadi gak keliatan bedanya

### limit ukuran body

saya set 10kb, soalnya kalo gak dibatasi orang bisa kirim data gede sampe server nya berat

### helmet

ini nambahin header header keamanan otomatis, saya belum paham semua sih tapi kayaknya penting

## cara ngetes

saya ngetes pake curl

daftar dulu

```
curl -X POST http://localhost:4000/daftar -H "Content-Type: application/json" -d "{\"username\":\"budi\",\"password\":\"Rahasia123\"}"
```

coba yang lemah, harusnya ditolak

```
curl -X POST http://localhost:4000/daftar -H "Content-Type: application/json" -d "{\"username\":\"budi\",\"password\":\"123\"}"
```

login

```
curl -X POST http://localhost:4000/masuk -H "Content-Type: application/json" -d "{\"username\":\"budi\",\"password\":\"Rahasia123\"}"
```

abistu pake tokennya

```
curl http://localhost:4000/aku -H "Authorization: Bearer <tokennya>"
```

## yang belum saya kerjain

- datanya masih di array, kalo restart hilang
- refresh token juga cuma di memori
- belum ada verifikasi email
- belum ada 2FA
- helum ada cek pake linter security kayak semgrep

## yang saya pelajarin

yang paling bikin saya mikir itu bagian pesan error, soalnya awalnya saya pikir itu sepele, kok cuma beda kata doang, ternyata dari situ orang bisa tau username mana yang terdaftar, baru saya ngerti kenapa hal hal kecil kayak gitu penting

terus soal refresh token, awalnya saya simpen di localStorage soalnya gampang, terus saya baca baca ternyata bahaya kalo ada XSS, jadi saya pindahin ke cookie

masih belajar sih, kalo ada yang salah mohon dikoreksi
