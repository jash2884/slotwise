# Slotwise ko interview mein kaise explain karein

## 60-second explanation

“Slotwise ek mentor scheduling application hai. Users mentor discover karte hain, timezone ke according availability dekhte hain aur 30-minute sessions book karte hain. Mentor apna profile aur slots manage kar sakta hai. React/TypeScript frontend, Worker-based server APIs aur SQLite database use hota hai. Main correctness challenge concurrent booking tha: database ke partial unique indexes se same slot ke liye sirf ek active booking allow hoti hai. Authentication platform gateway provide karta hai; application har operation par ownership validate karti hai.”

Is explanation ko tabhi apna claim banao jab tum relevant code khud samajh aur modify kar sako. AI assistance ko honestly describe karo agar poocha jaye. Test results ko actual user traffic ya production adoption mat bolo.

## Request ka safar

1. User UI mein slot aur topic select karta hai.
2. Browser `/api/bookings` ko POST karta hai, saath mein unique request UUID bhejta hai.
3. Gateway authenticated visitor ki identity attach karta hai.
4. Server identity, origin, input, future time aur self-booking validate karta hai.
5. Database transaction booking aur audit event insert karti hai.
6. Unique constraint conflict ho toh HTTP 409; success ho toh 201.
7. Browser state reload karke booking “My sessions” mein dikhata hai.

## Pehle yeh 7 concepts samjho

| Concept | Simple explanation | Code location |
|---|---|---|
| API | Frontend aur server ka request/response interface | `app/api/` |
| Authentication | Visitor kaun hai? | `app/chatgpt-auth.ts` |
| Authorization | Kya visitor is record ko modify kar sakta hai? | `app/api/bookings/route.ts` |
| Foreign key | Booking valid slot se linked rahe | `db/schema.ts` |
| Race condition | Do requests ek hi waqt empty slot dekh sakti hain | Booking POST |
| Transaction | Booking aur audit insert dono succeed hon, ya rollback hon | `db.batch()` |
| Idempotency | Same request retry karne par nayi booking na bane | `Idempotency-Key` |

## Interview questions

**Sirf `SELECT` karke availability check kyun enough nahi?**
Do requests check aur insert ke beech interleave ho sakti hain. Database constraint actual write par uniqueness enforce karta hai.

**Cancellation ke baad slot kaise free hota hai?**
Booking ka status `cancelled` hota hai. Unique index sirf `confirmed` records par apply hota hai. History delete nahi hoti.

**Timezone change se stored time change hota hai?**
Nahi. Server UTC epoch milliseconds store karta hai. `Intl.DateTimeFormat` wahi instant different local timezone mein render karta hai.

**Gateway authentication aur authorization mein kya difference hai?**
Gateway visitor identity establish karta hai. Application decide karti hai ki booking learner ki hai ya owned mentor ki. Login hona kisi aur ki booking cancel karne ka permission nahi deta.

**PostgreSQL kyun nahi?**
Is hosted version ka runtime Workers/D1 hai. SQLite partial unique indexes aur D1 transactional batches required correctness support karte hain. PostgreSQL migration ek valid future exercise hai, implemented feature nahi.

**System scale karne ke liye kya change karoge?**
Paginated queries, booking quotas, rate limiting, idempotent background notification jobs, indexes based on query measurements, monitoring, and load tests. Current 20-request race test capacity benchmark nahi hai.

**Kya mentor ka learning appointment uske hosted slot se conflict kar sakta hai?**
Current version mein haan. Learner aur host schedules separately protected hain. Next iteration mein combined participant occupancy table ya interval conflict constraints add kiye ja sakte hain.

## Suggested learning sessions

1. UI trace: `useState`, rendering, events, form submit, `fetch`.
2. API trace: HTTP verbs/status, validation, error handling.
3. SQL trace: tables, joins, unique indexes, foreign keys.
4. Auth trace: trusted boundary, record ownership, origin validation.
5. Race test: 20 requests ka result explain karo; constraint hataane par kya hoga?
6. Small extension tum implement karo: booking-topic editing with ownership checks and a test.

Har session ke baad ek chhota change khud karo. Isse project explain karna memorized script se aage jaayega.
