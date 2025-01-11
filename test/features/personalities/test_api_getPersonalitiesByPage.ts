import api from 'src/api';
import typia from 'typia';

export const test_api_getPersonalitiesByPage = async (connection: api.IConnection) => {
  const output = await api.functional.personalities.getPersonalitiesByPage(connection, {});
  typia.assert(output);

  return output;
};
