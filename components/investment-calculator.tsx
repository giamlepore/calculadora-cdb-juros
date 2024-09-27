"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Moon, Sun, BarChart, Table, Share2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function InvestmentCalculatorComponent() {
  const [investmentType, setInvestmentType] = useState<'compound' | 'cdb'>('compound')
  const [principal, setPrincipal] = useState<number>(1000)
  const [rate, setRate] = useState<number>(5)
  const [time, setTime] = useState<number>(5)
  const [contribution, setContribution] = useState<number>(100)
  const [cdbRate, setCdbRate] = useState<number>(100)
  const [result, setResult] = useState<number | null>(null)
  const [totalInvested, setTotalInvested] = useState<number | null>(null)
  const [interestGained, setInterestGained] = useState<number | null>(null)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)
  const [showChart, setShowChart] = useState<boolean>(false)
  const [chartData, setChartData] = useState<any[]>([])
  const [isChartView, setIsChartView] = useState<boolean>(true)
  const [calculationSummary, setCalculationSummary] = useState<string | null>(null)

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  const calculateInvestment = () => {
    if (investmentType === 'compound') {
      calculateCompoundInterest()
    } else {
      calculateCDB()
    }
    updateCalculationSummary()
  }

  const calculateCompoundInterest = () => {
    const r = rate / 100 / 12
    const n = time * 12
    const compoundInterest =
      principal * Math.pow(1 + r, n) +
      contribution * ((Math.pow(1 + r, n) - 1) / r)
    const totalInvested = principal + (contribution * n)
    const interestGained = compoundInterest - totalInvested

    setResult(parseFloat(compoundInterest.toFixed(2)))
    setTotalInvested(parseFloat(totalInvested.toFixed(2)))
    setInterestGained(parseFloat(interestGained.toFixed(2)))

    const data = []
    for (let i = 0; i <= n; i++) {
      const amount =
        principal * Math.pow(1 + r, i) +
        contribution * ((Math.pow(1 + r, i) - 1) / r)
      data.push({
        month: i,
        amount: parseFloat(amount.toFixed(2))
      })
    }
    setChartData(data)
  }

  const calculateCDB = () => {
    const cdiRate = rate / 100
    const cdbYieldRate = (cdiRate * cdbRate) / 100
    const monthlyRate = Math.pow(1 + cdbYieldRate, 1/12) - 1
    const n = time * 12
    
    let totalAmount = principal
    const data = [{ month: 0, amount: principal }]
    
    for (let i = 1; i <= n; i++) {
      totalAmount = totalAmount * (1 + monthlyRate) + contribution
      data.push({
        month: i,
        amount: parseFloat(totalAmount.toFixed(2))
      })
    }

    const totalInvested = principal + (contribution * n)
    const interestGained = totalAmount - totalInvested

    setResult(parseFloat(totalAmount.toFixed(2)))
    setTotalInvested(parseFloat(totalInvested.toFixed(2)))
    setInterestGained(parseFloat(interestGained.toFixed(2)))
    setChartData(data)
  }

  const updateCalculationSummary = () => {
    let summary = `Tipo de Investimento: ${investmentType === 'compound' ? 'Juros Compostos' : 'CDB'}\n`
    summary += `Capital Inicial: R$ ${principal.toFixed(2)}\n`
    summary += `Taxa de Juros Anual: ${rate}%\n`
    summary += `Tempo: ${time} anos\n`
    summary += `Contribuição Mensal: R$ ${contribution.toFixed(2)}\n`
    if (investmentType === 'cdb') {
      summary += `Percentual do CDI: ${cdbRate}%\n`
    }
    setCalculationSummary(summary)
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const toggleChartVisibility = () => {
    setShowChart(!showChart)
  }

  const toggleChartView = () => {
    setIsChartView(!isChartView)
  }

  const shareCalculation = () => {
    const params = new URLSearchParams({
      type: investmentType,
      principal: principal.toString(),
      rate: rate.toString(),
      time: time.toString(),
      contribution: contribution.toString(),
      cdbRate: cdbRate.toString()
    })
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copiado para a área de transferência!')
    })
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col items-center justify-start p-4">
        <div className="w-full max-w-4xl mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            A calculadora mais simples (e bonita) da internet, que resolve o seu problema
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Calcule seus investimentos de forma rápida e fácil
          </p>
        </div>
        <Card className="w-full max-w-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Calculadora de Investimentos</CardTitle>
              <Button variant="outline" size="icon" onClick={toggleDarkMode}>
                {isDarkMode ? <Sun className="h-[1.2rem] w-[1.2rem]" /> : <Moon className="h-[1.2rem] w-[1.2rem]" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <Tabs value={investmentType} onValueChange={(value) => setInvestmentType(value as 'compound' | 'cdb')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="compound">Juros Compostos</TabsTrigger>
                <TabsTrigger value="cdb">CDB</TabsTrigger>
              </TabsList>
              <TabsContent value="compound">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="principal" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Capital Inicial (R$)
                    </Label>
                    <Input
                      id="principal"
                      type="number"
                      value={principal}
                      onChange={(e) => setPrincipal(Number(e.target.value))}
                      className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Taxa de Juros Anual (%)
                    </Label>
                    <Input
                      id="rate"
                      type="number"
                      value={rate}
                      onChange={(e) => setRate(Number(e.target.value))}
                      className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tempo (anos)
                    </Label>
                    <Input
                      id="time"
                      type="number"
                      value={time}
                      onChange={(e) => setTime(Number(e.target.value))}
                      className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contribution" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contribuição Mensal (R$)
                    </Label>
                    <Input
                      id="contribution"
                      type="number"
                      value={contribution}
                      onChange={(e) => setContribution(Number(e.target.value))}
                      className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="cdb">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="principal" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Capital Inicial (R$)
                    </Label>
                    <Input
                      id="principal"
                      type="number"
                      value={principal}
                      onChange={(e) => setPrincipal(Number(e.target.value))}
                      className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Taxa CDI Anual (%)
                    </Label>
                    <Input
                      id="rate"
                      type="number"
                      value={rate}
                      onChange={(e) => setRate(Number(e.target.value))}
                      className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cdbRate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Percentual do CDI (%)
                    </Label>
                    <Input
                      id="cdbRate"
                      type="number"
                      value={cdbRate}
                      onChange={(e) => setCdbRate(Number(e.target.value))}
                      className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tempo (anos)
                    </Label>
                    <Input
                      id="time"
                      type="number"
                      value={time}
                      onChange={(e) => setTime(Number(e.target.value))}
                      className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contribution" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contribuição Mensal (R$)
                    </Label>
                    <Input
                      id="contribution"
                      type="number"
                      value={contribution}
                      onChange={(e) => setContribution(Number(e.target.value))}
                      className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex space-x-2">
              <Button
                onClick={calculateInvestment}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Calcular
              </Button>
              <Button
                onClick={toggleChartVisibility}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {showChart ? 'Ocultar Gráfico' : 'Mostrar Gráfico'}
              </Button>
            </div>
            {result !== null && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Montante Final:</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    R$ {result.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Investido:</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    R$ {totalInvested?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Rendimento:</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400 animate-pulse">
                    R$ {interestGained?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                {calculationSummary && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Resumo do Cálculo:</p>
                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {calculationSummary}
                    </pre>
                  </div>
                )}
                <Button
                  onClick={shareCalculation}
                  className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center"
                >
                  <Share2 className="mr-2 h-4 w-4" /> Compartilhar Cálculo
                </Button>
              </div>
            )}
            {showChart && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Evolução do Investimento</h3>
                  <Button variant="outline" size="sm" onClick={toggleChartView}>
                    {isChartView ? <Table className="h-4 w-4" /> : <BarChart className="h-4 w-4" />}
                  </Button>
                </div>
                {isChartView ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="amount" stroke="#8884d8" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mês</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Montante (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {chartData.map((data, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{data.month}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {data.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}