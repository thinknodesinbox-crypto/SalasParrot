import { AssistantPanel } from './AssistantPanel';

interface AssistantDrawerProps {
  isOpen: boolean;
  initialThreadId?: string | null;
  onClose: () => void;
  onExpand: (threadId: string | null) => void;
}

export function AssistantDrawer({
  isOpen,
  initialThreadId = null,
  onClose,
  onExpand,
}: AssistantDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed inset-y-4 right-4 z-50 hidden w-[min(560px,calc(100vw-2rem))] lg:block">
        <AssistantPanel
          mode="drawer"
          initialThreadId={initialThreadId}
          onClose={onClose}
          onExpand={onExpand}
        />
      </div>
      <div className="fixed inset-0 z-50 lg:hidden">
        <div className="h-full w-full bg-[#F8FAFC] p-4">
          <AssistantPanel
            mode="drawer"
            initialThreadId={initialThreadId}
            onClose={onClose}
            onExpand={onExpand}
          />
        </div>
      </div>
    </>
  );
}
