import api from 'src/api';
import typia from 'typia';

export const test_api_getHello = async (connection: api.IConnection) => {
  const output = await api.functional.getHello(connection);
  typia.assert(output);
};
