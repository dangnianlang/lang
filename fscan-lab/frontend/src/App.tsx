import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Target, Map, Trophy, Languages } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Topology from './pages/Topology'
import Challenges from './pages/Challenges'
import { useI18n } from './contexts/I18nContext'
import { Button } from './components/ui/button'

function App() {
  const { language, setLanguage, t } = useI18n()

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <nav className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <h1 className="text-2xl font-bold text-primary">
                  {t('nav.title')}
                </h1>
                <div className="flex space-x-4">
                  <Link
                    to="/"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-accent"
                  >
                    <Trophy className="w-4 h-4" />
                    <span>{t('nav.dashboard')}</span>
                  </Link>
                  <Link
                    to="/topology"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-accent"
                  >
                    <Map className="w-4 h-4" />
                    <span>{t('nav.network')}</span>
                  </Link>
                  <Link
                    to="/challenges"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-accent"
                  >
                    <Target className="w-4 h-4" />
                    <span>{t('nav.challenges')}</span>
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {t('nav.subtitle')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                  className="flex items-center space-x-1"
                >
                  <Languages className="w-4 h-4" />
                  <span>{language === 'zh' ? 'EN' : '中文'}</span>
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/topology" element={<Topology />} />
            <Route path="/challenges" element={<Challenges />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
