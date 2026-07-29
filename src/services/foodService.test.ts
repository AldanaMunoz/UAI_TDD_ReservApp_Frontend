import api from './api';
import foodService from './foodService';

jest.mock('./api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

test('envia la imagen como multipart con el campo image', async () => {
  const image = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xff, 0xd9])], 'comida.jpg', {
    type: 'image/jpeg',
  });
  const food = { id: 12, name: 'Milanesa', imageUrl: '/uploads/foods/12/comida.jpg' };
  mockedApi.patch.mockResolvedValueOnce({ data: { message: 'ok', food } } as any);

  await foodService.uploadImage(12, image);

  expect(mockedApi.patch).toHaveBeenCalledWith(
    '/foods/12/image',
    expect.any(FormData),
    expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
  );
  const body = mockedApi.patch.mock.calls[0][1] as FormData;
  expect(body.get('image')).toBe(image);
});

test('usa el endpoint dedicado para quitar una imagen', async () => {
  mockedApi.delete.mockResolvedValueOnce({ data: { message: 'ok', food: { id: 12, name: 'Milanesa', imageUrl: null } } } as any);
  await foodService.deleteImage(12);
  expect(mockedApi.delete).toHaveBeenCalledWith('/foods/12/image');
});
