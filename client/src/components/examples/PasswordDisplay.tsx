import PasswordDisplay from '../PasswordDisplay';
import { ThemeProvider } from '../ThemeProvider';

export default function PasswordDisplayExample() {
  // Mock data for demonstration
  const mockEntries = [
    {
      id: "1",
      title: "Gmail Account",
      fields: [
        { name: "Username", value: "user@gmail.com", isPassword: false },
        { name: "Password", value: "mySecretPassword123", isPassword: true },
        { name: "Recovery Email", value: "backup@gmail.com", isPassword: false }
      ],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    },
    {
      id: "2", 
      title: "Bank Login",
      fields: [
        { name: "Account Number", value: "1234567890", isPassword: false },
        { name: "PIN", value: "9876", isPassword: true },
        { name: "Phone", value: "+91 9876543210", isPassword: false }
      ],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  ];

  return (
    <ThemeProvider defaultTheme="dark">
      <PasswordDisplay
        entries={mockEntries}
        onBack={() => console.log('Back clicked')}
        onDeleteAll={() => console.log('Delete all clicked')}
        onGoToAdmin={() => console.log('Go to admin clicked')}
        isLoading={false}
      />
    </ThemeProvider>
  );
}