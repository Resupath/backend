import api from 'src/api';
import { Auth } from 'src/interfaces/auth.interface';
import typia from 'typia';

export const test_api_refresh = async (connection: api.IConnection, refreshToken?: string) => {
  const input: Auth.RefreshRequest = {
    refreshToken: refreshToken ?? (process.env.TEST_REFRESH_TOKEN as string),
  };

  const output = await api.functional.auth.refresh(connection, input);
  typia.assert(output);

  return output;
};
