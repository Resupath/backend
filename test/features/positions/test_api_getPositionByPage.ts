import api from 'src/api';
import typia from 'typia';

export const test_api_getPositionByPage = async (connection: api.IConnection) => {
  const output = await api.functional.positions.getPositionByPage(connection, {});
  typia.assert(output);

  return output;
};
