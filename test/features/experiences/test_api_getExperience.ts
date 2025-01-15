import api from 'src/api';
import { Experience } from 'src/interfaces/experiences.interface';
import typia from 'typia';

export const test_api_getExperience = async (connection: api.IConnection, id: Experience['id']) => {
  const output = await api.functional.experiences.getExperience(connection, id);
  typia.assert(output);

  return output;
};
