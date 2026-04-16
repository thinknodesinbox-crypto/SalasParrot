import { Suspense, lazy } from 'react';

import type { RichTextEditorProps } from './RichTextEditor';

const RichTextEditor = lazy(async () => {
  const module = await import('./RichTextEditor');
  return { default: module.RichTextEditor };
});

export function LazyRichTextEditor(props: RichTextEditorProps) {
  return (
    <Suspense fallback={<RichTextEditorFallback minHeight={props.minHeight} />}>
      <RichTextEditor {...props} />
    </Suspense>
  );
}

function RichTextEditorFallback({ minHeight = '150px' }: { minHeight?: string }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white">
      <div className="flex items-center gap-1 border-b border-[#E2E8F0] px-2 py-1.5">
        <div className="h-7 w-7 rounded bg-[#F1F5F9]" />
        <div className="h-7 w-7 rounded bg-[#F1F5F9]" />
        <div className="h-7 w-7 rounded bg-[#F1F5F9]" />
      </div>
      <div className="space-y-2 px-3 py-3" style={{ minHeight }}>
        <div className="h-3 w-1/3 rounded bg-[#F8FAFC]" />
        <div className="h-3 w-full rounded bg-[#F8FAFC]" />
        <div className="h-3 w-5/6 rounded bg-[#F8FAFC]" />
      </div>
    </div>
  );
}
