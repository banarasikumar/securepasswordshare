import { useState } from 'react';
import ConfirmationDialog from '../ConfirmationDialog';
import { Button } from '@/components/ui/button';
import { ThemeProvider } from '../ThemeProvider';

export default function ConfirmationDialogExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ThemeProvider defaultTheme="dark">
      <div className="p-8 space-y-4">
        <Button onClick={() => setIsOpen(true)}>
          Open Confirmation Dialog
        </Button>
        
        <ConfirmationDialog
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => {
            console.log('Confirmed!');
            setIsOpen(false);
          }}
          title="Confirm Deletion"
          message="सभी passwords यहां से permanently delete हो जाएगा क्या आप सहमत हैं?"
          confirmText="हां"
          cancelText="नहीं"
        />
      </div>
    </ThemeProvider>
  );
}