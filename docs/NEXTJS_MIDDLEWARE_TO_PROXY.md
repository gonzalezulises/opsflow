# Next.js 16: convención `proxy` vs `middleware`

Next 16 depreca el nombre de archivo **`middleware.ts`** a favor de **`proxy.ts`** y la función
exportada `proxy` (mensaje de build: *middleware-to-proxy*). Ver guía:
https://nextjs.org/docs/messages/middleware-to-proxy

## OpsFlow (App Router con `src/`)

- Entrada del proxy: **`src/proxy.ts`** — exporta `proxy(request)` y `config.matcher`.
- Lógica compartida con Supabase SSR: **`src/lib/supabase/middleware.ts`** (`updateSession`).
- No debe existir **`src/middleware.ts`** duplicado; el codemod `npx @next/codemod@canary middleware-to-proxy .` renombra si aún tenéis el archivo antiguo.

Si el aviso de deprecación **sigue** apareciendo en builds antiguos, comprobad que el despliegue
no incluya un `middleware.ts` residual en la raíz del paquete que sube Vercel.

Tras cualquier cambio: `npm run build` y prueba de login + cookie de org.
