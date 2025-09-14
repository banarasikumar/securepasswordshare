import AdminPage from '../AdminPage';
import { ThemeProvider } from '../ThemeProvider';

export default function AdminPageExample() {
  return (
    <ThemeProvider defaultTheme="dark">
      <AdminPage
        onSaveEntry={(title, fields) => console.log('Entry saved:', { title, fields })}
        onBack={() => console.log('Back clicked')}
      />
    </ThemeProvider>
  );
}