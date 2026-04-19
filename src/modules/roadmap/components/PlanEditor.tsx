'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Eye, Save, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Props = {
  content: string;
  onSave: (content: string) => Promise<void>;
  isLoading: boolean;
};

export function PlanEditor({ content, onSave, isLoading }: Props) {
  const [editContent, setEditContent] = useState(content);
  const [showPreview, setShowPreview] = useState(false);

  async function handleSave() {
    await onSave(editContent);
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={!showPreview ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowPreview(false)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <Button
            variant={showPreview ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Preview
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditContent(content)}
            disabled={isLoading}
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading || editContent === content}
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div className="glass-card min-h-[400px] max-w-none p-6 prose prose-sm dark:prose-invert">
          <ReactMarkdown>{editContent}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full min-h-[400px] rounded-xl border border-white/25 bg-background/70 px-4 py-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-white/10"
          placeholder={`# Overview\nProject overview...\n\n## Phase 1: Foundation\n### Goals\n- ...\n### Tasks\n- ...\n### Deliverables\n- ...`}
        />
      )}
    </div>
  );
}
