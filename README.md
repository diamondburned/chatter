# chatter

A small chat server and application designed to be easily self-hostable by
anyone using any free serverless hosting service (e.g., Vercel and Netlify).

## Developing

Before any development, you must have a `.env` or `.envrc` file in the root
directory of the project. This file must contain these environment variables:

```sh
DATABASE_URL="postgres://..."
```

If you're not in my group (you probably aren't), then you will also need
to migrate your database prior to running it:

```sh
npm run prisma-reset-prod
```

**BEWARE** that this will wipe your database and replace it with the
production database. If you're not in my group, you probably don't want to
do this.

### Running

Do

```sh
npm run prisma # only need to run this the first time
npm run dev
```

### Testing

You need `npm run dev` running on one terminal. On the other, do:

```sh
npm run test
```

### Folder Structure

```
- src
  - components/      -- frontend components
  - layouts/	     -- frontend page layouts
  - pages/
    - api/           -- backend api implementation
	- index.astro    -- app page for chats
	- login.astro    -- login page
	- register.astro -- registration page
```
