import api from 'src/api';
import { Experience } from 'src/interfaces/experiences.interface';
import typia from 'typia';

export const test_api_updateExperience = async (
  connection: api.IConnection,
  id: Experience['id'],
  body: Experience.UpdateRequest,
) => {
  const output = await api.functional.experiences.updateExperience(connection, id, body);
  typia.assert(output);

  return output;
};
