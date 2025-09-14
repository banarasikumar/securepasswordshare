import HomePage from '../HomePage';
import { ThemeProvider } from '../ThemeProvider';

export default function HomePageExample() {
  return (
    <ThemeProvider defaultTheme="dark">
      <HomePage
        onPasswordSubmit={(password) => console.log('Password submitted:', password)}
        onSetupMaster={() => console.log('Setup master clicked')}
        hasMasterPassword={true}
        isLoading={false}
      />
    </ThemeProvider>
  );
}