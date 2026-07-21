# LetterCraft

Конструктор корпоративных писем на фирменном бланке. Мигрирован из Lovable в собственный стек.

## Стек

- **Frontend:** React 18 + Vite + TypeScript + TailwindCSS, PWA (vite-plugin-pwa)
- **Backend:** Node.js 20 + Express + TypeScript
- **БД:** PostgreSQL 16 + Drizzle ORM
- **Auth:** Magic link (email) + JWT-сессии в БД (с возможностью отзыва)
- **Storage:** локальный volume `/data/lettercraft-storage` для брендовых ассетов
- **Деплой:** Docker Compose в Coolify (VPS-1)

## Возможности

- Редактор письма в формате A4: реквизиты, шапка/футтер/лого, печать и подпись (с drag-and-drop в графическом режиме)
- Шаблоны форматирования (Arimo, Involve, Evolventa), цвет/размер шрифта, выравнивание
- Экспорт в PDF, PNG, JSON
- Сохранение черновиков на сервере (привязаны к пользователю)
- Загрузка брендовых ассетов (header/footer/logo/stamp/signature) на сервер
- Адаптивная мобильная верстка (мобильный таб-навигатор)
- **PWA:** установка на телефон как обычное приложение
- Авторизация по magic link (только для пользователей из whitelist)

## Структура

```
lettercraft/
├── apps/
│   ├── api/           # Express + Drizzle
│   │   ├── src/
│   │   │   ├── db/        # schema, seed, migrations
│   │   │   ├── routes/    # auth, letters, brand
│   │   │   ├── middleware/# auth, errors
│   │   │   ├── lib/       # mail, magic-link
│   │   │   └── server.ts
│   │   └── Dockerfile
│   └── web/           # React + Vite + PWA
│       ├── src/
│       │   ├── components/
│       │   │   ├── TigerLetter/   # главный конструктор
│       │   │   ├── ui/            # shadcn-style компоненты
│       │   │   ├── PwaInstallPrompt.tsx
│       │   │   └── ProtectedRoute.tsx
│       │   ├── pages/        # Login, AuthVerify, Index, NotFound
│       │   ├── contexts/     # AuthContext
│       │   ├── lib/          # api.ts (HTTP-клиент), utils.ts
│       │   ├── assets/       # logo
│       │   └── main.tsx
│       ├── public/       # иконки PWA
│       ├── nginx.conf
│       └── Dockerfile
├── docker-compose.yaml
├── .env.example
└── package.json (workspace root)
```

## Локальная разработка

```bash
# Поднять только БД
docker compose up -d db

# Запустить API (миграции применятся автоматически)
cd apps/api && npm install && npm run dev

# Запустить фронт (с proxy на API)
cd apps/web && npm install && npm run dev
# открыть http://localhost:8080
```

При первом старте seed вставит 6 пользователей из `apps/api/src/db/seed.ts`.

## Деплой в Coolify

1. Залить репозиторий в GitHub.
2. В Coolify → New → Application → Public/Private Repository → указать `firstbeelancer/lettercraft`, ветка `main`.
3. Build Pack: `Docker Compose`, `docker-compose.yaml` в корне.
4. Порты: web слушает 80, traefik маршрутизирует по домену.
5. Домен: `lettercraft.tigerapps.pro` (FQDN).
6. Env (см. `.env.example`):
   - `JWT_SECRET` — сгенерировать случайную строку
   - `APP_URL` — `https://lettercraft.tigerapps.pro`
   - `CORS_ORIGINS` — то же
   - `SMTP_*` — опционально (если не заполнять — magic link в логах)
7. Запустить деплой.
8. В reg.ru: A-запись `lettercraft` → `82.21.153.180`.
9. Дождаться SSL, проверить `https://lettercraft.tigerapps.pro/`.

## Whitelist пользователей

Список задан в `apps/api/src/db/seed.ts`. Чтобы добавить нового пользователя:

```sql
INSERT INTO users (email, name, role) VALUES ('new@tehgid.com', 'Имя', 'user');
```

Либо расширьте seed-файл и дождитесь следующего деплоя (он идемпотентный — существующих не дублирует).

## Magic link без SMTP

Если SMTP не настроен, при запросе magic link в логах API появится:

```
========================================
[mail] MAGIC LINK for user@tehgid.com
https://lettercraft.tigerapps.pro/auth/verify?token=...
========================================
```

Скопируйте ссылку и откройте в браузере.

## API (для разработчиков)

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/v1/auth/magic-link` | Запросить magic link на email |
| GET | `/api/v1/auth/verify?token=...` | Подтвердить токен, получить JWT |
| GET | `/api/v1/auth/me` | Текущий пользователь |
| POST | `/api/v1/auth/logout` | Завершить сессию |
| GET | `/api/v1/letters` | Список черновиков |
| POST | `/api/v1/letters` | Создать черновик |
| GET | `/api/v1/letters/:id` | Получить черновик |
| PATCH | `/api/v1/letters/:id` | Обновить |
| DELETE | `/api/v1/letters/:id` | Удалить |
| GET | `/api/v1/brand` | Список брендовых ассетов |
| POST | `/api/v1/brand` | Загрузить (multipart: type, file) |
| GET | `/api/v1/brand/:id/file` | Скачать файл |
| DELETE | `/api/v1/brand/:id` | Удалить |

Все защищённые эндпойнты ждут `Authorization: Bearer <jwt>`.
