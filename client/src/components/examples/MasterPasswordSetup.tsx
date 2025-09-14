import MasterPasswordSetup from '../MasterPasswordSetup';
import { ThemeProvider } from '../ThemeProvider';

export default function MasterPasswordSetupExample() {
  return (
    <ThemeProvider defaultTheme="dark">
      <MasterPasswordSetup
        onCreateMaster={(password) => console.log('Master password created:', password)}
        onBack={() => console.log('Back clicked')}
      />
    </ThemeProvider>
  );
}