import api from 'src/api';
import { Experience } from 'src/interfaces/experiences.interface';
import typia from 'typia';

export const test_api_createExperiences = async (connection: api.IConnection, input?: Experience.CreateRequest) => {
  const newInput: Experience.CreateRequest = input ?? {
    experiences: new Array(1).fill(0).map((el, index) => {
      return {
        companyName: `test_companyName_${index}`,
        startDate: `202${index}-01-01`,
        endDate: `202${index}-12-01`,
        position: 'BackEnd',
        sequence: index,
        description: `test_description_${index}`,
      };
    }),
  };

  const output = await api.functional.experiences.createExperiences(connection, newInput);
  typia.assert(output);
};
