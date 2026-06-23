import { useEffect, useState } from 'react'
import { Trophy, Target, Clock, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getProgress, getChallenges, resetProgress, type Progress as ProgressType, type Challenge } from '@/lib/api'
import { useI18n } from '@/contexts/I18nContext'

export default function Dashboard() {
  const { t } = useI18n()
  const [progress, setProgress] = useState<ProgressType | null>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [progressData, challengesData] = await Promise.all([
        getProgress(),
        getChallenges(),
      ])
      setProgress(progressData)
      setChallenges(challengesData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleReset = async () => {
    if (confirm(t('dashboard.resetConfirm'))) {
      await resetProgress()
      await loadData()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t('dashboard.loading')}</div>
      </div>
    )
  }

  const totalChallenges = challenges.length
  const completedChallenges = progress?.completed_challenges.length || 0
  const completionRate = totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0
  const maxScore = challenges.reduce((sum, c) => sum + c.points, 0)

  const recentSubmissions = progress?.submission_history.slice(-5).reverse() || []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('dashboard.welcome')}
          </p>
        </div>
        <Button variant="outline" onClick={handleReset}>
          {t('dashboard.resetProgress')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalScore')}</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress?.total_score || 0}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.maxScore')} {maxScore} {t('common.points')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.completedChallenges')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedChallenges} / {totalChallenges}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.completionRate')} {completionRate.toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.startTime')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress ? new Date(progress.start_time).toLocaleDateString() : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {progress ? new Date(progress.start_time).toLocaleTimeString() : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.submissions')}</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress?.submission_history.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.successful')} {progress?.submission_history.filter(s => s.correct).length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.progress')}</CardTitle>
          <CardDescription>{t('dashboard.progressDesc')} {completedChallenges} / {totalChallenges} {t('dashboard.progressDesc2')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={completionRate} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentSubmissions')}</CardTitle>
            <CardDescription>{t('dashboard.recentSubmissionsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('dashboard.noSubmissions')}</p>
            ) : (
              <div className="space-y-3">
                {recentSubmissions.map((sub, idx) => {
                  const challenge = challenges.find(c => c.id === sub.challenge_id)
                  return (
                    <div key={idx} className="flex items-center justify-between border-b pb-2">
                      <div className="flex-1">
                        <p className="font-medium">{challenge?.name || `${t('dashboard.challenge')} ${sub.challenge_id}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sub.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={sub.correct ? 'default' : 'destructive'}>
                        {sub.correct ? t('dashboard.correct') : t('dashboard.incorrect')}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.overview')}</CardTitle>
            <CardDescription>{t('dashboard.overviewDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Easy', 'Medium', 'Hard', 'Expert'].map(difficulty => {
                const diffChallenges = challenges.filter(c => c.difficulty === difficulty)
                const completed = diffChallenges.filter(c =>
                  progress?.completed_challenges.includes(c.id)
                ).length
                const total = diffChallenges.length

                if (total === 0) return null

                return (
                  <div key={difficulty} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{t(`difficulty.${difficulty}` as any)}</span>
                      <span className="text-muted-foreground">{completed} / {total}</span>
                    </div>
                    <Progress value={(completed / total) * 100} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>{t('dashboard.quickStart')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. {t('dashboard.quickStart1')}<code className="bg-muted px-2 py-1 rounded">docker exec -it lab-attacker /bin/bash</code></p>
          <p>2. {t('dashboard.quickStart2')}<code className="bg-muted px-2 py-1 rounded">fscan -h 10.10.1.0/24</code></p>
          <p>3. {t('dashboard.quickStart3')}</p>
          <p>4. {t('dashboard.quickStart4')}</p>
        </CardContent>
      </Card>
    </div>
  )
}
