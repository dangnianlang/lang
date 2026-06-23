import { useEffect, useState } from 'react'
import { Check, HelpCircle, Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getChallenges, getProgress, submitFlag, getHints, type Challenge, type Progress } from '@/lib/api'
import { useI18n } from '@/contexts/I18nContext'

export default function Challenges() {
  const { t } = useI18n()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [progress, setProgress] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<number | null>(null)
  const [flags, setFlags] = useState<Record<number, string>>({})
  const [hints, setHints] = useState<Record<number, string[]>>({})
  const [showHints, setShowHints] = useState<Record<number, boolean>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = async () => {
    try {
      const [challengesData, progressData] = await Promise.all([
        getChallenges(),
        getProgress(),
      ])
      setChallenges(challengesData)
      setProgress(progressData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (challengeId: number) => {
    const flag = flags[challengeId]?.trim()
    if (!flag) {
      setMessage({ type: 'error', text: 'Please enter a flag' })
      return
    }

    setSubmitting(challengeId)
    setMessage(null)

    try {
      const result = await submitFlag(challengeId, flag)
      if (result.correct) {
        setMessage({
          type: 'success',
          text: result.already_solved
            ? 'Already solved!'
            : `Correct! +${result.points_earned} points`,
        })
        setFlags({ ...flags, [challengeId]: '' })
        await loadData()
      } else {
        setMessage({ type: 'error', text: 'Incorrect flag. Try again!' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Submission failed' })
    } finally {
      setSubmitting(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleShowHints = async (challengeId: number) => {
    if (!hints[challengeId]) {
      const challengeHints = await getHints(challengeId)
      setHints({ ...hints, [challengeId]: challengeHints })
    }
    setShowHints({ ...showHints, [challengeId]: !showHints[challengeId] })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-500'
      case 'Medium':
        return 'bg-yellow-500'
      case 'Hard':
        return 'bg-orange-500'
      case 'Expert':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getNetworkColor = (network: string) => {
    switch (network) {
      case 'dmz':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'office':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'production':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      case 'core':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t('dashboard.loading')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">{t('challenges.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('challenges.desc')}
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-500 border border-green-500/20'
              : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {challenges.sort((a, b) => (a.order || 0) - (b.order || 0)).map((challenge) => {
          const isCompleted = progress?.completed_challenges.includes(challenge.id) || false
          const flagValue = flags[challenge.id] || ''

          return (
            <Card key={challenge.id} className={isCompleted ? 'border-green-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-xl">{t(`challenge.${challenge.id}.name` as any)}</CardTitle>
                      {isCompleted && (
                        <Check className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <CardDescription>{t(`challenge.${challenge.id}.desc` as any)}</CardDescription>
                  </div>
                  <Badge className={getDifficultyColor(challenge.difficulty)}>
                    {t(`difficulty.${challenge.difficulty}` as any)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('challenges.points')}</span>
                  <span className="font-mono font-bold">{challenge.points}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('challenges.network')}</span>
                  <Badge variant="outline" className={getNetworkColor(challenge.network)}>
                    {t(`network.${challenge.network}` as any)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('challenges.targets')}</span>
                  <span className="font-mono text-xs">{challenge.targets.join(', ')}</span>
                </div>

                {!isCompleted && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder={t('challenges.enterFlag')}
                        value={flagValue}
                        onChange={(e) =>
                          setFlags({ ...flags, [challenge.id]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSubmit(challenge.id)
                        }}
                      />
                      <Button
                        onClick={() => handleSubmit(challenge.id)}
                        disabled={submitting === challenge.id}
                      >
                        {submitting === challenge.id ? t('challenges.submitting') : t('challenges.submit')}
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => handleShowHints(challenge.id)}
                    >
                      <HelpCircle className="w-4 h-4 mr-2" />
                      {showHints[challenge.id] ? t('challenges.hideHints') : t('challenges.viewHints')}
                    </Button>
                    {showHints[challenge.id] && hints[challenge.id] && (
                      <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                        {hints[challenge.id].map((hint, idx) => (
                          <div key={idx} className="flex gap-2">
                            <Target className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                            <span>{hint}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              {isCompleted && (
                <CardFooter className="bg-green-500/10 border-t border-green-500/20">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="font-medium">{t('challenges.completed')}</span>
                  </div>
                </CardFooter>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
