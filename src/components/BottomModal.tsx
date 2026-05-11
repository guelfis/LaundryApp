import { Drawer } from 'vaul';

interface BottomModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function BottomModal({ isOpen, onClose, children, title }: BottomModalProps) {
  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        {/* Dark overlay with blur */}
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex flex-col rounded-t-[2.5rem] bg-white outline-none max-w-md mx-auto">
          <div className="flex-1 rounded-t-[2.5rem] bg-white p-8">
            {/* Drag Handle */}
            <div className="mx-auto mb-6 h-1.5 w-12 shrink-0 rounded-full bg-gray-200" />
            
            {title && (
              <Drawer.Title className="mb-2 text-xl font-bold text-gray-900">
                {title}
              </Drawer.Title>
            )}
            
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
