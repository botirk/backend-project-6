import paths from '../server/routes/paths.js';

export const login = async (app, email = 'testEmail') => {
  await app.inject({
    method: 'POST',
    url: paths.users(),
    payload: {
      data: {
        firstName: 'testUser', lastName: 'testUser', email, password: 'testPassword',
      },
    },
  });

  const user = await app.inject({
    method: 'POST',
    url: paths.session(),
    payload: { data: { email, password: 'testPassword' } },
  });

  return (options) => app.inject({
    ...options,
    cookies: {
      ...(options.cookies ?? {}),
      session: user.cookies.find((cookie) => cookie.name === 'session').value,
    },
  });
};

export const createStatus = (name = 'testStatus') => ({
  method: 'POST',
  url: paths.statuses(),
  payload: { data: { name } },
});

export const createLabel = (name = 'testLabel') => ({
  method: 'POST',
  url: paths.labels(),
  payload: { data: { name } },
});

export const deleteStatus = (id) => ({
  method: 'POST',
  url: paths.editDeleteStatus(id),
  payload: { _method: 'delete' },
});
