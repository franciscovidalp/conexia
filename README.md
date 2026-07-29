# CONEXIA

Plataforma web de Convivencia Educativa y apoyo psicosocial para establecimientos
educacionales. Incluye gestión de casos, protocolos RICE, diagnóstico y
sociometría, actividades preventivas, citaciones, derivaciones y reportes PDF.

## Desarrollo

Requisitos: Node.js 20 o superior y un proyecto Firebase.

```bash
npm install
cp .env.example .env.local
npm run dev
```

El modo de demostración es exclusivamente local y debe habilitarse de manera
explícita con `VITE_ENABLE_DEMO_MODE=true` y una clave propia en
`VITE_DEMO_PASSWORD`. Nunca debe activarse en producción.

## Seguridad y autenticación

- Producción falla de forma segura si falta la configuración Firebase.
- Las credenciales pertenecen exclusivamente a Firebase Authentication.
- Cada cuenta autenticada necesita un documento preaprovisionado `users/{uid}` y
  una ficha `staff/{rut}` coherente.
- No se almacenan contraseñas ni copias de datos Firestore en `localStorage`.
- Los cuestionarios públicos usan enlaces aleatorios que caducan en siete días.
- Las reglas de Firestore aplican separación por establecimiento y mínimo
  privilegio para las bitácoras clínicas.
- La matrícula usa la caché persistente de Firestore: se sincroniza desde servidor
  una vez al día por establecimiento y después se sirve desde IndexedDB.
- La administración puede reiniciar la matrícula de un establecimiento sin borrar
  el colegio, sus funcionarios ni la configuración general.

Copie `.env.example` y complete las variables sin versionar secretos. Después de
modificar las reglas, despliegue con:

```bash
firebase deploy --only firestore:rules
```

## Verificación

```bash
npm run build
npm run lint
```

El proyecto conserva deuda histórica de lint; el build TypeScript es la
verificación obligatoria antes de desplegar.

## Despliegue

La aplicación está configurada para Vercel. Configure allí las variables Firebase
de producción y mantenga `VITE_ENABLE_DEMO_MODE` deshabilitado.
