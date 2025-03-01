import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import pdfParse from 'pdf-parse';

@Injectable()
export class PdfService {
  constructor() {}

  /**
   * pdf를 text로 변환한다. public s3 url을 인자로 받는다.
   */
  async pdfToText(pdfUrl: string) {
    try {
      const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
      const data = await pdfParse(response.data);

      return data.text;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(`pdf 텍스트 변환 실패.`);
    }
  }
}
