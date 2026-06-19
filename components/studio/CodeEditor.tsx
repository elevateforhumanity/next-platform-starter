'use client';

import dynamic from 'next/dynamic';

// Monaco is 75 MB — load only when the editor is actually rendered.
const Editor = dynamic(() => import('@monaco-editor/react').then((m) => m.Editor), {
  ssr: false,
  loading: () => <div className="h-full bg-[#1e1e1e] animate-pulse" />,
});

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  filePath?: string;
  language?: string;
  readOnly?: boolean;
}

/** Infer Monaco language from file extension. */
function detectLanguage(filePath?: string, fallback = 'typescript'): string {
  if (!filePath) return fallback;
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
    json: 'json', jsonc: 'json',
    css: 'css', scss: 'scss', sass: 'scss',
    html: 'html', htm: 'html',
    md: 'markdown', mdx: 'markdown',
    yml: 'yaml', yaml: 'yaml',
    sh: 'shell', bash: 'shell', zsh: 'shell',
    py: 'python',
    sql: 'sql',
    txt: 'plaintext',
    xml: 'xml', svg: 'xml',
    graphql: 'graphql', gql: 'graphql',
    tf: 'hcl', toml: 'ini', env: 'ini',
  };
  const basename = filePath.split('/').pop()?.toLowerCase() ?? '';
  if (basename === 'dockerfile') return 'dockerfile';
  if (basename === '.env' || basename.startsWith('.env.')) return 'ini';
  return map[ext] ?? 'plaintext';
}

export default function CodeEditor({
  value,
  onChange,
  filePath,
  language,
  readOnly = false,
}: CodeEditorProps) {
  const resolvedLanguage = language ?? detectLanguage(filePath);

  return (
    <Editor
      height="100%"
      language={resolvedLanguage}
      value={value}
      onChange={onChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: 'on',
        readOnly,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        insertSpaces: true,
        formatOnPaste: true,
        bracketPairColorization: { enabled: true },
        renderLineHighlight: 'all',
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        folding: true,
      }}
    />
  );
}
