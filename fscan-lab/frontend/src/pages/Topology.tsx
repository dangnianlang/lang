import { useEffect, useState, useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getTopology, getProgress } from '@/lib/api'
import { useI18n } from '@/contexts/I18nContext'

export default function Topology() {
  const { t } = useI18n()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadTopology = useCallback(async () => {
    try {
      const [topology] = await Promise.all([getTopology(), getProgress()])

      const networkPositions: Record<string, { x: number; y: number }> = {
        internet: { x: 400, y: 50 },
        attacker: { x: 400, y: 150 },
        'web-dmz': { x: 200, y: 300 },
        'mail-dmz': { x: 350, y: 300 },
        'ftp-dmz': { x: 500, y: 300 },
        'vpn-gateway': { x: 650, y: 300 },
        'pc-vnc': { x: 100, y: 500 },
        'pc-ssh': { x: 250, y: 500 },
        'backup-server': { x: 400, y: 500 },
        'printer': { x: 550, y: 500 },
        'oldpc-telnet': { x: 700, y: 500 },
        'app-web': { x: 100, y: 700 },
        'cache-redis': { x: 250, y: 700 },
        'mq-rabbit': { x: 400, y: 700 },
        'mq-activemq': { x: 550, y: 700 },
        'search-es': { x: 700, y: 700 },
        'db-mysql': { x: 100, y: 900 },
        'db-mssql': { x: 250, y: 900 },
        'db-postgres': { x: 400, y: 900 },
        'db-mongo': { x: 550, y: 900 },
        'dc-ldap': { x: 700, y: 900 },
      }

      const getNodeColor = (status: string) => {
        switch (status) {
          case 'compromised':
            return '#ef4444'
          case 'discovered':
            return '#f59e0b'
          case 'unknown':
            return '#6b7280'
          default:
            return '#6b7280'
        }
      }

      const getNetworkLabel = (network: string) => {
        return t(`network.${network}` as any) || network
      }

      const flowNodes: Node[] = topology.nodes.map((node) => {
        const position = networkPositions[node.id] || { x: Math.random() * 800, y: Math.random() * 1000 }
        return {
          id: node.id,
          type: 'default',
          position,
          data: {
            label: (
              <div className="text-center">
                <div className="font-bold text-sm">{node.name}</div>
                <div className="text-xs text-gray-500">{node.ip}</div>
                <div className="text-xs mt-1">
                  <Badge variant="outline" className="text-xs">
                    {getNetworkLabel(node.network)}
                  </Badge>
                </div>
              </div>
            ),
            ...node,
          },
          style: {
            background: '#fff',
            border: `2px solid ${getNodeColor(node.status)}`,
            borderRadius: 8,
            padding: 10,
            width: 140,
          },
        }
      })

      const flowEdges: Edge[] = topology.edges.map((edge, idx) => ({
        id: `${edge.from}-${edge.to}-${idx}`,
        source: edge.from,
        target: edge.to,
        animated: edge.access === 'vpn',
        style: {
          stroke: edge.access === 'blocked' ? '#ef4444' : edge.access === 'vpn' ? '#3b82f6' : '#6b7280',
          strokeWidth: edge.access === 'vpn' ? 2 : 1,
          strokeDasharray: edge.access === 'blocked' ? '5,5' : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edge.access === 'blocked' ? '#ef4444' : edge.access === 'vpn' ? '#3b82f6' : '#6b7280',
        },
      }))

      setNodes(flowNodes)
      setEdges(flowEdges)
    } catch (error) {
      console.error('Failed to load topology:', error)
    } finally {
      setLoading(false)
    }
  }, [setNodes, setEdges])

  useEffect(() => {
    loadTopology()
    const interval = setInterval(loadTopology, 10000)
    return () => clearInterval(interval)
  }, [loadTopology])

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node.data)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t('dashboard.loading')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold">{t('topology.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('topology.desc')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div style={{ height: '700px' }}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={onNodeClick}
                  fitView
                >
                  <Background />
                  <Controls />
                  <MiniMap />
                </ReactFlow>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('topology.legend')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-red-500"></div>
                <span className="text-sm">{t('topology.compromised')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-orange-500"></div>
                <span className="text-sm">{t('topology.discovered')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border-2 border-gray-500"></div>
                <span className="text-sm">{t('topology.unknown')}</span>
              </div>
            </CardContent>
          </Card>

          {selectedNode ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('topology.nodeInfo')}</CardTitle>
                <CardDescription>{selectedNode.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">{t('topology.ip')}</div>
                  <div className="font-mono text-sm">{selectedNode.ip}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('challenges.network')}</div>
                  <Badge variant="outline">{t(`network.${selectedNode.network}` as any)}</Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('topology.status')}</div>
                  <Badge variant={selectedNode.status === 'compromised' ? 'destructive' : 'default'}>
                    {t(`topology.${selectedNode.status}` as any)}
                  </Badge>
                </div>
                {selectedNode.services && selectedNode.services.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">{t('topology.services')}</div>
                    <div className="space-y-1">
                      {selectedNode.services.map((service: string, idx: number) => (
                        <div key={idx} className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {service}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t('topology.nodeInfo')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{t('topology.selectNode')}</p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">攻击路径</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                <span>外网 → DMZ</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                <span>DMZ → 办公网（VPN）</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
                <span>办公网 → 生产网</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</div>
                <span>生产网 → 核心网</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
