# ReservApp Frontend

Cliente React y TypeScript de ReservApp. Incluye rutas por rol, menu y reservas, gestion administrativa y el ciclo completo de imagenes de comidas: vista previa, carga, reemplazo y eliminacion.

## Inicio rapido

```powershell
npm install
npm start
```

El frontend usa `http://localhost:3000` y espera la API configurada en `REACT_APP_API_URL` (por defecto `http://localhost:3001/api`). Copia los valores necesarios desde `.env.example` a un `.env` local; ese archivo no se versiona.

## Verificacion

```powershell
npm run typecheck
npm run lint
$env:CI='true'; npm test -- --watchAll=false --runInBand
npm run build
npm run test:e2e
```

Los E2E interceptan la API en el navegador: prueban el flujo de imagenes y la autorizacion sin cuentas Firebase reales ni cambios sobre MySQL.

La documentacion completa esta en `../TP_ReservApp_Backend/docs/`.
