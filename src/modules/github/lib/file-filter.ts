const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.go', '.rs', '.java', '.kt', '.swift',
  '.rb', '.php', '.cs', '.cpp', '.cc', '.c', '.h', '.hpp',
  '.scala', '.lua', '.dart', '.elm', '.clj', '.ex', '.exs',
  '.sh', '.bash', '.zsh', '.fish',
  '.md', '.mdx', '.rst',
  '.yaml', '.yml', '.toml', '.json',
  '.sql', '.graphql', '.gql',
  '.html', '.css', '.scss', '.sass', '.less',
  '.vue', '.svelte',
]);

const EXCLUDED_DIRS = [
  'node_modules/',
  'dist/',
  'build/',
  '.next/',
  '.nuxt/',
  '.turbo/',
  'out/',
  'coverage/',
  'vendor/',
  '__pycache__/',
  '.venv/',
  'venv/',
  'target/',
  '.git/',
  '.idea/',
  '.vscode/',
  'public/',
  '.cache/',
];

const EXCLUDED_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'Cargo.lock',
  'Gemfile.lock',
  'composer.lock',
  'poetry.lock',
  'Pipfile.lock',
]);

const MAX_FILE_SIZE = 200 * 1024; // 200 KB
const MAX_LARGE_DATA_SIZE = 50 * 1024; // 50 KB cap for JSON/YAML/lockfiles

function getExtension(filepath: string): string {
  const idx = filepath.lastIndexOf('.');
  if (idx === -1) return '';
  return filepath.slice(idx).toLowerCase();
}

function basename(filepath: string): string {
  const idx = filepath.lastIndexOf('/');
  return idx === -1 ? filepath : filepath.slice(idx + 1);
}

export function shouldIndexFile(
  filepath: string,
  size: number
): { include: boolean; reason?: string } {
  // Excluded dir prefixes
  for (const dir of EXCLUDED_DIRS) {
    if (filepath.startsWith(dir) || filepath.includes(`/${dir}`)) {
      return { include: false, reason: 'excluded directory' };
    }
  }

  const name = basename(filepath);
  if (EXCLUDED_FILES.has(name)) {
    return { include: false, reason: 'lockfile' };
  }

  const ext = getExtension(filepath);
  if (!CODE_EXTENSIONS.has(ext)) {
    return { include: false, reason: 'extension not in allowlist' };
  }

  const isLargeData = ext === '.json' || ext === '.yaml' || ext === '.yml';
  const maxSize = isLargeData ? MAX_LARGE_DATA_SIZE : MAX_FILE_SIZE;
  if (size > maxSize) {
    return { include: false, reason: `file too large (${size} bytes)` };
  }

  return { include: true };
}

export function detectLanguage(filepath: string): string {
  const ext = getExtension(filepath);
  const map: Record<string, string> = {
    '.ts': 'typescript', '.tsx': 'typescript',
    '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
    '.py': 'python', '.go': 'go', '.rs': 'rust', '.java': 'java',
    '.kt': 'kotlin', '.swift': 'swift', '.rb': 'ruby', '.php': 'php',
    '.cs': 'csharp', '.cpp': 'cpp', '.cc': 'cpp', '.c': 'c', '.h': 'c', '.hpp': 'cpp',
    '.md': 'markdown', '.mdx': 'markdown',
    '.yaml': 'yaml', '.yml': 'yaml', '.toml': 'toml', '.json': 'json',
    '.sql': 'sql', '.html': 'html', '.css': 'css', '.scss': 'scss',
    '.vue': 'vue', '.svelte': 'svelte',
  };
  return map[ext] || 'text';
}
