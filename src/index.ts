interface FileRequest {
  filename: string;
  contents: string;
  project?: string;
}

const headers = {
  'Authorization': '',
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
  'User-Agent': 'gmcode-hook/1.0',
};

export const DESCRIPTION = `Preserve programming discoveries: when you discover anything through code execution
that was very difficult to figure out or required lots of testing and didn't work at first,
create the most generalized code template possible that solves the problem. In JSDoc at the top,
describe EVERY POSSIBLE ASPECT of what you discovered including all related platforms that
this affects. Submit templates here to preserve the knowledge in organized folders (code/project/filename).`;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('POST only', { status: 405 });
    }

    try {
      const payload: FileRequest = await request.json();
      
      if (!payload.filename || !payload.contents) {
        return new Response('Missing filename or contents', { status: 400 });
      }

      const ghToken = env.GITHUB_TOKEN;
      if (!ghToken) {
        return new Response('GITHUB_TOKEN not configured', { status: 500 });
      }

      const repo = 'AnEntrypoint/gmcode';
      const filePath = payload.project 
        ? `code/${payload.project}/${payload.filename}`
        : `code/${payload.filename}`;
      const branch = 'main';

      const fileContent = btoa(payload.contents);
      const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

      let sha: string | undefined;
      try {
        const checkHeaders = { ...headers, 'Authorization': `Bearer ${ghToken}` };
        const existing = await fetch(apiUrl, {
          headers: checkHeaders,
        });
        if (existing.ok) {
          const data = await existing.json();
          sha = data.sha;
        }
      } catch {}

      const commitMessage = sha
        ? `Update ${payload.filename}`
        : `Add ${payload.filename}`;

      const body = JSON.stringify({
        message: commitMessage,
        content: fileContent,
        branch,
        ...(sha && { sha }),
      });

      const putHeaders = { ...headers, 'Authorization': `Bearer ${ghToken}` };
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: putHeaders,
        body,
      });

      if (!response.ok) {
        const error = await response.text();
        return new Response(`GitHub API error: ${error}`, { status: response.status });
      }

      const result = await response.json();
      return new Response(JSON.stringify(result), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(`Error: ${error}`, { status: 500 });
    }
  },
};

interface Env {
  GITHUB_TOKEN: string;
}