import api from 'src/api';
import typia from 'typia';

export const test_api_createUser = async (connection: api.IConnection) => {
  const output = await api.functional.auth.user.createUser(connection);
  typia.assert(output);

  return output;
};
