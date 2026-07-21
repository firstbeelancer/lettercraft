import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ============================================================
// USERS — предзарегистрированные пользователи
// ============================================================
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    role: text("role").notNull().default("user"), // "admin" | "user"
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  })
);

// ============================================================
// MAGIC LINK TOKENS — одноразовая ссылка на почту
// ============================================================
export const magicLinkTokens = pgTable(
  "magic_link_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull(), // sha256(plain)
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ip: text("ip"),
    userAgent: text("user_agent"),
  },
  (t) => ({
    tokenHashIdx: uniqueIndex("magic_link_tokens_hash_idx").on(t.tokenHash),
    emailIdx: index("magic_link_tokens_email_idx").on(t.email),
  })
);

// ============================================================
// SESSIONS — активные JWT-сессии (для отзыва)
// ============================================================
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    userAgent: text("user_agent"),
    ip: text("ip"),
  },
  (t) => ({
    tokenHashIdx: uniqueIndex("sessions_token_hash_idx").on(t.tokenHash),
    userIdIdx: index("sessions_user_id_idx").on(t.userId),
  })
);

// ============================================================
// LETTERS — черновики и финальные письма
// ============================================================
export const letters = pgTable(
  "letters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    name: text("name").notNull(), // название черновика/документа
    title: text("title"), // заголовок письма
    isDraft: boolean("is_draft").notNull().default(true),

    // Полный state.json (header, footer, logo, stamp, signature, body и т.п.)
    state: jsonb("state").notNull(),

    // Размеры для оптимизации листинга
    sizeBytes: integer("size_bytes").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdIdx: index("letters_user_id_idx").on(t.userId),
    updatedAtIdx: index("letters_updated_at_idx").on(t.updatedAt),
  })
);

// ============================================================
// BRAND ASSETS — загруженные брендовые элементы (header/footer/logo/stamp/signature)
// ============================================================
export const brandAssets = pgTable(
  "brand_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: text("type").notNull(), // "header" | "footer" | "logo" | "stamp" | "signature"
    name: text("name").notNull(), // оригинальное имя файла
    mimeType: text("mime_type").notNull(),
    // путь внутри storage volume (например, "u/<userId>/brand/<uuid>.png")
    storagePath: text("storage_path").notNull(),
    sizeBytes: integer("size_bytes").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdTypeIdx: index("brand_assets_user_type_idx").on(t.userId, t.type),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Letter = typeof letters.$inferSelect;
export type NewLetter = typeof letters.$inferInsert;
export type BrandAsset = typeof brandAssets.$inferSelect;
export type NewBrandAsset = typeof brandAssets.$inferInsert;
