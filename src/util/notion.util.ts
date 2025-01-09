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
}
