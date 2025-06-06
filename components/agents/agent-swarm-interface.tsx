"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  Bot,
  Brain,
  Users,
  MessageSquare,
  Search,
  Shield,
  FileText,
  Scale,
  Zap,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"

interface Agent {
  id: string
  name: string
  type: string
  specialization: string
  status: "active" | "busy" | "idle"
  confidence: number
  tasksCompleted: number
}

interface AgentTask {
  id: string
  agentName: string
  taskType: string
  status: "pending" | "in_progress" | "completed" | "failed"
  progress: number
  startTime?: string
  endTime?: string
}

interface AgentSession {
  id: string
  sessionName: string
  status: "active" | "completed" | "paused"
  agentsInvolved: string[]
  tasksTotal: number
  tasksCompleted: number
  confidence: number
}

export function AgentSwarmInterface() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [currentSession, setCurrentSession] = useState<AgentSession | null>(null)
  const [activeTasks, setActiveTasks] = useState<AgentTask[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Initialize with mock data
    setAgents([
      {
        id: "1",
        name: "Orchestrator",
        type: "coordinator",
        specialization: "Workflow Management",
        status: "active",
        confidence: 0.95,
        tasksCompleted: 156,
      },
      {
        id: "2",
        name: "Socratic",
        type: "dialogue",
        specialization: "User Interaction",
        status: "idle",
        confidence: 0.92,
        tasksCompleted: 89,
      },
      {
        id: "3",
        name: "Legal Doctrine",
        type: "specialist",
        specialization: "Legal Analysis",
        status: "busy",
        confidence: 0.88,
        tasksCompleted: 234,
      },
      {
        id: "4",
        name: "Precedent Search",
        type: "researcher",
        specialization: "Case Law Research",
        status: "active",
        confidence: 0.91,
        tasksCompleted: 178,
      },
      {
        id: "5",
        name: "Adversarial",
        type: "critic",
        specialization: "Opposition Analysis",
        status: "idle",
        confidence: 0.87,
        tasksCompleted: 67,
      },
      {
        id: "6",
        name: "Validation",
        type: "verifier",
        specialization: "Accuracy Verification",
        status: "active",
        confidence: 0.94,
        tasksCompleted: 312,
      },
    ])
  }, [])

  const getAgentIcon = (type: string) => {
    switch (type) {
      case "coordinator":
        return <Brain className="h-5 w-5" />
      case "dialogue":
        return <MessageSquare className="h-5 w-5" />
      case "specialist":
        return <Scale className="h-5 w-5" />
      case "researcher":
        return <Search className="h-5 w-5" />
      case "critic":
        return <AlertTriangle className="h-5 w-5" />
      case "verifier":
        return <Shield className="h-5 w-5" />
      default:
        return <Bot className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "busy":
        return "bg-yellow-500"
      case "idle":
        return "bg-gray-400"
      default:
        return "bg-gray-400"
    }
  }

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const startNewSession = async () => {
    setIsProcessing(true)

    // Simulate session creation
    setTimeout(() => {
      const newSession: AgentSession = {
        id: crypto.randomUUID(),
        sessionName: `Legal Analysis Session ${Date.now()}`,
        status: "active",
        agentsInvolved: ["Orchestrator", "Legal Doctrine", "Precedent Search", "Validation"],
        tasksTotal: 8,
        tasksCompleted: 0,
        confidence: 0.0,
      }

      setCurrentSession(newSession)

      // Simulate tasks
      const tasks: AgentTask[] = [
        {
          id: "1",
          agentName: "Orchestrator",
          taskType: "analyze_request",
          status: "completed",
          progress: 100,
        },
        {
          id: "2",
          agentName: "Legal Doctrine",
          taskType: "doctrine_analysis",
          status: "in_progress",
          progress: 65,
        },
        {
          id: "3",
          agentName: "Precedent Search",
          taskType: "precedent_search",
          status: "pending",
          progress: 0,
        },
        {
          id: "4",
          agentName: "Validation",
          taskType: "accuracy_check",
          status: "pending",
          progress: 0,
        },
      ]

      setActiveTasks(tasks)
      setIsProcessing(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-xl">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              ArbiterNet™ Agent Swarm
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Multi-Agent Cognitive Collaboration System</p>
          </div>
        </div>

        <Button
          onClick={startNewSession}
          disabled={isProcessing}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {isProcessing ? (
            <>
              <Zap className="h-4 w-4 mr-2 animate-spin" />
              Initializing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Start New Session
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents">Active Agents</TabsTrigger>
          <TabsTrigger value="session">Current Session</TabsTrigger>
          <TabsTrigger value="tasks">Task Execution</TabsTrigger>
          <TabsTrigger value="communication">Agent Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getAgentIcon(agent.type)}
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{agent.specialization}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Confidence</span>
                    <Badge variant="outline">{Math.round(agent.confidence * 100)}%</Badge>
                  </div>
                  <Progress value={agent.confidence * 100} className="h-2" />

                  <div className="flex items-center justify-between text-sm">
                    <span>Tasks Completed</span>
                    <span className="font-medium">{agent.tasksCompleted}</span>
                  </div>

                  <Badge
                    variant={agent.status === "active" ? "default" : "secondary"}
                    className="w-full justify-center"
                  >
                    {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="session" className="space-y-4">
          {currentSession ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>{currentSession.sessionName}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{currentSession.agentsInvolved.length}</div>
                    <div className="text-sm text-gray-600">Agents Involved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {currentSession.tasksCompleted}/{currentSession.tasksTotal}
                    </div>
                    <div className="text-sm text-gray-600">Tasks Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(currentSession.confidence * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Confidence</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{Math.round((currentSession.tasksCompleted / currentSession.tasksTotal) * 100)}%</span>
                  </div>
                  <Progress value={(currentSession.tasksCompleted / currentSession.tasksTotal) * 100} className="h-3" />
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Participating Agents</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentSession.agentsInvolved.map((agentName) => (
                      <Badge key={agentName} variant="outline">
                        {agentName}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Active Session</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start a new agent session to see collaborative AI in action
                </p>
                <Button onClick={startNewSession} disabled={isProcessing}>
                  <Brain className="h-4 w-4 mr-2" />
                  Start New Session
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Execution Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {activeTasks.length > 0 ? (
                    activeTasks.map((task) => (
                      <div key={task.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                        <div className="flex-shrink-0">{getTaskStatusIcon(task.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{task.taskType}</h4>
                            <Badge variant="outline" className="ml-2">
                              {task.agentName}
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>{task.progress}%</span>
                            </div>
                            <Progress value={task.progress} className="h-2" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No active tasks. Start a session to see task execution.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inter-Agent Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">Orchestrator</span>
                        <span className="text-sm text-gray-500">→</span>
                        <span className="font-medium">Legal Doctrine</span>
                        <Badge variant="outline" className="text-xs">
                          Task Assignment
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Requesting analysis of contract law elements for user query
                      </p>
                      <span className="text-xs text-gray-500">2 minutes ago</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <Scale className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">Legal Doctrine</span>
                        <span className="text-sm text-gray-500">→</span>
                        <span className="font-medium">Precedent Search</span>
                        <Badge variant="outline" className="text-xs">
                          Collaboration Request
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Need relevant case law for breach of contract analysis
                      </p>
                      <span className="text-xs text-gray-500">1 minute ago</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <Search className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">Precedent Search</span>
                        <span className="text-sm text-gray-500">→</span>
                        <span className="font-medium">Validation</span>
                        <Badge variant="outline" className="text-xs">
                          Verification Request
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Found 12 relevant cases, requesting citation verification
                      </p>
                      <span className="text-xs text-gray-500">30 seconds ago</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">Adversarial</span>
                        <span className="text-sm text-gray-500">→</span>
                        <span className="font-medium">All Agents</span>
                        <Badge variant="outline" className="text-xs">
                          Challenge Alert
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Identified potential weakness in contract interpretation argument
                      </p>
                      <span className="text-xs text-gray-500">Just now</span>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
