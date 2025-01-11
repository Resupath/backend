import api from 'src/api';
import typia from 'typia';

export const test_api_getAllExperiences = async (connection: api.IConnection) => {
  const output = await api.functional.experiences.getAllExperiences(connection);
  typia.assert(output);

  return output;
};
