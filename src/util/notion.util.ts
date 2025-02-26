export namespace NotionUtil {
  /**
   * 노션 OAuth 인증 응답값
   */
  export interface AuthorizationResponse {
    access_token: string;
    bot_id: string;
    duplicated_template_id: string | null;
    owner: {
      type: 'user';
      user: {
        object: 'user';
        id: string;
        name: string;
        avatar_url: string;
        type: 'person' | 'bot';
        person: { email: string };
      };
    };
    workspace_id: string;
    workspace_name?: string;
    workspace_icon?: string;
  }

  /**
   * 노션 페이지 마크다운 변환 응답값
   */
  export interface ToMarkdownResponse {
    content: string;
  }

  /**
   * 노션 연동 페이지 목록 응답값
   */
  export interface VerifyPageResponse {
    id: string;
    title: string;
    url: string;
  }
  /**
   * 노션 프라이빗 페이지 아이디 추출 정규식
   */
  export const privateNotionIdRegex = /https?:\/\/(www\.)?notion\.so\/(?:[^/]+\/)?[^\s/]*?([a-f0-9]{32})(?:\?[^\s]*)?$/;
}
