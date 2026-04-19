'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { File, Folder, FolderOpen, Github } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  getConnectionStatus,
  getFileTree,
  getFileContent,
  type FileTreeNode,
} from '../actions';

interface Props {
  projectId: string;
}

type TreeNode = {
  name: string;
  path: string;
  type: 'tree' | 'blob';
  children: Map<string, TreeNode>;
};

function buildTree(nodes: FileTreeNode[]): TreeNode {
  const root: TreeNode = { name: '', path: '', type: 'tree', children: new Map() };
  for (const node of nodes) {
    const parts = node.path.split('/');
    let cur = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      if (!cur.children.has(part)) {
        cur.children.set(part, {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          type: isLast ? node.type : 'tree',
          children: new Map(),
        });
      }
      cur = cur.children.get(part)!;
    }
  }
  return root;
}

function FileTree({
  node,
  onSelect,
  selected,
  depth = 0,
}: {
  node: TreeNode;
  onSelect: (path: string) => void;
  selected: string | null;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth < 1);

  if (node.type === 'blob') {
    return (
      <button
        onClick={() => onSelect(node.path)}
        className={`flex w-full items-center gap-1 rounded-lg px-2 py-1 text-left text-sm transition-colors hover:bg-accent ${
          selected === node.path ? 'bg-accent font-medium' : ''
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <File className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  // tree
  const children = Array.from(node.children.values()).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      {node.name && (
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-1 rounded-lg px-2 py-1 text-left text-sm transition-colors hover:bg-accent"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {open ? <FolderOpen className="h-3.5 w-3.5 shrink-0" /> : <Folder className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{node.name}</span>
        </button>
      )}
      {(open || !node.name) && (
        <div>
          {children.map((child) => (
            <FileTree
              key={child.path}
              node={child}
              onSelect={onSelect}
              selected={selected}
              depth={node.name ? depth + 1 : depth}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CodeBrowser({ projectId }: Props) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('text');
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  useEffect(() => {
    (async () => {
      const status = await getConnectionStatus(projectId);
      const isConnected = !!(status.success && status.data?.hasRepo);
      setConnected(isConnected);
      if (!isConnected) return;

      const treeRes = await getFileTree(projectId);
      if (treeRes.success && treeRes.data) {
        setTree(buildTree(treeRes.data));
      }
    })();
  }, [projectId]);

  async function handleSelect(path: string) {
    setSelectedPath(path);
    setIsLoadingFile(true);
    setFileContent(null);
    const res = await getFileContent(projectId, path);
    if (res.success && res.data) {
      setFileContent(res.data.content);
      setLanguage(res.data.language);
    } else {
      setFileContent('// Failed to load file');
    }
    setIsLoadingFile(false);
  }

  if (connected === null) {
    return (
      <div className="p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Card className="max-w-md space-y-4 p-8 text-center">
          <Github className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-semibold">No repository connected</h2>
          <p className="text-sm text-muted-foreground">
            Connect a GitHub repository in project settings to browse code here.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4 p-4 md:p-6">
      <aside className="glass-card soft-scrollbar w-72 shrink-0 overflow-y-auto p-2">
        {tree ? (
          <FileTree node={tree} onSelect={handleSelect} selected={selectedPath} />
        ) : (
          <Skeleton className="h-64 w-full" />
        )}
      </aside>
      <main className="glass-card soft-scrollbar flex-1 overflow-auto">
        {!selectedPath && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Select a file to view its contents
          </div>
        )}
        {selectedPath && (
          <div>
            <div className="border-b border-white/20 bg-muted/40 px-4 py-2 text-sm font-mono dark:border-white/10">{selectedPath}</div>
            {isLoadingFile && <Skeleton className="m-4 h-64" />}
            {!isLoadingFile && fileContent && (
              <SyntaxHighlighter
                language={language}
                style={vscDarkPlus}
                showLineNumbers
                customStyle={{ margin: 0, fontSize: '0.85rem' }}
              >
                {fileContent}
              </SyntaxHighlighter>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
