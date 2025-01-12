export namespace NotionUtil {
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

  const privateNotionIdRegex = /https?:\/\/(www\.)?notion\.so\/(?:[^/]+\/)?[^\s/]*?([a-f0-9]{32})(?:\?[^\s]*)?$/;

  /**
   * 노션 private url에서 id 부분을 반환한다.
   * private url 형식이 아니거나, id가 추출되지 않으면 null을 반환한다.
   */
  export function getPrivateNotionId(url: string): string | null {
    const match = url.match(privateNotionIdRegex);
    return match ? match[2] : null;
  }
}
