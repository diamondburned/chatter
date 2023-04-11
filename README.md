# chatter

A small chat server and application designed to be easily self-hostable by
anyone using any free serverless hosting service (e.g., Vercel and Netlify).

## Developing

### Running

Do

```sh
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
