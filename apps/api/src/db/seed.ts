import "dotenv/config";
import { db, schema } from "./index.js";
import { sql } from "drizzle-orm";

// Предзарегистрированные пользователи из письма Хозяйки.
// Имена дефолтные — пользователь может обновить в профиле (TODO).
const SEED_USERS = [
  { email: "m.kalmykova@tehgid.com", name: "М. Калмыкова" },
  { email: "d.ulyanov@tehgid.com", name: "Д. Ульянов" },
  { email: "at@tehgid.com", name: "AT" },
  { email: "denis.renjiglov@tehgid.com", name: "Денис Ренжиглов" },
  { email: "o.myshkina@tehgid.com", name: "О. Мышкина" },
  { email: "l.shvaibovich@tehgid.com", name: "Л. Швайбович" },
];

async function main() {
  console.log("[seed] start");

  for (const u of SEED_USERS) {
    const email = u.email.trim().toLowerCase();
    const existing = await db
      .select()
      .from(schema.users)
      .where(sql`${schema.users.email} = ${email}`)
      .limit(1);

    if (existing.length > 0) {
      console.log(`[seed] skip ${email} (already exists)`);
      continue;
    }

    await db.insert(schema.users).values({
      email,
      name: u.name,
      role: "user",
      active: true,
    });
    console.log(`[seed] inserted ${email}`);
  }

  console.log("[seed] done");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
