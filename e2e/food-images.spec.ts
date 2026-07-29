import { expect, test, type Page } from '@playwright/test';

const jpeg = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABAf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=', 'base64');

async function installSession(page: Page, roles: string[]) {
  await page.addInitScript(({ storedRoles }) => {
    localStorage.setItem('token', 'e2e-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, email: 'e2e@reservapp.test', roles: storedRoles }));
  }, { storedRoles: roles });
}

test('administrador crea, reemplaza, quita la imagen y elimina la comida', async ({ page }) => {
  await installSession(page, ['Administrador']);
  let foods: any[] = [{ id: 1, foodTypeId: 1, name: 'Comida existente', isSpecial: false, isActive: true, imageUrl: '/uploads/foods/1/existing.jpg' }];
  let nextId = 2;

  page.on('dialog', dialog => dialog.accept());
  await page.route('**/uploads/**', route => route.fulfill({ status: 200, contentType: 'image/jpeg', body: jpeg }));
  await page.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api', '');
    if (path === '/auth/me') return route.fulfill({ json: { valid: true, user: { id: 1, email: 'e2e@reservapp.test', nombre: 'Admin', apellido: 'E2E', roles: ['Administrador'], activo: 1 } } });
    if (path === '/food-types' && request.method() === 'GET') return route.fulfill({ json: [{ id: 1, name: 'Principal', description: null }] });
    if (path === '/foods' && request.method() === 'GET') return route.fulfill({ json: foods });
    if (path === '/foods' && request.method() === 'POST') {
      const created = { id: nextId++, ...request.postDataJSON(), imageUrl: null };
      foods = [created, ...foods];
      return route.fulfill({ status: 201, json: created });
    }
    const imageMatch = path.match(/^\/foods\/(\d+)\/image$/);
    if (imageMatch && request.method() === 'PATCH') {
      const id = Number(imageMatch[1]);
      const food = foods.find(item => item.id === id);
      food.imageUrl = `/uploads/foods/${id}/e2e-${Date.now()}.jpg`;
      return route.fulfill({ json: { message: 'Imagen actualizada', food } });
    }
    if (imageMatch && request.method() === 'DELETE') {
      const food = foods.find(item => item.id === Number(imageMatch[1]));
      food.imageUrl = null;
      return route.fulfill({ json: { message: 'Imagen eliminada', food } });
    }
    const foodMatch = path.match(/^\/foods\/(\d+)$/);
    if (foodMatch && request.method() === 'PATCH') {
      const food = foods.find(item => item.id === Number(foodMatch[1]));
      Object.assign(food, request.postDataJSON());
      return route.fulfill({ json: { message: 'Actualizada', food } });
    }
    const deleteMatch = path.match(/^\/foods\/hard\/(\d+)$/);
    if (deleteMatch && request.method() === 'DELETE') {
      foods = foods.filter(item => item.id !== Number(deleteMatch[1]));
      return route.fulfill({ json: { message: 'Eliminada' } });
    }
    return route.fulfill({ status: 404, json: { message: `Mock faltante: ${request.method()} ${path}` } });
  });

  await page.goto('/gestion-comida');
  await expect(page.getByRole('heading', { name: 'Gestion de Comidas' })).toBeVisible();
  await page.getByRole('button', { name: 'Crear comida' }).click();
  await page.getByLabel('Nombre').fill('Comida E2E');
  await page.getByLabel('Tipo').selectOption('1');
  await page.locator('#food-image').setInputFiles({ name: 'food.jpg', mimeType: 'image/jpeg', buffer: jpeg });
  await page.getByRole('button', { name: 'Guardar' }).click();

  let row = page.getByRole('row', { name: /Comida E2E/ });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Editar' }).click();
  await page.locator('#food-image').setInputFiles({ name: 'replacement.jpeg', mimeType: 'image/jpeg', buffer: jpeg });
  await page.getByRole('button', { name: 'Guardar' }).click();

  row = page.getByRole('row', { name: /Comida E2E/ });
  await row.getByRole('button', { name: 'Editar' }).click();
  await page.getByRole('button', { name: 'Quitar imagen' }).click();
  await expect(page.getByText('Sin imagen').last()).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar' }).click();

  row = page.getByRole('row', { name: /Comida E2E/ });
  await row.getByRole('button', { name: 'Eliminar' }).click();
  await expect(page.getByRole('row', { name: /Comida E2E/ })).toHaveCount(0);
});

test('empleado no puede entrar a gestion administrativa', async ({ page }) => {
  await installSession(page, ['Empleado']);
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/me')) return route.fulfill({ json: { valid: true, user: { id: 2, email: 'empleado@reservapp.test', roles: ['Empleado'], activo: 1 } } });
    return route.fulfill({ status: 404, json: { message: 'Sin datos de prueba' } });
  });
  await page.goto('/gestion-comida');
  await expect(page).toHaveURL(/\/menu$/);
  await expect(page.getByRole('heading', { name: /menú del día/i })).toBeVisible();
});
