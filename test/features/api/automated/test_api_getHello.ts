import typia from 'typia';

import api from '../../../../src/api';

export const test_api_getHello = async (connection: api.IConnection) => {
  const output: string = await api.functional.getHello(connection);
  typia.assert(output);
};
